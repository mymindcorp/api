import Foundation

/// RFC 7807 problem detail returned by the API for error responses.
public struct Problem: Codable, Sendable {
    public let type: String
    public let title: String
    public let status: Int
    public let detail: String

    public init(type: String, title: String, status: Int, detail: String) {
        self.type = type
        self.title = title
        self.status = status
        self.detail = detail
    }
}
