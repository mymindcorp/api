using System.Text.Json.Serialization;

namespace MyMind.RateLimiting;

/// <summary>Per-policy quota state from the <c>RateLimit</c> response header.</summary>
public class RateLimitState
{
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("r")]
    public required int Remaining { get; init; }

    [JsonPropertyName("t")]
    public required int ResetSeconds { get; init; }
}
