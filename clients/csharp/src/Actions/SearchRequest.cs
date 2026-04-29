namespace MyMind.Actions;

public class SearchRequest
{
    public required string Q { get; init; }

    public int? Limit { get; init; }
    public bool? Semantic { get; init; }
    public double? SemanticBoost { get; init; }
    public bool? Rerank { get; init; }
}
