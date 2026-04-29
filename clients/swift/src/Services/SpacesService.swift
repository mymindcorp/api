import Foundation

public final class SpacesService: Sendable {
    private let client: ApiHttpClient

    init(client: ApiHttpClient) { self.client = client }

    public func list() async throws -> [Space] {
        return try await client.send(.init(method: "GET", path: "/spaces"))
    }

    public func create(_ params: CreateSpaceParams) async throws -> Space {
        let body = try client.jsonBody(params)
        return try await client.send(.init(method: "POST", path: "/spaces", body: body, contentType: "application/json"))
    }

    public func get(_ id: Uid) async throws -> Space {
        return try await client.send(.init(method: "GET", path: "/spaces/\(id)"))
    }

    public func update(_ id: Uid, _ params: UpdateSpaceParams) async throws -> Space {
        let body = try client.jsonBody(params)
        return try await client.send(.init(method: "PATCH", path: "/spaces/\(id)", body: body, contentType: "application/json"))
    }

    public func delete(_ id: Uid) async throws {
        try await client.sendVoid(.init(method: "DELETE", path: "/spaces/\(id)"))
    }

    public func addObject(spaceId: Uid, objectId: Uid) async throws {
        try await client.sendVoid(.init(method: "PUT", path: "/spaces/\(spaceId)/objects/\(objectId)"))
    }

    public func removeObject(spaceId: Uid, objectId: Uid) async throws {
        try await client.sendVoid(.init(method: "DELETE", path: "/spaces/\(spaceId)/objects/\(objectId)"))
    }
}
