import Foundation

public struct UpdateSpaceRequest: Codable, Sendable {
    public var name: String?
    public var color: Color?

    public init(name: String? = nil, color: Color? = nil) {
        self.name = name; self.color = color
    }
}
