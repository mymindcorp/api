import Foundation

public struct Content: Codable, Sendable {
    public enum ContentType: String, Codable, Sendable {
        case markdown = "text/markdown"
        case plain    = "text/plain"
        case prose    = "application/prose+json"
    }

    public let type: ContentType
    public let body: AnyCodable

    public init(type: ContentType, body: AnyCodable) {
        self.type = type
        self.body = body
    }
}
