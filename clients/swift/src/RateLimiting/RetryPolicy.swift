import Foundation

/// Controls how the client handles 429 rate-limit responses.
public struct RetryPolicy: Sendable {
    /// Maximum number of retry attempts after a 429. Default: 3.
    public var maxRetries: Int
    /// Extra time added on top of the server's reset window. Default: 1 second.
    public var buffer: TimeInterval

    public init(maxRetries: Int = 3, buffer: TimeInterval = 1) {
        self.maxRetries = maxRetries
        self.buffer = buffer
    }

    public static let `default` = RetryPolicy()
}
