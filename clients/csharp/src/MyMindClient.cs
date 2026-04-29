using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using MyMind.Actions;
using MyMind.Authentication;
using MyMind.Exceptions;
using MyMind.Models;
using MyMind.RateLimiting;
using MyMind.Services;

namespace MyMind;

/// <summary>
/// Top-level mymind API client.
/// </summary>
/// <example>
/// <code>
/// var client = new MyMindClient(kid, secret, "MyApp/1.0");
///
/// var objects = await client.Objects.ListAsync();
/// var obj = await client.Objects.CreateAsync(new CreateObjectRequest { Url = new Uri("https://example.com") });
/// var spaces = await client.Spaces.ListAsync();
/// var tags = await client.Tags.ListAsync();
///
/// var results = await client.SearchAsync(new SearchRequest { Q = "design", Semantic = true });
/// var md = await client.ConvertAsync(body, from: "text/plain", to: "text/markdown");
/// </code>
/// </example>
public sealed class MyMindClient
{
    private static readonly Uri BaseUri = new("https://api.mymind.com");

    private readonly string _kid;
    private readonly string _secret;
    private readonly string _userAgent;
    private readonly HttpClient _http;
    private readonly RetryPolicy _retryPolicy;

    private readonly Lock _gate = new();
    private DateTimeOffset _nextAllowedAt = DateTimeOffset.MinValue;

    public ObjectsService Objects { get; }
    public SpacesService Spaces { get; }
    public TagsService Tags { get; }

    /// <param name="kid">Key ID from the Extensions page.</param>
    /// <param name="secret">Base64-encoded 128-bit secret from the Extensions page.</param>
    /// <param name="userAgent">Sent as <c>User-Agent</c> on every request (required by the API).</param>
    /// <param name="httpClient">Optional <see cref="HttpClient"/> override (useful for testing).</param>
    /// <param name="retryPolicy">Rate-limit retry policy. Defaults to <see cref="RetryPolicy.Default"/>.</param>
    public MyMindClient(
        string kid, string secret, string userAgent,
        HttpClient? httpClient = null,
        RetryPolicy? retryPolicy = null)
    {
        _kid = kid;
        _secret = secret;
        _userAgent = userAgent;
        _http = httpClient ?? new HttpClient();
        _retryPolicy = retryPolicy ?? RetryPolicy.Default;

        Objects = new ObjectsService(this);
        Spaces = new SpacesService(this);
        Tags = new TagsService(this);
    }

    public Task<SearchResult> SearchAsync(SearchRequest req, CancellationToken ct = default)
    {
        var q = new Dictionary<string, List<string>> { ["q"] = [req.Q] };
        if (req.Limit is int l) q["limit"] = [QueryFormat.Int(l)];
        if (req.Semantic is bool s) q["semantic"] = [QueryFormat.Bool(s)];
        if (req.SemanticBoost is double b) q["semanticBoost"] = [QueryFormat.Double(b)];
        if (req.Rerank is bool r) q["rerank"] = [QueryFormat.Bool(r)];

        return SendAsync<SearchResult>(
            () => new HttpRequestMessage(HttpMethod.Get, $"/search{QueryString.Build(q)}"), ct);
    }

    public Task<string> ConvertAsync(
        string body, string from, string to,
        CancellationToken ct = default) =>
        SendAsync<string>(() =>
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "/convert")
            {
                Content = new ByteArrayContent(Encoding.UTF8.GetBytes(body))
                {
                    Headers = { ContentType = MediaTypeHeaderValue.Parse(from) },
                },
            };
            req.Headers.TryAddWithoutValidation("Accept", to);
            return req;
        }, ct);

    // -------------------------------------------------------------------------
    // Internal HTTP transport — used by services in MyMind.Services.
    // -------------------------------------------------------------------------

    /// <summary>
    /// Sends a request built by <paramref name="factory"/>, transparently:
    /// (1) waiting if a prior response indicated quota was exhausted,
    /// (2) retrying on 429 per the configured <see cref="RetryPolicy"/>.
    /// The factory is invoked once per attempt because <see cref="HttpRequestMessage"/> is single-use.
    /// </summary>
    internal async Task<T> SendAsync<T>(Func<HttpRequestMessage> factory, CancellationToken ct = default)
    {
        var attempt = 0;
        while (true)
        {
            await WaitForQuotaAsync(ct);

            try
            {
                return await DispatchAsync<T>(factory(), ct);
            }
            catch (RateLimitedException ex)
            {
                if (attempt >= _retryPolicy.MaxRetries) throw;
                attempt++;

                var exhausted = ex.States.FirstOrDefault(s => s.Remaining == 0);
                var delay = TimeSpan.FromSeconds(exhausted?.ResetSeconds ?? 1) + _retryPolicy.BufferTime;
                await Task.Delay(delay, ct);
            }
        }
    }

    internal Task SendVoidAsync(Func<HttpRequestMessage> factory, CancellationToken ct = default) =>
        SendAsync<EmptyResult>(factory, ct);

    private async Task WaitForQuotaAsync(CancellationToken ct)
    {
        DateTimeOffset until;
        lock (_gate) until = _nextAllowedAt;

        var delay = until - DateTimeOffset.UtcNow;
        if (delay > TimeSpan.Zero)
            await Task.Delay(delay, ct);
    }

    private void RecordRateLimitState(RateLimitState[] states)
    {
        var exhausted = states.FirstOrDefault(s => s.Remaining == 0);
        if (exhausted is null) return;

        var resumeAt = DateTimeOffset.UtcNow
            .AddSeconds(exhausted.ResetSeconds)
            .Add(_retryPolicy.BufferTime);

        lock (_gate)
        {
            if (resumeAt > _nextAllowedAt)
                _nextAllowedAt = resumeAt;
        }
    }

    private async Task<T> DispatchAsync<T>(HttpRequestMessage request, CancellationToken ct)
    {
        using (request)
        {
            if (request.RequestUri is null)
                throw new InvalidOperationException("Request URI must be set.");

            if (!request.RequestUri.IsAbsoluteUri)
                request.RequestUri = new Uri(BaseUri, request.RequestUri);

            var token = JwtSigner.Sign(_kid, _secret, request.Method.Method, request.RequestUri.AbsolutePath);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.TryAddWithoutValidation("User-Agent", _userAgent);

            using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseContentRead, ct);

            var content = new MemoryStream();
            await response.Content.CopyToAsync(content, ct);
            content.Position = 0;

            var states = RateLimitHeaders.ParseState(
                response.Headers.TryGetValues("RateLimit", out var rlVals) ? rlVals.FirstOrDefault() : null);
            RecordRateLimitState(states);

            if (!response.IsSuccessStatusCode)
                throw BuildException(response, content, states);

            return Deserialize<T>(response, content);
        }
    }

    private static ApiException BuildException(HttpResponseMessage response, MemoryStream body, RateLimitState[] states)
    {
        var problem = ParseProblem(response, body);
        var statusCode = (int)response.StatusCode;

        return statusCode switch
        {
            400 => new InvalidRequestException(problem),
            401 => new UnauthorizedException(problem),
            403 => new ForbiddenException(problem),
            429 => new RateLimitedException(problem, states),
            _ => new ApiException(statusCode, problem),
        };
    }

    private static Problem ParseProblem(HttpResponseMessage response, MemoryStream body)
    {
        if (body.Length > 0)
        {
            try
            {
                body.Position = 0;
                var parsed = JsonSerializer.Deserialize<Problem>(body);
                if (parsed is not null) return parsed;
            }
            catch (JsonException) { /* fall through */ }
        }

        return new Problem
        {
            Type = "https://api.mymind.com/errors/unknown",
            Title = response.ReasonPhrase ?? "Error",
            Status = (int)response.StatusCode,
            Detail = response.ReasonPhrase ?? "Unknown error",
        };
    }

    private static T Deserialize<T>(HttpResponseMessage response, MemoryStream body)
    {
        if (response.StatusCode == HttpStatusCode.NoContent || body.Length == 0)
        {
            if (typeof(T) == typeof(EmptyResult)) return (T)(object)new EmptyResult();
            if (typeof(T) == typeof(string)) return (T)(object)string.Empty;
            return default!;
        }

        body.Position = 0;

        if (typeof(T) == typeof(string)) return (T)(object)Encoding.UTF8.GetString(body.GetBuffer(), 0, (int)body.Length);
        if (typeof(T) == typeof(byte[])) return (T)(object)body.ToArray();

        if (typeof(T) == typeof(Blob))
        {
            var cd = response.Content.Headers.ContentDisposition;
            var name = cd?.FileNameStar ?? cd?.FileName?.Trim('"');
            var type = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            return (T)(object)new Blob
            {
                Stream = body,
                Type = type,
                Name = name,
            };
        }

        return JsonSerializer.Deserialize<T>(body)!;
    }
}

internal sealed class EmptyResult;

internal static class QueryString
{
    public static string Build(Dictionary<string, List<string>>? query)
    {
        if (query is null || query.Count == 0) return "";
        return "?" + string.Join('&', query.SelectMany(
            kv => kv.Value.Select(v => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(v)}")));
    }
}

internal static class QueryFormat
{
    public static string Int(int value) => value.ToString(CultureInfo.InvariantCulture);
    public static string Double(double value) => value.ToString(CultureInfo.InvariantCulture);
    public static string Bool(bool value) => value ? "true" : "false";
}
