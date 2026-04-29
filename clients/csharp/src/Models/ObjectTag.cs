using System.Text.Json.Serialization;

namespace MyMind.Models;

public class ObjectTag
{
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("flags")]
    public TagFlag? Flags { get; init; }
}
