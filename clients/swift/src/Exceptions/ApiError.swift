import Foundation

/// Base class for all HTTP-status errors returned by the API.
open class ApiError: Error, @unchecked Sendable {
    public let status: Int
    public let problem: Problem

    public init(status: Int, problem: Problem) {
        self.status = status
        self.problem = problem
    }
}
