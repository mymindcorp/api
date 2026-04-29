import Foundation

public struct SpaceObject: Codable, Sendable {
    public let id: Uid
}

public struct Space: Codable, Sendable {
    public let id: Uid
    public let name: String
    public let color: Color
    public let created: Date
    public let objects: [SpaceObject]
}
