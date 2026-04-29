import Foundation

/// Top-level mymind API client.
///
/// ```swift
/// let client = MyMindClient(kid: "...", secret: "...", userAgent: "MyApp/1.0")
///
/// let objects = try await client.objects.list()
/// let obj = try await client.objects.create(.init(url: "https://example.com"))
/// let spaces = try await client.spaces.list()
/// let tags = try await client.tags.list()
///
/// let results = try await client.search(.init(q: "design && tag:reading", semantic: true))
/// let md = try await client.convert("Hello", options: .init(from: .plain, to: .markdown))
/// ```
public final class MyMindClient: Sendable {
    public let objects: ObjectsService
    public let spaces: SpacesService
    public let tags: TagsService

    private let http: ApiHttpClient

    /// - Parameters:
    ///   - kid:         Key ID from the Extensions page.
    ///   - secret:      Base64-encoded 128-bit secret from the Extensions page.
    ///   - userAgent:   Sent as `User-Agent` on every request (required by the API).
    ///   - retryPolicy: Rate-limit retry policy. Defaults to `RetryPolicy.default`.
    ///   - session:     Optional URLSession override (useful for testing).
    public init(
        kid: String,
        secret: String,
        userAgent: String,
        retryPolicy: RetryPolicy = .default,
        session: URLSession = .shared
    ) {
        http = ApiHttpClient(kid: kid, secret: secret, userAgent: userAgent, retryPolicy: retryPolicy, session: session)
        objects = ObjectsService(client: http)
        spaces = SpacesService(client: http)
        tags = TagsService(client: http)
    }

    public func search(_ req: SearchRequest) async throws -> SearchResult {
        var items: [URLQueryItem] = [.init(name: "q", value: req.q)]
        if let l = req.limit { items.append(.init(name: "limit", value: String(l))) }
        if let s = req.semantic { items.append(.init(name: "semantic", value: String(s))) }
        if let sb = req.semanticBoost { items.append(.init(name: "semanticBoost", value: String(sb))) }
        if let r = req.rerank { items.append(.init(name: "rerank", value: String(r))) }
        return try await http.send(.init(method: "GET", path: "/search", queryItems: items))
    }

    public func convert(_ body: String, options: ConvertOptions) async throws -> String {
        let data = Data(body.utf8)
        var opts = DispatchOptions(method: "POST", path: "/convert", body: data, contentType: options.from.mimeType)
        opts.extraHeaders["Accept"] = options.to.mimeType
        return try await http.send(opts)
    }
}
