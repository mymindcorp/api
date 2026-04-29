import Foundation

public final class UnauthorizedError: ApiError, @unchecked Sendable {
    public init(_ problem: Problem) { super.init(status: 401, problem: problem) }
}
