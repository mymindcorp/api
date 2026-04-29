using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MyMind.Authentication;

internal static class JwtSigner
{
    /// <summary>JWT lifetime in seconds. Tokens are short-lived since they are minted per request.</summary>
    private const int ExpirySeconds = 300;

    /// <summary>
    /// Generates a per-request HS256 JWT bound to the given HTTP method and path.
    /// </summary>
    /// <param name="kid">Key ID from the Extensions page.</param>
    /// <param name="secret">Base64-encoded 128-bit secret from the Extensions page.</param>
    /// <param name="method">HTTP method, uppercased.</param>
    /// <param name="path">Request path without query string.</param>
    /// <param name="timeProvider">Source of the current time. Defaults to <see cref="TimeProvider.System"/>.</param>
    public static string Sign(string kid, string secret, string method, string path, TimeProvider? timeProvider = null)
    {
        var now = (timeProvider ?? TimeProvider.System).GetUtcNow().ToUnixTimeSeconds();

        var header  = new { alg = "HS256", kid };
        var payload = new
        {
            method = method.ToUpperInvariant(),
            path,
            iat = now,
            exp = now + ExpirySeconds,
        };

        var headerB64    = Base64Url.EncodeToString(JsonSerializer.SerializeToUtf8Bytes(header));
        var payloadB64   = Base64Url.EncodeToString(JsonSerializer.SerializeToUtf8Bytes(payload));
        var signingInput = $"{headerB64}.{payloadB64}";

        var secretBytes = Convert.FromBase64String(secret);
        var sigBytes    = HMACSHA256.HashData(secretBytes, Encoding.UTF8.GetBytes(signingInput));

        return $"{signingInput}.{Base64Url.EncodeToString(sigBytes)}";
    }
}
