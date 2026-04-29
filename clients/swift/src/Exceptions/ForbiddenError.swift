import Foundation

public final class ForbiddenError: ApiError, @unchecked Sendable {
    public init(_ problem: Problem) { super.init(status: 403, problem: problem) }
}
