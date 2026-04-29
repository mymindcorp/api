using System.Text.Json.Serialization;

namespace MyMind.Models;

public class Space
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("color")]
    public required string Color { get; init; }

    [JsonPropertyName("created")]
    public required DateTime Created { get; init; }

    [JsonPropertyName("objects")]
    public List<SpaceObject> Objects { get; init; } = [];
}
