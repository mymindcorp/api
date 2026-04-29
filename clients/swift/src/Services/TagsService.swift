import Foundation

public final class TagsService: Sendable {
    private let client: ApiHttpClient

    init(client: ApiHttpClient) { self.client = client }

    public func list(limit: Int? = nil) async throws -> [Tag] {
        var items: [URLQueryItem] = []
        if let l = limit { items.append(.init(name: "limit", value: String(l))) }
        return try await client.send(.init(method: "GET", path: "/tags", queryItems: items))
    }
}
