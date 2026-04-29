using System.Net;
using System.Text;
using System.Text.Json;
using MyMind.Actions;
using MyMind.Exceptions;
using MyMind.Models;
using MyMind.RateLimiting;
using Xunit;

namespace MyMind.Tests;

public class ClientTests
{
    // 16 zero bytes, base64-encoded
    private const string TestSecret = "AAAAAAAAAAAAAAAAAAAAAA==";

    private static (MyMindClient client, List<HttpRequestMessage> requests) MakeClient(
        Func<HttpRequestMessage, HttpResponseMessage> handler,
        RetryPolicy? retryPolicy = null)
    {
        var captured = new List<HttpRequestMessage>();
        var httpClient = new HttpClient(new LambdaHandler(req =>
        {
            captured.Add(req);
            return Task.FromResult(handler(req));
        }));
        var client = new MyMindClient("kid1", TestSecret, "TestApp/1.0", httpClient, retryPolicy);
        return (client, captured);
    }

    private static HttpResponseMessage JsonResponse(object body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"),
        };

    private static HttpResponseMessage ProblemResponse(int status, string detail = "error")
    {
        var problem = new Problem
        {
            Type   = "https://api.mymind.com/errors/test",
            Title  = "Error",
            Status = status,
            Detail = detail,
        };
        return new HttpResponseMessage((HttpStatusCode)status)
        {
            Content = new StringContent(JsonSerializer.Serialize(problem), Encoding.UTF8, "application/problem+json"),
        };
    }

    [Fact]
    public async Task Authorization_Header_Is_Bearer_Jwt()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new { objects = Array.Empty<object>() }));
        await client.Objects.ListAsync();
        var auth = reqs[0].Headers.Authorization;
        Assert.NotNull(auth);
        Assert.Equal("Bearer", auth!.Scheme);
        Assert.Equal(3, auth.Parameter!.Split('.').Length);
    }

    [Fact]
    public async Task UserAgent_Header_Is_Set()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new { objects = Array.Empty<object>() }));
        await client.Objects.ListAsync();
        Assert.Contains(reqs[0].Headers, h => h.Key == "User-Agent" && h.Value.First() == "TestApp/1.0");
    }

    [Fact]
    public async Task List_Sends_Get_Objects()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new { objects = Array.Empty<object>() }));
        await client.Objects.ListAsync();
        Assert.Equal(HttpMethod.Get, reqs[0].Method);
        Assert.Equal("/objects", reqs[0].RequestUri!.AbsolutePath);
    }

    [Fact]
    public async Task List_Passes_Query_Params()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new { objects = Array.Empty<object>() }));
        await client.Objects.ListAsync(new ListObjectsRequest { Q = "tag:reading", Limit = 50 });
        var query = reqs[0].RequestUri!.Query;
        Assert.Contains("q=tag%3Areading", query);
        Assert.Contains("limit=50", query);
    }

    [Fact]
    public async Task Create_Sends_Post_With_Json_Body()
    {
        var stub = new MindObject
        {
            Id       = "id1",
            Title    = "Title",
            Bumped   = DateTime.Parse("2024-01-01T00:00:00Z"),
            Created  = DateTime.Parse("2024-01-01T00:00:00Z"),
            Modified = DateTime.Parse("2024-01-01T00:00:00Z"),
        };
        var (client, reqs) = MakeClient(_ => JsonResponse(stub, HttpStatusCode.Created));
        await client.Objects.CreateAsync(new CreateObjectRequest { Url = new Uri("https://example.com") });
        Assert.Equal(HttpMethod.Post, reqs[0].Method);
        var body = await reqs[0].Content!.ReadAsStringAsync();
        var parsed = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("https://example.com", parsed.GetProperty("url").GetString());
        Assert.Equal("application/json",    reqs[0].Content!.Headers.ContentType!.MediaType);
    }

    [Fact]
    public async Task Delete_Sends_Delete_With_Correct_Path()
    {
        var (client, reqs) = MakeClient(_ => new HttpResponseMessage(HttpStatusCode.NoContent));
        await client.Objects.DeleteAsync("myObjectId");
        Assert.Equal(HttpMethod.Delete, reqs[0].Method);
        Assert.EndsWith("/myObjectId", reqs[0].RequestUri!.AbsolutePath);
    }

    [Fact]
    public async Task Throws_ApiException_On_404()
    {
        var (client, _) = MakeClient(_ => ProblemResponse(404, "Object not found"));
        var ex = await Assert.ThrowsAsync<ApiException>(() => client.Objects.GetAsync("missing"));
        Assert.Equal(404, ex.Status);
    }

    [Fact]
    public async Task Throws_InvalidRequestException_On_400()
    {
        var (client, _) = MakeClient(_ => ProblemResponse(400, "bad request"));
        var ex = await Assert.ThrowsAsync<InvalidRequestException>(() => client.Objects.GetAsync("x"));
        Assert.IsAssignableFrom<ApiException>(ex);
        Assert.Equal(400, ex.Status);
    }

    [Fact]
    public async Task Throws_UnauthorizedException_On_401()
    {
        var (client, _) = MakeClient(_ => ProblemResponse(401, "no creds"));
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() => client.Objects.GetAsync("x"));
        Assert.Equal(401, ex.Status);
    }

    [Fact]
    public async Task Throws_ForbiddenException_On_403()
    {
        var (client, _) = MakeClient(_ => ProblemResponse(403, "denied"));
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => client.Objects.GetAsync("x"));
        Assert.Equal(403, ex.Status);
    }

    [Fact]
    public async Task Throws_RateLimitedException_On_429_With_Parsed_States()
    {
        var (client, _) = MakeClient(_ =>
        {
            var res = ProblemResponse(429, "rate limited");
            res.Headers.Add("RateLimit", "\"burst\";r=0;t=0, \"sustained\";r=500;t=120");
            return res;
        }, retryPolicy: new RetryPolicy { MaxRetries = 0, BufferTime = TimeSpan.Zero });

        var ex = await Assert.ThrowsAsync<RateLimitedException>(() => client.Objects.ListAsync());
        Assert.Equal(2, ex.States.Length);
        Assert.Equal("burst", ex.States[0].Name);
        Assert.Equal(0,       ex.States[0].Remaining);
    }

    [Fact]
    public async Task Retries_After_429_And_Succeeds()
    {
        var callCount = 0;
        var (client, _) = MakeClient(_ =>
        {
            callCount++;
            if (callCount == 1)
            {
                var fail = ProblemResponse(429, "rate limited");
                fail.Headers.Add("RateLimit", "\"burst\";r=0;t=0");
                return fail;
            }
            return JsonResponse(new { objects = Array.Empty<object>() });
        }, retryPolicy: new RetryPolicy { MaxRetries = 3, BufferTime = TimeSpan.Zero });

        var result = await client.Objects.ListAsync();
        Assert.Equal(2, callCount);
        Assert.Empty(result);
    }

    [Fact]
    public async Task Search_Passes_All_Params()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new SearchResult { Matches = [] }));
        await client.SearchAsync(new SearchRequest { Q = "design", Semantic = true, Limit = 10 });
        var query = reqs[0].RequestUri!.Query;
        Assert.Contains("q=design",     query);
        Assert.Contains("semantic=true", query);
        Assert.Contains("limit=10",      query);
    }

    [Fact]
    public async Task Search_Formats_Doubles_With_Invariant_Culture()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(new SearchResult { Matches = [] }));
        await client.SearchAsync(new SearchRequest { Q = "x", SemanticBoost = 0.75 });
        Assert.Contains("semanticBoost=0.75", reqs[0].RequestUri!.Query);
    }

    [Fact]
    public async Task Tag_Sends_Post_With_Tags_Body()
    {
        var (client, reqs) = MakeClient(_ => new HttpResponseMessage(HttpStatusCode.NoContent));
        await client.Objects.TagAsync("id1", [new ObjectTag { Name = "reading" }]);
        var body = await reqs[0].Content!.ReadAsStringAsync();
        var parsed = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal("reading", parsed.GetProperty("tags")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task Pin_Sends_Post_To_Pin_Endpoint()
    {
        var (client, reqs) = MakeClient(_ => new HttpResponseMessage(HttpStatusCode.NoContent));
        await client.Objects.PinAsync("id1", position: 0);
        Assert.Equal(HttpMethod.Post, reqs[0].Method);
        Assert.EndsWith("/pin", reqs[0].RequestUri!.AbsolutePath);
    }

    [Fact]
    public async Task SpacesList_Sends_Get_Spaces()
    {
        var (client, reqs) = MakeClient(_ => JsonResponse(Array.Empty<Space>()));
        await client.Spaces.ListAsync();
        Assert.Equal(HttpMethod.Get, reqs[0].Method);
        Assert.Equal("/spaces", reqs[0].RequestUri!.AbsolutePath);
    }
}

// HttpContent subclass that ignores Dispose so buffered bytes remain readable
// after DispatchAsync's `using (request)` block ends.
file sealed class UndisposableContent : HttpContent
{
    private readonly byte[] _data;
    public UndisposableContent(byte[] data, string? contentType)
    {
        _data = data;
        if (contentType is not null)
            Headers.TryAddWithoutValidation("Content-Type", contentType);
    }
    protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context) =>
        stream.WriteAsync(_data, 0, _data.Length);
    protected override bool TryComputeLength(out long length) { length = _data.Length; return true; }
    protected override void Dispose(bool disposing) { /* intentionally no base call — keeps _disposed false */ }
}

file sealed class LambdaHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _handler;
    public LambdaHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler) => _handler = handler;

    // DispatchAsync wraps the request in `using`, disposing JsonContent before the test can read it.
    // Buffer into a StringContent so it survives disposal.
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        if (request.Content is { } content)
        {
            var bytes = await content.ReadAsByteArrayAsync(ct);
            var mediaType = content.Headers.ContentType?.ToString();
            request.Content = new UndisposableContent(bytes, mediaType);
        }
        return await _handler(request);
    }
}
