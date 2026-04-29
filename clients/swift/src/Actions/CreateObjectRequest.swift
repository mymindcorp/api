import Foundation

public struct CreateObjectRequest: Sendable {
    public var title: String?
    public var url: URL?
    public var content: Content?
    public var tags: [ObjectTag]?
    public var spaces: [ObjectSpace]?

    /// Optional binary payload. When set, the object is created from the bytes
    /// (multipart-style upload) and `url` / `content` are ignored.
    public var blob: Blob?

    public init(
        title: String? = nil, url: URL? = nil,
        content: Content? = nil, tags: [ObjectTag]? = nil,
        spaces: [ObjectSpace]? = nil, blob: Blob? = nil
    ) {
        self.title = title; self.url = url; self.content = content
        self.tags = tags; self.spaces = spaces; self.blob = blob
    }
}

extension CreateObjectRequest: Encodable {
    private enum CodingKeys: String, CodingKey {
        case title, url, content, tags, spaces
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(title,   forKey: .title)
        try c.encodeIfPresent(url,     forKey: .url)
        try c.encodeIfPresent(content, forKey: .content)
        try c.encodeIfPresent(tags,    forKey: .tags)
        try c.encodeIfPresent(spaces,  forKey: .spaces)
    }
}
