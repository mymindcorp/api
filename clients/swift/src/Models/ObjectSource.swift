import Foundation

public struct ObjectSource: Codable, Sendable {
    public let url: URL

    public init(url: URL) { self.url = url }

    private enum CodingKeys: String, CodingKey {
        case url = "URL"
    }
}
