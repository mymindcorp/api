using MyMind.Models;

namespace MyMind.Services;

public sealed class TagsService(MyMindClient client)
{
    public Task<List<Tag>> ListAsync(int? limit = null, CancellationToken ct = default)
    {
        var q = limit is int l
            ? new Dictionary<string, List<string>> { ["limit"] = [QueryFormat.Int(l)] }
            : null;
        return client.SendAsync<List<Tag>>(
            () => new HttpRequestMessage(HttpMethod.Get, $"/tags{QueryString.Build(q)}"), ct);
    }
}
