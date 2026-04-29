import Foundation

/// A binary payload — used both for uploads (on `CreateObjectRequest`)
/// and for downloads (returned by `ObjectsService.download`).
public struct Blob: Sendable {
    public let data: Data
    public let type: String
    public let name: String?

    public init(data: Data, type: String, name: String? = nil) {
        self.data = data
        self.type = type
        self.name = name
    }
}
