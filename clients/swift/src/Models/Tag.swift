import Foundation

public struct Tag: Codable, Sendable {
    public let id: Uid
    public let name: String
    public let count: Int
    public let flags: TagFlag
    public let modified: Date
}
