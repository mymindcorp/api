using System.Text.Json.Serialization;
using MyMind.Models;

namespace MyMind.Actions;

public class AddObjectTagsRequest
{
    [JsonPropertyName("tags")]
    public required List<ObjectTag> Tags { get; init; }
}
