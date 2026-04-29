import Foundation

/// Quota and window declared by the `RateLimit-Policy` response header.
public struct RateLimitPolicy: Sendable, Equatable {
    public let name: String
    public let quota: Int
    public let windowSeconds: Int

    public init(name: String, quota: Int, windowSeconds: Int) {
        self.name = name
        self.quota = quota
        self.windowSeconds = windowSeconds
    }
}
