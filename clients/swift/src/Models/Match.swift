import Foundation

public struct Match: Codable, Sendable {
    public let id: Uid
    public let score: Double
    public let semanticScore: Double?
}
