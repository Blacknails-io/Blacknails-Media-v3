import Foundation
import UIKit

final class BlacknailsAPIClient {
    private let session: URLSession

    private struct LoginRequest: Encodable {
        let username: String
        let password: String
        let rememberMe: Bool
    }

    enum APIError: Error, LocalizedError {
        case invalidServerURL
        case invalidResponse
        case requestFailed(Int, String)
        case missingToken

        var errorDescription: String? {
            switch self {
            case .invalidServerURL:
                return "Invalid server URL."
            case .invalidResponse:
                return "Invalid server response."
            case .requestFailed(let status, let message):
                return "Request failed with status \(status): \(message)"
            case .missingToken:
                return "Missing authentication token."
            }
        }
    }

    init(session: URLSession = BlacknailsAPIClient.makeSession()) {
        self.session = session
    }

    func login(serverURL: String, username: String, password: String) async throws -> LoginResponse {
        let baseURL = try normalizedBaseURL(serverURL)
        var request = URLRequest(url: endpointURL(baseURL: baseURL, components: ["api", "auth", "login"]))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(LoginRequest(username: username, password: password, rememberMe: true))

        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(LoginResponse.self, from: data)
    }

    func health(serverURL: String) async throws {
        let baseURL = try normalizedBaseURL(serverURL)
        let request = URLRequest(url: endpointURL(baseURL: baseURL, components: ["health"]))
        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
    }

    func upload(serverURL: String, token: String, fileURL: URL, originalFilename: String) async throws -> UploadResponse {
        let baseURL = try normalizedBaseURL(serverURL)
        let boundary = "Boundary-\(UUID().uuidString)"
        let bodyURL = try makeMultipartBody(fileURL: fileURL, filename: originalFilename, boundary: boundary)
        defer { try? FileManager.default.removeItem(at: bodyURL) }

        var request = URLRequest(url: endpointURL(baseURL: baseURL, components: ["api", "mobile", "uploads"]))
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(UIDevice.current.name, forHTTPHeaderField: "X-Device-Id")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await session.upload(for: request, fromFile: bodyURL)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(UploadResponse.self, from: data)
    }

    private static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.waitsForConnectivity = true
        configuration.allowsCellularAccess = false
        configuration.allowsConstrainedNetworkAccess = false
        configuration.allowsExpensiveNetworkAccess = false
        configuration.timeoutIntervalForRequest = 300
        configuration.timeoutIntervalForResource = 7200
        return URLSession(configuration: configuration)
    }

    private func normalizedBaseURL(_ value: String) throws -> URL {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let inputURL = URL(string: trimmed), inputURL.scheme != nil, inputURL.host != nil else {
            throw APIError.invalidServerURL
        }
        let withoutTrailingSlash = trimmed.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: withoutTrailingSlash) else {
            throw APIError.invalidServerURL
        }
        return url
    }

    private func endpointURL(baseURL: URL, components: [String]) -> URL {
        components.reduce(baseURL) { partialURL, component in
            partialURL.appendingPathComponent(component)
        }
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "No response body"
            throw APIError.requestFailed(http.statusCode, message)
        }
    }

    private func makeMultipartBody(fileURL: URL, filename: String, boundary: String) throws -> URL {
        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("blacknails-upload-\(UUID().uuidString).body")
        _ = FileManager.default.createFile(atPath: outputURL.path, contents: nil)

        let output = try FileHandle(forWritingTo: outputURL)
        defer { try? output.close() }

        try output.write(contentsOf: Data("--\(boundary)\r\n".utf8))
        try output.write(contentsOf: Data("Content-Disposition: form-data; name=\"media\"; filename=\"\(multipartSafeFilename(filename))\"\r\n".utf8))
        try output.write(contentsOf: Data("Content-Type: application/octet-stream\r\n\r\n".utf8))

        let input = try FileHandle(forReadingFrom: fileURL)
        defer { try? input.close() }

        while true {
            let chunk = try input.read(upToCount: 1024 * 1024)
            guard let chunk, !chunk.isEmpty else { break }
            try output.write(contentsOf: chunk)
        }

        try output.write(contentsOf: Data("\r\n--\(boundary)--\r\n".utf8))
        return outputURL
    }

    private func multipartSafeFilename(_ filename: String) -> String {
        filename
            .replacingOccurrences(of: "\\", with: "-")
            .replacingOccurrences(of: "\"", with: "-")
            .replacingOccurrences(of: "\r", with: "-")
            .replacingOccurrences(of: "\n", with: "-")
    }
}
