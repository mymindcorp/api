using System.Text.Json.Serialization;

namespace MyMind.Models;

public class ObjectSource
{
    [JsonPropertyName("URL")]
    public required Uri Url { get; init; }
}
