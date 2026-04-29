import Foundation
import Testing
@testable import MyMindClient

private let testSecret = Data(count: 16).base64EncodedString()

// MARK: - URLProtocol stub for intercepting requests

final class MockURLProtocol: URLProtocol {
    nonisolated(unsafe) static var handler: ((URLRequest) throws -> (Data, HTTPURLResponse))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.handler else {
            client?.urlProtocol(self, didFailWithError: URLError(.unknown))
            return
        }
        do {
            let (data, response) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

private func mockSession() -> URLSession {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    return URLSession(configuration: config)
}

private func makeClient() -> MyMindClient {
    MyMindClient(kid: "kid1", secret: testSecret, userAgent: "TestApp/1.0", session: mockSession())
}

private func httpResponse(status: Int, headers: [String: String] = [:]) -> HTTPURLResponse {
    HTTPURLResponse(
        url: URL(string: "https://api.mymind.com")!,
        statusCode: status,
        httpVersion: "HTTP/1.1",
        headerFields: headers
    )!
}

private func jsonData(_ value: some Encodable) -> Data {
    try! JSONEncoder().encode(value)
}

// URLSession moves httpBody into httpBodyStream when routing through URLProtocol.
private func bodyData(_ request: URLRequest) -> Data {
    if let body = request.httpBody { return body }
    guard let stream = request.httpBodyStream else { return Data() }
    stream.open()
    defer { stream.close() }
    var data = Data()
    var buffer = [UInt8](repeating: 0, count: 4096)
    while stream.hasBytesAvailable {
        let n = stream.read(&buffer, maxLength: buffer.count)
        if n > 0 { data.append(contentsOf: buffer[..<n]) }
    }
    return data
}

// MARK: - Tests

@Suite("MyMindClient request building", .serialized)
struct ClientTests {
    @Test("Authorization header is Bearer JWT with three segments")
    func authHeader() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(ObjectListStub()), httpResponse(status: 200))
        }
        _ = try await makeClient().objects.list()
        let auth = captured?.value(forHTTPHeaderField: "Authorization") ?? ""
        #expect(auth.hasPrefix("Bearer "))
        #expect(auth.dropFirst(7).split(separator: ".").count == 3)
    }

    @Test("User-Agent header is set on every request")
    func userAgentHeader() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(ObjectListStub()), httpResponse(status: 200))
        }
        _ = try await makeClient().objects.list()
        #expect(captured?.value(forHTTPHeaderField: "User-Agent") == "TestApp/1.0")
    }

    @Test("list sends GET /objects")
    func listMethod() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(ObjectListStub()), httpResponse(status: 200))
        }
        _ = try await makeClient().objects.list()
        #expect(captured?.httpMethod == "GET")
        #expect(captured?.url?.path == "/objects")
    }

    @Test("list q= appears in query string")
    func listQueryParam() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(ObjectListStub()), httpResponse(status: 200))
        }
        _ = try await makeClient().objects.list(.init(q: "tag:reading"))
        let query = captured?.url?.query ?? ""
        #expect(query.contains("q=tag%3Areading") || query.contains("q=tag:reading"))
    }

    @Test("create sends POST /objects with JSON body")
    func createBody() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(MindObjectStub()), httpResponse(status: 201))
        }
        _ = try await makeClient().objects.create(.init(url: URL(string: "https://example.com")))
        #expect(captured?.httpMethod == "POST")
        let ct = captured?.value(forHTTPHeaderField: "Content-Type") ?? ""
        #expect(ct.contains("application/json"))
        let body = try JSONSerialization.jsonObject(with: bodyData(captured!)) as! [String: Any]
        #expect(body["url"] as? String == "https://example.com")
    }

    @Test("delete sends DELETE /objects/:id")
    func deleteMethod() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (Data(), httpResponse(status: 204))
        }
        try await makeClient().objects.delete("testId")
        #expect(captured?.httpMethod == "DELETE")
        #expect(captured?.url?.path.hasSuffix("/testId") == true)
    }

    @Test("httpError is thrown for 404")
    func notFoundError() async throws {
        MockURLProtocol.handler = { _ in
            let p = Problem(type: "https://api.mymind.com/errors/not-found",
                            title: "Not found", status: 404, detail: "Object not found")
            return (jsonData(p), httpResponse(status: 404))
        }
        do {
            _ = try await makeClient().objects.get("missing")
            Issue.record("Expected error not thrown")
        } catch let error as ApiError {
            #expect(error.status == 404)
        }
    }

    @Test("search passes all query parameters")
    func searchParams() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData(SearchResult(matches: [])), httpResponse(status: 200))
        }
        _ = try await makeClient().search(.init(q: "design", limit: 10, semantic: true))
        let query = captured?.url?.query ?? ""
        #expect(query.contains("q=design"))
        #expect(query.contains("limit=10"))
        #expect(query.contains("semantic=true"))
    }

    @Test("tag sends POST /objects/:id/tags with tags body")
    func tagBody() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (Data(), httpResponse(status: 204))
        }
        try await makeClient().objects.tag("id1", tags: [ObjectTag(name: "reading")])
        let body = try JSONSerialization.jsonObject(with: bodyData(captured!)) as! [String: Any]
        let tags = body["tags"] as! [[String: Any]]
        #expect(tags[0]["name"] as? String == "reading")
    }

    @Test("spaces list sends GET /spaces")
    func spacesListMethod() async throws {
        var captured: URLRequest?
        MockURLProtocol.handler = { req in
            captured = req
            return (jsonData([Space]() as [Space]), httpResponse(status: 200))
        }
        _ = try await makeClient().spaces.list()
        #expect(captured?.httpMethod == "GET")
        #expect(captured?.url?.path == "/spaces")
    }
}

// MARK: - Stubs

private struct ObjectListStub: Encodable {
    let objects: [MindObjectStub] = []
}

private struct MindObjectStub: Encodable {
    let id = "a1B2c3D4e5F6g7H8i9J0k1"
    let title = "Stub"
    let tags: [String] = []
    let bumped = "2024-01-01T00:00:00Z"
    let created = "2024-01-01T00:00:00Z"
    let modified = "2024-01-01T00:00:00Z"
}
