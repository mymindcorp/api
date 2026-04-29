import Foundation

/// Per-policy quota state from the `RateLimit` response header.
public struct RateLimitState: Sendable, Equatable {
    public let name: String
    public let remaining: Int
    public let resetSeconds: Int

    public init(name: String, remaining: Int, resetSeconds: Int) {
        self.name = name
        self.remaining = remaining
        self.resetSeconds = resetSeconds
    }
}
