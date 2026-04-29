using System.Text.Json.Serialization;
using MyMind.Models;

namespace MyMind.Actions;

public class UpdateObjectRequest
{
    [JsonPropertyName("title")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Title { get; init; }

    [JsonPropertyName("tags")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<ObjectTag>? Tags { get; init; }

    [JsonPropertyName("spaces")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<ObjectSpace>? Spaces { get; init; }
}
