import Foundation

public enum ContentFormat: Sendable {
    case plain
    case markdown
    case prose

    var mimeType: String {
        switch self {
        case .plain:    return "text/plain"
        case .markdown: return "text/markdown"
        case .prose:    return "application/prose+json"
        }
    }
}

public struct ConvertOptions: Sendable {
    public let from: ContentFormat
    public let to: ContentFormat

    public init(from: ContentFormat, to: ContentFormat) {
        self.from = from; self.to = to
    }
}
