using System.Text.Json.Serialization;

namespace MyMind.Models;

public class SpaceObject
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }
}
