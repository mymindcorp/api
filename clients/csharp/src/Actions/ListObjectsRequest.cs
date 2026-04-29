namespace MyMind.Actions;

public class ListObjectsRequest
{
    public string? Q { get; init; }
    public List<string>? Ids { get; init; }
    public string? ContentAs { get; init; }
    public int? Limit { get; init; }
}
