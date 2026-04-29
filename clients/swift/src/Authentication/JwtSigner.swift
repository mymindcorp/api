import CryptoKit
import Foundation

/// Generates a per-request HS256 JWT bound to the given HTTP method and path.
func signRequest(kid: String, secret: String, method: String, path: String) throws -> String {
    guard let secretData = Data(base64Encoded: secret) else {
        throw MyMindError.invalidSecret
    }

    let now = Int(Date().timeIntervalSince1970)
    let header = ["alg": "HS256", "kid": kid]
    let payload: [String: Any] = [
        "method": method.uppercased(),
        "path": path,
        "iat": now,
        "exp": now + 300,
    ]

    let headerData = try JSONSerialization.data(withJSONObject: header, options: [.sortedKeys])
    let payloadData = try JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys])

    let headerB64 = base64url(headerData)
    let payloadB64 = base64url(payloadData)
    let signingInput = "\(headerB64).\(payloadB64)"

    let key = SymmetricKey(data: secretData)
    let mac = HMAC<SHA256>.authenticationCode(
        for: Data(signingInput.utf8),
        using: key
    )
    let sigB64 = base64url(Data(mac))

    return "\(signingInput).\(sigB64)"
}

private func base64url(_ data: Data) -> String {
    data.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}
