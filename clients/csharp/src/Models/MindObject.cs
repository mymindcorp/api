using System.Text.Json.Serialization;

namespace MyMind.Models;

public class MindObject
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [JsonPropertyName("tags")]
    public List<ObjectTag> Tags { get; init; } = [];

    [JsonPropertyName("bumped")]
    public required DateTime Bumped { get; init; }

    [JsonPropertyName("created")]
    public required DateTime Created { get; init; }

    [JsonPropertyName("modified")]
    public required DateTime Modified { get; init; }

    [JsonPropertyName("content")]
    public Content? Content { get; init; }

    [JsonPropertyName("spaces")]
    public List<ObjectSpace>? Spaces { get; init; }

    [JsonPropertyName("notes")]
    public List<ObjectNote>? Notes { get; init; }

    [JsonPropertyName("source")]
    public ObjectSource? Source { get; init; }

    [JsonPropertyName("deleted")]
    public DateTime? Deleted { get; init; }
}
