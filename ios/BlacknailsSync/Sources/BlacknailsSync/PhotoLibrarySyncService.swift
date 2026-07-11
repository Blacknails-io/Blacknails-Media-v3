import Photos
import SwiftUI
import UIKit

final class PhotoLibrarySyncService {
    enum SyncError: Error, LocalizedError {
        case notAuthorized
        case noResource

        var errorDescription: String? {
            switch self {
            case .notAuthorized:
                return "Photo library access was not granted."
            case .noResource:
                return "The asset does not contain an exportable original resource."
            }
        }
    }

    func requestAccess() async throws {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readOnly)
        guard status == .authorized || status == .limited else {
            throw SyncError.notAuthorized
        }
    }

    func isPhotoAccessLimited() -> Bool {
        PHPhotoLibrary.authorizationStatus(for: .readOnly) == .limited
    }

    @MainActor
    func presentLimitedLibraryPicker() {
        guard let viewController = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
        else {
            return
        }

        PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: viewController)
    }

    func fetchLatest(limit: Int) -> [SyncAsset] {
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = limit
        options.predicate = NSPredicate(
            format: "mediaType == %d OR mediaType == %d",
            PHAssetMediaType.image.rawValue,
            PHAssetMediaType.video.rawValue
        )

        let result = PHAsset.fetchAssets(with: options)
        var assets: [SyncAsset] = []
        result.enumerateObjects { asset, _, _ in
            assets.append(SyncAsset(asset: asset))
        }
        return assets
    }

    func exportOriginal(asset: PHAsset) async throws -> (fileURL: URL, filename: String) {
        guard let resource = PHAssetResource.assetResources(for: asset).first(where: { resource in
            resource.type == .photo || resource.type == .video || resource.type == .fullSizePhoto || resource.type == .fullSizeVideo
        }) else {
            throw SyncError.noResource
        }

        let safeFilename = sanitizeFilename(resource.originalFilename)
        let destination = FileManager.default.temporaryDirectory
            .appendingPathComponent("blacknails-export-\(UUID().uuidString)-\(safeFilename)")
        let options = PHAssetResourceRequestOptions()
        options.isNetworkAccessAllowed = true

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            PHAssetResourceManager.default().writeData(for: resource, toFile: destination, options: options) { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: ())
                }
            }
        }

        return (destination, safeFilename)
    }

    private func sanitizeFilename(_ filename: String) -> String {
        let base = URL(fileURLWithPath: filename).lastPathComponent
        let sanitized = base
            .replacingOccurrences(of: " ", with: "-")
            .components(separatedBy: CharacterSet(charactersIn: "/\\:"))
            .joined(separator: "-")
        return sanitized.isEmpty ? "media-\(UUID().uuidString).jpg" : sanitized
    }
}
