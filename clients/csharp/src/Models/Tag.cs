using System.Text.Json.Serialization;

namespace MyMind.Models;

public class Tag
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("count")]
    public required int Count { get; init; }

    [JsonPropertyName("flags")]
    public required TagFlag Flags { get; init; }

    [JsonPropertyName("modified")]
    public required DateTime Modified { get; init; }
}
