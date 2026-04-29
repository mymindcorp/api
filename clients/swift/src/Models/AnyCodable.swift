import Foundation

/// Thin wrapper for JSON values that can be either a String or a structured object.
public struct AnyCodable: Codable, Sendable {
    public let value: any Sendable

    public init(_ value: any Sendable) { self.value = value }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let s = try? container.decode(String.self) { value = s }
        else if let d = try? container.decode([String: String].self) { value = d }
        else { value = try container.decode(String.self) }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let s = value as? String { try container.encode(s) }
        else { try container.encode(String(describing: value)) }
    }
}
