using System.Text.Json.Serialization;

namespace MyMind.RateLimiting;

/// <summary>Quota and window declared by the <c>RateLimit-Policy</c> response header.</summary>
public class RateLimitPolicy
{
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("q")]
    public required int Quota { get; init; }

    [JsonPropertyName("w")]
    public required int WindowSeconds { get; init; }
}
