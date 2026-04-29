using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MyMind.Actions;
using MyMind.Models;

namespace MyMind.Services;

public sealed class ObjectsService(MyMindClient client)
{
    public async Task<List<MindObject>> ListAsync(ListObjectsRequest? req = null, CancellationToken ct = default)
    {
        var q = new Dictionary<string, List<string>>();
        if (req?.Q is string s) q["q"] = [s];
        if (req?.Ids is { Count: > 0 } ids) q["id"] = ids;
        if (req?.ContentAs is string ca) q["contentAs"] = [ca];
        if (req?.Limit is int l) q["limit"] = [QueryFormat.Int(l)];

        var res = await client.SendAsync<ObjectListResult>(
            () => new HttpRequestMessage(HttpMethod.Get, $"/objects{QueryString.Build(q)}"), ct);
        return res.Objects ?? [];
    }

    public Task<MindObject> CreateAsync(CreateObjectRequest request, CancellationToken ct = default)
    {
        if (request.Blob is { } blob)
            return client.SendAsync<MindObject>(() => BuildMultipartCreate(request, blob), ct);

        return client.SendAsync<MindObject>(() => new HttpRequestMessage(HttpMethod.Post, "/objects")
        {
            Content = JsonContent.Create(request),
        }, ct);
    }

    public Task<MindObject> GetAsync(string id, string? contentAs = null, CancellationToken ct = default)
    {
        var q = contentAs is string ca
            ? new Dictionary<string, List<string>> { ["contentAs"] = [ca] }
            : null;
        return client.SendAsync<MindObject>(
            () => new HttpRequestMessage(HttpMethod.Get, $"/objects/{id}{QueryString.Build(q)}"), ct);
    }

    public Task<MindObject> UpdateAsync(string id, UpdateObjectRequest body, CancellationToken ct = default) =>
        client.SendAsync<MindObject>(() => new HttpRequestMessage(HttpMethod.Patch, $"/objects/{id}")
        {
            Content = JsonContent.Create(body),
        }, ct);

    public Task DeleteAsync(string id, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Delete, $"/objects/{id}"), ct);

    public Task RestoreAsync(string id, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Post, $"/objects/{id}/restore")
        {
            Content = JsonContent.Create(new { }),
        }, ct);

    public async Task<List<Match>> RelatedAsync(string id, int? limit = null, CancellationToken ct = default)
    {
        var q = limit is int l
            ? new Dictionary<string, List<string>> { ["limit"] = [QueryFormat.Int(l)] }
            : null;
        var res = await client.SendAsync<MatchListResult>(
            () => new HttpRequestMessage(HttpMethod.Get, $"/objects/{id}/related{QueryString.Build(q)}"), ct);
        return res.Matches ?? [];
    }

    public Task<Blob> DownloadAsync(string id, CancellationToken ct = default) =>
        client.SendAsync<Blob>(() => new HttpRequestMessage(HttpMethod.Get, $"/objects/{id}/download"), ct);

    public Task<string> GetContentAsync(string id, string accept, CancellationToken ct = default) =>
        client.SendAsync<string>(() =>
        {
            var req = new HttpRequestMessage(HttpMethod.Get, $"/objects/{id}/content");
            req.Headers.TryAddWithoutValidation("Accept", accept);
            return req;
        }, ct);

    public Task UpdateContentAsync(string id, string body, string contentType, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Put, $"/objects/{id}/content")
        {
            Content = new ByteArrayContent(Encoding.UTF8.GetBytes(body))
            {
                Headers = { ContentType = MediaTypeHeaderValue.Parse(contentType) },
            },
        }, ct);

    public Task PinAsync(string id, int? position = null, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Post, $"/objects/{id}/pin")
        {
            Content = JsonContent.Create(new PinRequest { Position = position }),
        }, ct);

    public Task UnpinAsync(string id, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Delete, $"/objects/{id}/pin"), ct);

    public Task TagAsync(string id, List<ObjectTag> tags, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Post, $"/objects/{id}/tags")
        {
            Content = JsonContent.Create(new AddObjectTagsRequest { Tags = tags }),
        }, ct);

    public Task AddToSpacesAsync(string id, List<ObjectSpace> spaces, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Post, $"/objects/{id}/spaces")
        {
            Content = JsonContent.Create(spaces),
        }, ct);

    private static HttpRequestMessage BuildMultipartCreate(CreateObjectRequest request, Blob blob)
    {
        var multipart = new MultipartFormDataContent
        {
            { new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"), "metadata" },
        };

        var blobContent = new StreamContent(blob.Stream);
        blobContent.Headers.ContentType = MediaTypeHeaderValue.Parse(blob.Type);
        if (blob.Name is string n) multipart.Add(blobContent, "blob", n);
        else multipart.Add(blobContent, "blob");

        return new HttpRequestMessage(HttpMethod.Post, "/objects") { Content = multipart };
    }
}

file sealed class ObjectListResult
{
    [JsonPropertyName("objects")]
    public List<MindObject>? Objects { get; init; }
}

file sealed class MatchListResult
{
    [JsonPropertyName("matches")]
    public List<Match>? Matches { get; init; }
}
