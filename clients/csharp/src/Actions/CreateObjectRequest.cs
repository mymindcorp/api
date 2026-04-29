using System.Text.Json.Serialization;
using MyMind.Models;

namespace MyMind.Actions;

public class CreateObjectRequest
{
    [JsonPropertyName("title")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Title { get; init; }

    [JsonPropertyName("url")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Uri? Url { get; init; }

    [JsonPropertyName("content")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Content? Content { get; init; }

    [JsonPropertyName("tags")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<ObjectTag>? Tags { get; init; }

    [JsonPropertyName("spaces")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<ObjectSpace>? Spaces { get; init; }

    /// <summary>
    /// Optional binary payload. When set, the object is created from the bytes
    /// (multipart-style upload) and the JSON fields above are ignored.
    /// </summary>
    [JsonIgnore]
    public Blob? Blob { get; init; }
}
