using System.Text.Json.Serialization;

namespace MyMind.Models;

public class ObjectSpace
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }
}
