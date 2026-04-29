import Foundation

/// Client-side errors that are not HTTP status errors.
public enum MyMindError: Error, Sendable {
    case invalidSecret
    case decodingError(any Error)
    case unexpectedResponse
}

// MARK: - Internal HTTP transport

struct DispatchOptions {
    var method: String
    var path: String
    var queryItems: [URLQueryItem] = []
    var body: Data? = nil
    var extraHeaders: [String: String] = [:]
    var contentType: String? = nil
}

actor RateLimitGate {
    private var nextAllowedAt: Date = .distantPast

    func waitIfNeeded() async {
        let delay = nextAllowedAt.timeIntervalSinceNow
        if delay > 0 {
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        }
    }

    func record(_ states: [RateLimitState], buffer: TimeInterval) {
        guard let exhausted = states.first(where: { $0.remaining == 0 }) else { return }
        let resumeAt = Date().addingTimeInterval(TimeInterval(exhausted.resetSeconds) + buffer)
        if resumeAt > nextAllowedAt { nextAllowedAt = resumeAt }
    }
}

final class ApiHttpClient: Sendable {
    private let kid: String
    private let secret: String
    private let userAgent: String
    private let session: URLSession
    private let retryPolicy: RetryPolicy
    private let baseURL = URL(string: "https://api.mymind.com")!
    private let gate = RateLimitGate()

    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    init(
        kid: String,
        secret: String,
        userAgent: String,
        retryPolicy: RetryPolicy = .default,
        session: URLSession = .shared
    ) {
        self.kid = kid
        self.secret = secret
        self.userAgent = userAgent
        self.retryPolicy = retryPolicy
        self.session = session
    }

    func send<T: Decodable>(_ options: DispatchOptions) async throws -> T {
        try await runWithRetry {
            let (data, http, _) = try await self.dispatch(options)
            return try self.decode(data: data, http: http) as T
        }
    }

    func sendVoid(_ options: DispatchOptions) async throws {
        try await runWithRetry {
            let (_, _, _) = try await self.dispatch(options)
            return
        }
    }

    func download(_ options: DispatchOptions) async throws -> Blob {
        try await runWithRetry {
            let (data, http, _) = try await self.dispatch(options)
            let type = http.value(forHTTPHeaderField: "Content-Type") ?? "application/octet-stream"
            let cd = http.value(forHTTPHeaderField: "Content-Disposition") ?? ""
            let name = Self.extractFileName(cd)
            return Blob(data: data, type: type, name: name)
        }
    }

    private func runWithRetry<T>(_ work: @Sendable () async throws -> T) async throws -> T {
        var attempt = 0
        while true {
            await gate.waitIfNeeded()
            do {
                return try await work()
            } catch let error as RateLimitedError {
                if attempt >= retryPolicy.maxRetries { throw error }
                attempt += 1
                let exhausted = error.states.first(where: { $0.remaining == 0 })
                let delay = TimeInterval(exhausted?.resetSeconds ?? 1) + retryPolicy.buffer
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
    }

    private func dispatch(_ options: DispatchOptions) async throws -> (Data, HTTPURLResponse, [RateLimitState]) {
        var components = URLComponents(url: baseURL.appendingPathComponent(options.path), resolvingAgainstBaseURL: false)!
        if !options.queryItems.isEmpty {
            components.queryItems = options.queryItems
        }
        guard let url = components.url else { throw MyMindError.unexpectedResponse }

        let token = try signRequest(kid: kid, secret: secret, method: options.method, path: options.path)
        var req = URLRequest(url: url)
        req.httpMethod = options.method
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(userAgent, forHTTPHeaderField: "User-Agent")

        if let ct = options.contentType {
            req.setValue(ct, forHTTPHeaderField: "Content-Type")
        }
        for (key, value) in options.extraHeaders {
            req.setValue(value, forHTTPHeaderField: key)
        }
        req.httpBody = options.body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw MyMindError.unexpectedResponse }

        let states = RateLimitHeaders.parseState(http.value(forHTTPHeaderField: "RateLimit"))
        await gate.record(states, buffer: retryPolicy.buffer)

        guard (200..<300).contains(http.statusCode) else {
            throw Self.buildError(status: http.statusCode, data: data, states: states)
        }

        return (data, http, states)
    }

    private func decode<T: Decodable>(data: Data, http: HTTPURLResponse) throws -> T {
        if http.statusCode == 204, let empty = EmptyResponse() as? T {
            return empty
        }
        if T.self == Data.self, let result = data as? T { return result }
        if T.self == String.self, let str = String(data: data, encoding: .utf8) as? T { return str }

        do {
            return try Self.decoder.decode(T.self, from: data)
        } catch {
            throw MyMindError.decodingError(error)
        }
    }

    private static func buildError(status: Int, data: Data, states: [RateLimitState]) -> Error {
        let problem = (try? decoder.decode(Problem.self, from: data))
            ?? Problem(
                type: "https://api.mymind.com/errors/unknown",
                title: HTTPURLResponse.localizedString(forStatusCode: status),
                status: status,
                detail: HTTPURLResponse.localizedString(forStatusCode: status))

        switch status {
        case 400: return InvalidRequestError(problem)
        case 401: return UnauthorizedError(problem)
        case 403: return ForbiddenError(problem)
        case 429: return RateLimitedError(problem: problem, states: states)
        default:  return ApiError(status: status, problem: problem)
        }
    }

    private static func extractFileName(_ contentDisposition: String) -> String? {
        guard !contentDisposition.isEmpty else { return nil }
        let pattern = #"filename\*?=(?:UTF-8'')?"?([^";]+)"?"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
              let match = regex.firstMatch(in: contentDisposition, range: NSRange(contentDisposition.startIndex..., in: contentDisposition)),
              let range = Range(match.range(at: 1), in: contentDisposition)
        else { return nil }
        return String(contentDisposition[range])
    }
}

// MARK: - Helpers

struct EmptyResponse: Codable {
    init() {}
    init(from decoder: Decoder) throws {}
    func encode(to encoder: Encoder) throws {}
}

extension ApiHttpClient {
    func jsonBody<T: Encodable>(_ value: T) throws -> Data {
        try Self.encoder.encode(value)
    }
}
