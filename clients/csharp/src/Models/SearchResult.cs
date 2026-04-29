using System.Text.Json.Serialization;

namespace MyMind.Models;

public class SearchResult
{
    [JsonPropertyName("matches")]
    public List<Match> Matches { get; init; } = [];
}
