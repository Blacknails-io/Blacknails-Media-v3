import Foundation
import Photos

struct LoginResponse: Decodable {
    let token: String
    let userId: String?
    let username: String?
    let role: String?
    let expiresAt: String?
}

struct UploadResponse: Decodable {
    let status: String
    let deviceId: String
    let filename: String
    let importPath: String
}

struct SyncAsset: Identifiable {
    let id: String
    let asset: PHAsset
    var status: SyncStatus
    var message: String

    init(asset: PHAsset, status: SyncStatus = .pending, message: String = "") {
        self.id = asset.localIdentifier
        self.asset = asset
        self.status = status
        self.message = message
    }
}

enum SyncStatus: String {
    case pending = "Pending"
    case exporting = "Exporting"
    case uploading = "Uploading"
    case uploaded = "Uploaded"
    case skipped = "Already uploaded"
    case failed = "Failed"
}
