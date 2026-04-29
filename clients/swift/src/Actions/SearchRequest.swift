import Foundation

public struct SearchRequest: Sendable {
    public var q: String
    public var limit: Int?
    public var semantic: Bool?
    public var semanticBoost: Double?
    public var rerank: Bool?

    public init(
        q: String, limit: Int? = nil, semantic: Bool? = nil,
        semanticBoost: Double? = nil, rerank: Bool? = nil
    ) {
        self.q = q; self.limit = limit; self.semantic = semantic
        self.semanticBoost = semanticBoost; self.rerank = rerank
    }
}
