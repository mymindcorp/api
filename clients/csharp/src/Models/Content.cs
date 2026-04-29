using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyMind.Models;

public class Content
{
    [JsonPropertyName("type")]
    public required string Type { get; init; }

    [JsonPropertyName("body")]
    public required JsonElement Body { get; init; }
}
