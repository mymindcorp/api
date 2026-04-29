import Foundation

public struct SearchResult: Codable, Sendable {
    public let matches: [Match]
}
