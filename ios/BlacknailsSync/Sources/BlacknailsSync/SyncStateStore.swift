import Foundation

final class SyncStateStore {
    private let key = "uploadedAssetIdentifiers"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func contains(_ assetIdentifier: String) -> Bool {
        uploadedIdentifiers.contains(assetIdentifier)
    }

    func markUploaded(_ assetIdentifier: String) {
        var identifiers = uploadedIdentifiers
        identifiers.insert(assetIdentifier)
        defaults.set(Array(identifiers), forKey: key)
    }

    func reset() {
        defaults.removeObject(forKey: key)
    }

    private var uploadedIdentifiers: Set<String> {
        Set(defaults.stringArray(forKey: key) ?? [])
    }
}
