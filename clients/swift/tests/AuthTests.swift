import CryptoKit
import Foundation
import Testing
@testable import MyMindClient

// 16 zero bytes, base64-encoded
private let testSecret = Data(count: 16).base64EncodedString()
private let testKid = "testkey01"

@Suite("JWT signing")
struct AuthTests {
    @Test("produces a three-segment JWT")
    func threeSegments() throws {
        let jwt = try signRequest(kid: testKid, secret: testSecret, method: "GET", path: "/objects")
        #expect(jwt.split(separator: ".").count == 3)
    }

    @Test("header contains alg=HS256 and the supplied kid")
    func headerClaims() throws {
        let jwt = try signRequest(kid: testKid, secret: testSecret, method: "GET", path: "/objects")
        let headerSeg = String(jwt.split(separator: ".")[0])
        let header = try decodeSegment(headerSeg)
        #expect(header["alg"] as? String == "HS256")
        #expect(header["kid"] as? String == testKid)
    }

    @Test("payload encodes method, path, iat, exp")
    func payloadClaims() throws {
        let before = Int(Date().timeIntervalSince1970)
        let jwt = try signRequest(kid: testKid, secret: testSecret, method: "post", path: "/objects")
        let after = Int(Date().timeIntervalSince1970)

        let payload = try decodeSegment(String(jwt.split(separator: ".")[1]))
        #expect(payload["method"] as? String == "POST")
        #expect(payload["path"] as? String == "/objects")
        let iat = payload["iat"] as! Int
        let exp = payload["exp"] as! Int
        #expect(iat >= before && iat <= after)
        #expect(exp == iat + 300)
    }

    @Test("no base64 padding characters")
    func noPadding() throws {
        let jwt = try signRequest(kid: testKid, secret: testSecret, method: "GET", path: "/objects")
        #expect(!jwt.contains("="))
    }

    @Test("signature is valid HMAC-SHA256")
    func signatureValid() throws {
        let jwt = try signRequest(kid: testKid, secret: testSecret, method: "GET", path: "/objects")
        let parts = jwt.split(separator: ".")
        let signingInput = "\(parts[0]).\(parts[1])"
        let secretData = Data(base64Encoded: testSecret)!
        let key = SymmetricKey(data: secretData)
        let mac = HMAC<SHA256>.authenticationCode(for: Data(signingInput.utf8), using: key)
        let expected = Data(mac)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        #expect(String(parts[2]) == expected)
    }

    @Test("different methods produce different signatures")
    func differentMethods() throws {
        let get = try signRequest(kid: testKid, secret: testSecret, method: "GET", path: "/objects")
        let post = try signRequest(kid: testKid, secret: testSecret, method: "POST", path: "/objects")
        let getSig = String(get.split(separator: ".")[2])
        let postSig = String(post.split(separator: ".")[2])
        #expect(getSig != postSig)
    }
}

// MARK: - Helpers

private func decodeSegment(_ seg: String) throws -> [String: Any] {
    var padded = seg
        .replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")
    while padded.count % 4 != 0 { padded += "=" }
    let data = Data(base64Encoded: padded)!
    return try JSONSerialization.jsonObject(with: data) as! [String: Any]
}
