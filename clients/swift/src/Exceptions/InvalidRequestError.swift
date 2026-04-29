import Foundation

public final class InvalidRequestError: ApiError, @unchecked Sendable {
    public init(_ problem: Problem) { super.init(status: 400, problem: problem) }
}
