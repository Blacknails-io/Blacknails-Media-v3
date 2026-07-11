import Photos
import SwiftUI
import UIKit

@MainActor
final class SyncViewModel: ObservableObject {
    @Published var serverURL = UserDefaults.standard.string(forKey: "serverURL") ?? "http://192.168.1.10:3000"
    @Published var username = UserDefaults.standard.string(forKey: "username") ?? "admin"
    @Published var password = ""
    @Published var token = KeychainStore.read(account: "apiToken")
    @Published var assets: [SyncAsset] = []
    @Published var isBusy = false
    @Published var message = "Ready"
    @Published var fetchLimit = max(UserDefaults.standard.integer(forKey: "fetchLimit"), 50)
    @Published var currentUploadNumber = 0
    @Published var currentUploadTotal = 0
    @Published var isPhotoAccessLimited = false
    @Published var isSyncing = false

    private let api = BlacknailsAPIClient()
    private let photos = PhotoLibrarySyncService()
    private let syncState = SyncStateStore()
    private var syncTask: Task<Void, Never>?

    var isLoggedIn: Bool {
        token?.isEmpty == false
    }

    var pendingCount: Int {
        assets.filter { $0.status == .pending || $0.status == .failed }.count
    }

    var uploadedCount: Int {
        assets.filter { $0.status == .uploaded }.count
    }

    var skippedCount: Int {
        assets.filter { $0.status == .skipped }.count
    }

    var failedCount: Int {
        assets.filter { $0.status == .failed }.count
    }

    var canUploadPending: Bool {
        isLoggedIn && !isBusy && pendingCount > 0
    }

    var uploadButtonTitle: String {
        pendingCount == 0 ? "No Pending Assets" : "Upload Pending (\(pendingCount))"
    }

    var progressMessage: String {
        guard currentUploadTotal > 0 else {
            return message
        }
        return "\(message) (\(currentUploadNumber)/\(currentUploadTotal))"
    }

    func testConnection() async {
        isBusy = true
        defer { isBusy = false }

        do {
            try await api.health(serverURL: serverURL)
            UserDefaults.standard.set(serverURL, forKey: "serverURL")
            message = "Server reachable"
        } catch {
            message = error.localizedDescription
        }
    }

    func login() async {
        isBusy = true
        defer { isBusy = false }

        do {
            let response = try await api.login(serverURL: serverURL, username: username, password: password)
            try KeychainStore.save(response.token, account: "apiToken")
            UserDefaults.standard.set(serverURL, forKey: "serverURL")
            UserDefaults.standard.set(username, forKey: "username")
            token = response.token
            password = ""
            message = "Logged in"
        } catch {
            message = error.localizedDescription
        }
    }

    func logout() {
        KeychainStore.delete(account: "apiToken")
        token = nil
        message = "Logged out"
    }

    func handleDeepLink(_ url: URL) {
        guard url.scheme == "blacknailssync" else {
            return
        }

        let isConfigureURL = url.host == "configure" || url.path == "/configure"
        guard isConfigureURL,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let server = components.queryItems?.first(where: { $0.name == "server" })?.value,
              let candidateURL = URL(string: server),
              let scheme = candidateURL.scheme,
              ["http", "https"].contains(scheme),
              candidateURL.host != nil
        else {
            message = "Invalid configuration link"
            return
        }

        serverURL = server
        UserDefaults.standard.set(server, forKey: "serverURL")
        message = "Server URL configured"
    }

    func increaseFetchLimit() async {
        fetchLimit += 50
        await loadLatest()
    }

    func loadLatest() async {
        isBusy = true
        defer { isBusy = false }

        do {
            try await photos.requestAccess()
            isPhotoAccessLimited = photos.isPhotoAccessLimited()
            UserDefaults.standard.set(fetchLimit, forKey: "fetchLimit")
            assets = photos.fetchLatest(limit: fetchLimit).map { item in
                if syncState.contains(item.id) {
                    return SyncAsset(asset: item.asset, status: .skipped, message: "Stored on this device")
                }
                return item
            }
            message = "Loaded \(assets.count) assets, \(pendingCount) pending"
        } catch {
            message = error.localizedDescription
        }
    }

    func managePhotoAccess() async {
        do {
            try await photos.requestAccess()
            isPhotoAccessLimited = photos.isPhotoAccessLimited()
            photos.presentLimitedLibraryPicker()
            message = "Photo access picker opened"
        } catch {
            message = error.localizedDescription
        }
    }

    func setIdleTimerDisabled(_ isDisabled: Bool) {
        UIApplication.shared.isIdleTimerDisabled = isDisabled
    }

    func startSync() {
        guard syncTask == nil else {
            return
        }

        syncTask = Task {
            await syncAll()
            syncTask = nil
        }
    }

    func cancelSync() {
        syncTask?.cancel()
        message = "Cancelling sync"
    }

    private func syncAll() async {
        guard let token else {
            message = "Login first"
            return
        }

        isBusy = true
        isSyncing = true
        let uploadIndices = assets.indices.filter { assets[$0].status == .pending || assets[$0].status == .failed }
        currentUploadNumber = 0
        currentUploadTotal = uploadIndices.count
        setIdleTimerDisabled(true)
        defer {
            setIdleTimerDisabled(false)
            isSyncing = false
            isBusy = false
            currentUploadNumber = 0
            currentUploadTotal = 0
        }

        for (offset, index) in uploadIndices.enumerated() {
            if Task.isCancelled {
                message = "Sync cancelled"
                break
            }

            currentUploadNumber = offset + 1
            assets[index].status = .exporting
            assets[index].message = ""
            message = "Exporting"

            do {
                let exported = try await photos.exportOriginal(asset: assets[index].asset)
                defer { try? FileManager.default.removeItem(at: exported.fileURL) }

                assets[index].status = .uploading
                message = "Uploading"
                let response = try await api.upload(
                    serverURL: serverURL,
                    token: token,
                    fileURL: exported.fileURL,
                    originalFilename: exported.filename
                )

                assets[index].status = .uploaded
                assets[index].message = response.filename
                syncState.markUploaded(assets[index].id)
            } catch {
                if Task.isCancelled {
                    assets[index].status = .pending
                    assets[index].message = "Cancelled"
                    message = "Sync cancelled"
                    break
                }
                assets[index].status = .failed
                assets[index].message = error.localizedDescription
            }
        }

        if !Task.isCancelled {
            message = "Sync finished: \(uploadedCount) uploaded, \(failedCount) failed, \(skippedCount) already stored"
        }
    }

    func resetLocalSyncState() {
        syncState.reset()
        assets = assets.map { SyncAsset(asset: $0.asset, status: .pending) }
        message = "Local sync history cleared"
    }
}

struct ContentView: View {
    @StateObject private var viewModel = SyncViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    TextField("Server URL", text: $viewModel.serverURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Username", text: $viewModel.username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Password", text: $viewModel.password)

                    Button("Test Connection") {
                        Task { await viewModel.testConnection() }
                    }
                    .disabled(viewModel.isBusy)

                    if viewModel.isLoggedIn {
                        Button("Logout", role: .destructive) {
                            viewModel.logout()
                        }
                    } else {
                        Button("Login") {
                            Task { await viewModel.login() }
                        }
                    }
                }

                Section("Sync") {
                    Stepper("Library window: \(viewModel.fetchLimit)", value: $viewModel.fetchLimit, in: 50...5000, step: 50)
                        .disabled(viewModel.isBusy)

                    Button("Load Latest \(viewModel.fetchLimit)") {
                        Task { await viewModel.loadLatest() }
                    }
                    .disabled(!viewModel.isLoggedIn || viewModel.isBusy)

                    Button("Load 50 More") {
                        Task { await viewModel.increaseFetchLimit() }
                    }
                    .disabled(!viewModel.isLoggedIn || viewModel.isBusy)

                    if viewModel.isPhotoAccessLimited {
                        Button("Manage Photo Access") {
                            Task { await viewModel.managePhotoAccess() }
                        }
                        .disabled(viewModel.isBusy)
                    }

                    if viewModel.isSyncing {
                        Button("Cancel Upload", role: .destructive) {
                            viewModel.cancelSync()
                        }
                    }

                    Button(viewModel.uploadButtonTitle) {
                        viewModel.startSync()
                    }
                    .disabled(!viewModel.canUploadPending)

                    Button("Reset Local Sync History", role: .destructive) {
                        viewModel.resetLocalSyncState()
                    }
                    .disabled(viewModel.isBusy)

                    HStack {
                        SyncCountLabel(title: "Pending", value: viewModel.pendingCount)
                        SyncCountLabel(title: "Uploaded", value: viewModel.uploadedCount)
                        SyncCountLabel(title: "Failed", value: viewModel.failedCount)
                        SyncCountLabel(title: "Stored", value: viewModel.skippedCount)
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)

                    Text(viewModel.progressMessage)
                        .foregroundStyle(.secondary)
                }

                Section("Assets") {
                    ForEach(viewModel.assets) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.asset.creationDate?.formatted(date: .abbreviated, time: .shortened) ?? "No date")
                            Text(item.status.rawValue)
                                .font(.caption)
                                .foregroundStyle(color(for: item.status))
                            if !item.message.isEmpty {
                                Text(item.message)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Blacknails Sync")
            .overlay {
                if viewModel.isBusy {
                    ProgressView()
                        .padding()
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .onOpenURL { url in
                viewModel.handleDeepLink(url)
            }
        }
    }

    private func color(for status: SyncStatus) -> Color {
        switch status {
        case .pending:
            return .secondary
        case .exporting, .uploading:
            return .blue
        case .uploaded, .skipped:
            return .green
        case .failed:
            return .red
        }
    }
}

private struct SyncCountLabel: View {
    let title: String
    let value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(value)")
                .font(.headline)
            Text(title)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
