import Foundation

public final class RateLimitedError: ApiError, @unchecked Sendable {
    public let states: [RateLimitState]

    public init(problem: Problem, states: [RateLimitState]) {
        self.states = states
        super.init(status: 429, problem: problem)
    }
}
