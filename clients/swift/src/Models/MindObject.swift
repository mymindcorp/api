import Foundation

public struct ObjectTag: Codable, Sendable {
    public let name: String
    public let flags: TagFlag?

    public init(name: String, flags: TagFlag? = nil) {
        self.name = name
        self.flags = flags
    }
}

public struct ObjectSpace: Codable, Sendable {
    public let id: Uid

    public init(id: Uid) { self.id = id }
}

public struct ObjectNote: Codable, Sendable {
    public let id: Uid
    public let body: String
}

public struct MindObject: Codable, Sendable {
    public let id: Uid
    public let title: String
    public let content: Content?
    public let spaces: [ObjectSpace]?
    public let tags: [ObjectTag]
    public let notes: [ObjectNote]?
    public let source: ObjectSource?
    public let bumped: Date
    public let created: Date
    public let modified: Date
    public let deleted: Date?
}
