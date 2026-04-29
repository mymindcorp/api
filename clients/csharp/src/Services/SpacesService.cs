using System.Net.Http.Json;
using MyMind.Actions;
using MyMind.Models;

namespace MyMind.Services;

public sealed class SpacesService(MyMindClient client)
{
    public Task<List<Space>> ListAsync(CancellationToken ct = default) =>
        client.SendAsync<List<Space>>(() => new HttpRequestMessage(HttpMethod.Get, "/spaces"), ct);

    public Task<Space> CreateAsync(CreateSpaceRequest body, CancellationToken ct = default) =>
        client.SendAsync<Space>(() => new HttpRequestMessage(HttpMethod.Post, "/spaces")
        {
            Content = JsonContent.Create(body),
        }, ct);

    public Task<Space> GetAsync(string id, CancellationToken ct = default) =>
        client.SendAsync<Space>(() => new HttpRequestMessage(HttpMethod.Get, $"/spaces/{id}"), ct);

    public Task<Space> UpdateAsync(string id, UpdateSpaceRequest body, CancellationToken ct = default) =>
        client.SendAsync<Space>(() => new HttpRequestMessage(HttpMethod.Patch, $"/spaces/{id}")
        {
            Content = JsonContent.Create(body),
        }, ct);

    public Task DeleteAsync(string id, CancellationToken ct = default) =>
        client.SendVoidAsync(() => new HttpRequestMessage(HttpMethod.Delete, $"/spaces/{id}"), ct);

    public Task AddObjectAsync(string spaceId, string objectId, CancellationToken ct = default) =>
        client.SendVoidAsync(
            () => new HttpRequestMessage(HttpMethod.Put, $"/spaces/{spaceId}/objects/{objectId}"), ct);

    public Task RemoveObjectAsync(string spaceId, string objectId, CancellationToken ct = default) =>
        client.SendVoidAsync(
            () => new HttpRequestMessage(HttpMethod.Delete, $"/spaces/{spaceId}/objects/{objectId}"), ct);
}
