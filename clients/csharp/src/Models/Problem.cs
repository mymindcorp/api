using System.Text.Json.Serialization;

namespace MyMind.Models;

/// <summary>RFC 7807 problem detail returned by the API for error responses.</summary>
public class Problem
{
    [JsonPropertyName("type")]
    public required string Type { get; init; }

    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [JsonPropertyName("status")]
    public required int Status { get; init; }

    [JsonPropertyName("detail")]
    public required string Detail { get; init; }
}
