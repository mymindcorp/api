import Foundation

public struct UpdateObjectRequest: Codable, Sendable {
    public var title: String?
    public var tags: [ObjectTag]?
    public var spaces: [ObjectSpace]?

    public init(title: String? = nil, tags: [ObjectTag]? = nil, spaces: [ObjectSpace]? = nil) {
        self.title = title; self.tags = tags; self.spaces = spaces
    }
}
