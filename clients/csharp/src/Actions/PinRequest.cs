using System.Text.Json.Serialization;

namespace MyMind.Actions;

public class PinRequest
{
    [JsonPropertyName("position")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Position { get; init; }
}
