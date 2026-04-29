import Foundation

public struct ListObjectsRequest: Sendable {
    public var q: String?
    public var ids: [Uid]?
    public var contentAs: String?
    public var limit: Int?

    public init(q: String? = nil, ids: [Uid]? = nil, contentAs: String? = nil, limit: Int? = nil) {
        self.q = q; self.ids = ids; self.contentAs = contentAs; self.limit = limit
    }
}
