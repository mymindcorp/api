using System.Text.Json.Serialization;

namespace MyMind.Models;

public class Match
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("score")]
    public required double Score { get; init; }

    [JsonPropertyName("semanticScore")]
    public double? SemanticScore { get; init; }
}
