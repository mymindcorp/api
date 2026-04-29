namespace MyMind.RateLimiting;

/// <summary>
/// Parses the <c>RateLimit-Policy</c>, <c>RateLimit</c>, and <c>RateLimit-Cost</c> response headers.
/// </summary>
/// <remarks>
/// Header formats:
/// <code>
/// RateLimit-Policy: "burst";q=10000;w=300, "sustained";q=100000;w=2592000
/// RateLimit:        "burst";r=9990;t=300,  "sustained";r=99641;t=2589945
/// RateLimit-Cost:   10
/// </code>
/// </remarks>
public static class RateLimitHeaders
{
    public static RateLimitPolicy[] ParsePolicy(string? header)
    {
        if (string.IsNullOrWhiteSpace(header)) return [];
        return header
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(ParsePolicyEntry)
            .OfType<RateLimitPolicy>()
            .ToArray();
    }

    public static RateLimitState[] ParseState(string? header)
    {
        if (string.IsNullOrWhiteSpace(header)) return [];
        return header
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(ParseStateEntry)
            .OfType<RateLimitState>()
            .ToArray();
    }

    public static int ParseCost(string? header) =>
        int.TryParse(header?.Trim(), out var v) ? v : 0;

    private static RateLimitPolicy? ParsePolicyEntry(string entry)
    {
        var tokens = entry.Split(';', StringSplitOptions.TrimEntries);
        if (tokens.Length < 3) return null;
        var name = tokens[0].Trim('"');
        var q = GetInt(tokens, "q");
        var w = GetInt(tokens, "w");
        if (q is null || w is null) return null;
        return new RateLimitPolicy { Name = name, Quota = q.Value, WindowSeconds = w.Value };
    }

    private static RateLimitState? ParseStateEntry(string entry)
    {
        var tokens = entry.Split(';', StringSplitOptions.TrimEntries);
        if (tokens.Length < 3) return null;
        var name = tokens[0].Trim('"');
        var r = GetInt(tokens, "r");
        var t = GetInt(tokens, "t");
        if (r is null || t is null) return null;
        return new RateLimitState { Name = name, Remaining = r.Value, ResetSeconds = t.Value };
    }

    private static int? GetInt(string[] tokens, string key)
    {
        var token = tokens.Skip(1).FirstOrDefault(t => t.StartsWith(key + "=", StringComparison.Ordinal));
        return token is not null && int.TryParse(token.AsSpan(key.Length + 1), out var v) ? v : null;
    }
}
