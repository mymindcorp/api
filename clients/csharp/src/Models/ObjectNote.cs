using System.Text.Json.Serialization;

namespace MyMind.Models;

public class ObjectNote
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("body")]
    public required string Body { get; init; }
}
