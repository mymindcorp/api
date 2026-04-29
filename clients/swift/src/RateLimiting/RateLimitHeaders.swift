import Foundation

/// Parses the `RateLimit-Policy`, `RateLimit`, and `RateLimit-Cost` response headers.
///
/// Header format:
/// ```
/// RateLimit-Policy: "burst";q=10000;w=300, "sustained";q=100000;w=2592000
/// RateLimit:        "burst";r=9990;t=300,  "sustained";r=99641;t=2589945
/// RateLimit-Cost:   10
/// ```
public enum RateLimitHeaders {
    public static func parsePolicy(_ header: String?) -> [RateLimitPolicy] {
        splitEntries(header).compactMap { entry in
            let tokens = tokens(of: entry)
            guard let name = tokens.first.map({ $0.trimmingCharacters(in: .init(charactersIn: "\"")) }),
                  let q = intParam(tokens, key: "q"),
                  let w = intParam(tokens, key: "w")
            else { return nil }
            return RateLimitPolicy(name: name, quota: q, windowSeconds: w)
        }
    }

    public static func parseState(_ header: String?) -> [RateLimitState] {
        splitEntries(header).compactMap { entry in
            let tokens = tokens(of: entry)
            guard let name = tokens.first.map({ $0.trimmingCharacters(in: .init(charactersIn: "\"")) }),
                  let r = intParam(tokens, key: "r"),
                  let t = intParam(tokens, key: "t")
            else { return nil }
            return RateLimitState(name: name, remaining: r, resetSeconds: t)
        }
    }

    public static func parseCost(_ header: String?) -> Int {
        Int(header?.trimmingCharacters(in: .whitespaces) ?? "") ?? 0
    }

    // MARK: - Internals

    private static func splitEntries(_ header: String?) -> [String] {
        guard let header, !header.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }
        return header.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
    }

    private static func tokens(of entry: String) -> [String] {
        entry.split(separator: ";").map { $0.trimmingCharacters(in: .whitespaces) }
    }

    private static func intParam(_ tokens: [String], key: String) -> Int? {
        let prefix = "\(key)="
        guard let token = tokens.dropFirst().first(where: { $0.hasPrefix(prefix) }) else { return nil }
        return Int(token.dropFirst(prefix.count))
    }
}
