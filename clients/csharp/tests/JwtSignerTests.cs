using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Time.Testing;
using MyMind.Authentication;
using Xunit;

namespace MyMind.Tests;

public class JwtSignerTests
{
    // 16 zero bytes, base64-encoded
    private const string TestSecret = "AAAAAAAAAAAAAAAAAAAAAA==";
    private const string TestKid    = "testkey01";

    private static (string header, string payload, string sig) SplitJwt(string jwt)
    {
        var parts = jwt.Split('.');
        Assert.Equal(3, parts.Length);
        return (parts[0], parts[1], parts[2]);
    }

    private static Dictionary<string, JsonElement> DecodeSegment(string b64url)
    {
        var bytes = Base64Url.DecodeFromChars(b64url);
        return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(bytes)!;
    }

    [Fact]
    public void Produces_Three_Segment_Jwt()
    {
        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects");
        Assert.Equal(3, jwt.Split('.').Length);
    }

    [Fact]
    public void Header_Contains_Alg_And_Kid()
    {
        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects");
        var (headerSeg, _, _) = SplitJwt(jwt);
        var header = DecodeSegment(headerSeg);
        Assert.Equal("HS256", header["alg"].GetString());
        Assert.Equal(TestKid, header["kid"].GetString());
    }

    [Fact]
    public void Payload_Contains_Method_Path_Iat_Exp()
    {
        var before = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var jwt    = JwtSigner.Sign(TestKid, TestSecret, "post", "/objects");
        var after  = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var (_, payloadSeg, _) = SplitJwt(jwt);
        var payload = DecodeSegment(payloadSeg);
        Assert.Equal("POST",     payload["method"].GetString());
        Assert.Equal("/objects", payload["path"].GetString());

        var iat = payload["iat"].GetInt64();
        var exp = payload["exp"].GetInt64();
        Assert.InRange(iat, before, after);
        Assert.Equal(iat + 300, exp);
    }

    [Fact]
    public void Jwt_Contains_No_Padding_Characters()
    {
        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects");
        Assert.DoesNotContain('=', jwt);
    }

    [Fact]
    public void Signature_Is_Valid_Hmac_Sha256()
    {
        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects");
        var (headerSeg, payloadSeg, sigSeg) = SplitJwt(jwt);
        var signingInput = $"{headerSeg}.{payloadSeg}";

        var secretBytes = Convert.FromBase64String(TestSecret);
        var expected    = Base64Url.EncodeToString(
            HMACSHA256.HashData(secretBytes, Encoding.UTF8.GetBytes(signingInput)));

        Assert.Equal(expected, sigSeg);
    }

    [Fact]
    public void Different_Methods_Produce_Different_Signatures()
    {
        var get  = JwtSigner.Sign(TestKid, TestSecret, "GET",  "/objects");
        var post = JwtSigner.Sign(TestKid, TestSecret, "POST", "/objects");
        Assert.NotEqual(get.Split('.')[2], post.Split('.')[2]);
    }

    [Fact]
    public void Different_Paths_Produce_Different_Signatures()
    {
        var a = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects");
        var b = JwtSigner.Sign(TestKid, TestSecret, "GET", "/spaces");
        Assert.NotEqual(a.Split('.')[2], b.Split('.')[2]);
    }

    [Fact]
    public void Generates_Exact_Token_For_Fixed_Time()
    {
        var fixedTime = new DateTimeOffset(2026, 4, 29, 12, 34, 56, TimeSpan.Zero);
        var fake = new FakeTimeProvider(fixedTime);

        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects", fake);

        const string expected =
            "eyJhbGciOiJIUzI1NiIsImtpZCI6InRlc3RrZXkwMSJ9" +
            ".eyJtZXRob2QiOiJHRVQiLCJwYXRoIjoiL29iamVjdHMiLCJpYXQiOjE3Nzc0NjYwOTYsImV4cCI6MTc3NzQ2NjM5Nn0" +
            ".-WMW4RjQUW-HpcA279EbMaXtHq95pc2OEA-JYoNSMpU";
        Assert.Equal(expected, jwt);
    }

    [Fact]
    public void Iat_And_Exp_Use_Supplied_TimeProvider()
    {
        var fixedTime = new DateTimeOffset(2026, 4, 29, 12, 34, 56, TimeSpan.Zero);
        var fake = new FakeTimeProvider(fixedTime);

        var jwt = JwtSigner.Sign(TestKid, TestSecret, "GET", "/objects", fake);

        var (_, payloadSeg, _) = SplitJwt(jwt);
        var payload = DecodeSegment(payloadSeg);

        Assert.Equal(fixedTime.ToUnixTimeSeconds(),       payload["iat"].GetInt64());
        Assert.Equal(fixedTime.ToUnixTimeSeconds() + 300, payload["exp"].GetInt64());
    }
}
