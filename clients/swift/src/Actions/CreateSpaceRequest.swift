import Foundation

public struct CreateSpaceRequest: Codable, Sendable {
    public let name: String
    public let color: Color?

    public init(name: String, color: Color? = nil) {
        self.name = name; self.color = color
    }
}
