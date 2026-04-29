import Foundation

public final class ObjectsService: Sendable {
    private let client: ApiHttpClient

    init(client: ApiHttpClient) { self.client = client }

    public func list(_ req: ListObjectsRequest = .init()) async throws -> [MindObject] {
        var items: [URLQueryItem] = []
        if let q = req.q { items.append(.init(name: "q", value: q)) }
        if let ids = req.ids { ids.forEach { items.append(.init(name: "id", value: $0)) } }
        if let ca = req.contentAs { items.append(.init(name: "contentAs", value: ca)) }
        if let l = req.limit { items.append(.init(name: "limit", value: String(l))) }

        let res: ObjectListResult = try await client.send(.init(method: "GET", path: "/objects", queryItems: items))
        return res.objects ?? []
    }

    public func create(_ request: CreateObjectRequest) async throws -> MindObject {
        if let blob = request.blob {
            let (body, contentType) = try buildMultipartCreate(request: request, blob: blob)
            return try await client.send(.init(method: "POST", path: "/objects", body: body, contentType: contentType))
        }
        let body = try client.jsonBody(request)
        return try await client.send(.init(method: "POST", path: "/objects", body: body, contentType: "application/json"))
    }

    public func get(_ id: Uid, contentAs: String? = nil) async throws -> MindObject {
        var items: [URLQueryItem] = []
        if let ca = contentAs { items.append(.init(name: "contentAs", value: ca)) }
        return try await client.send(.init(method: "GET", path: "/objects/\(id)", queryItems: items))
    }

    public func update(_ id: Uid, _ req: UpdateObjectRequest) async throws -> MindObject {
        let body = try client.jsonBody(req)
        return try await client.send(.init(method: "PATCH", path: "/objects/\(id)", body: body, contentType: "application/json"))
    }

    public func delete(_ id: Uid) async throws {
        try await client.sendVoid(.init(method: "DELETE", path: "/objects/\(id)"))
    }

    public func restore(_ id: Uid) async throws {
        try await client.sendVoid(.init(method: "POST", path: "/objects/\(id)/restore", body: Data("{}".utf8), contentType: "application/json"))
    }

    public func related(_ id: Uid, limit: Int? = nil) async throws -> [Match] {
        var items: [URLQueryItem] = []
        if let l = limit { items.append(.init(name: "limit", value: String(l))) }
        let res: MatchListResult = try await client.send(.init(method: "GET", path: "/objects/\(id)/related", queryItems: items))
        return res.matches ?? []
    }

    public func download(_ id: Uid) async throws -> Blob {
        return try await client.download(.init(method: "GET", path: "/objects/\(id)/download"))
    }

    public func getContent(_ id: Uid, accept: String) async throws -> String {
        return try await client.send(.init(method: "GET", path: "/objects/\(id)/content", extraHeaders: ["Accept": accept]))
    }

    public func updateContent(_ id: Uid, body: String, contentType: String) async throws {
        let data = Data(body.utf8)
        try await client.sendVoid(.init(method: "PUT", path: "/objects/\(id)/content", body: data, contentType: contentType))
    }

    public func pin(_ id: Uid, position: Int? = nil) async throws {
        struct PinBody: Encodable { let position: Int? }
        let body = try client.jsonBody(PinBody(position: position))
        try await client.sendVoid(.init(method: "POST", path: "/objects/\(id)/pin", body: body, contentType: "application/json"))
    }

    public func unpin(_ id: Uid) async throws {
        try await client.sendVoid(.init(method: "DELETE", path: "/objects/\(id)/pin"))
    }

    public func tag(_ id: Uid, tags: [ObjectTag]) async throws {
        struct TagBody: Encodable { let tags: [ObjectTag] }
        let body = try client.jsonBody(TagBody(tags: tags))
        try await client.sendVoid(.init(method: "POST", path: "/objects/\(id)/tags", body: body, contentType: "application/json"))
    }

    public func addToSpaces(_ id: Uid, spaces: [ObjectSpace]) async throws {
        let body = try client.jsonBody(spaces)
        try await client.sendVoid(.init(method: "POST", path: "/objects/\(id)/spaces", body: body, contentType: "application/json"))
    }

    private func buildMultipartCreate(request: CreateObjectRequest, blob: Blob) throws -> (Data, String) {
        let boundary = UUID().uuidString
        let metadataJSON = try client.jsonBody(request)
        let blobName = blob.name ?? "blob"

        var body = Data()
        let boundaryLine = "--\(boundary)\r\n".data(using: .utf8)!

        body.append(boundaryLine)
        body.append("Content-Disposition: form-data; name=\"metadata\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: application/json\r\n\r\n".data(using: .utf8)!)
        body.append(metadataJSON)
        body.append("\r\n".data(using: .utf8)!)

        body.append(boundaryLine)
        body.append("Content-Disposition: form-data; name=\"blob\"; filename=\"\(blobName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(blob.type)\r\n\r\n".data(using: .utf8)!)
        body.append(blob.data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        return (body, "multipart/form-data; boundary=\(boundary)")
    }
}

// MARK: - Private response wrappers

private struct ObjectListResult: Decodable {
    let objects: [MindObject]?
}

private struct MatchListResult: Decodable {
    let matches: [Match]?
}
