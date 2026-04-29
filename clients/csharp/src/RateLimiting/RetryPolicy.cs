namespace MyMind.RateLimiting;

/// <summary>Controls how the client handles 429 rate-limit responses.</summary>
public class RetryPolicy
{
    /// <summary>Maximum number of retry attempts after a 429. Default: 3.</summary>
    public int MaxRetries { get; init; } = 3;

    /// <summary>Extra time added on top of the server's reset window. Default: 1 second.</summary>
    public TimeSpan BufferTime { get; init; } = TimeSpan.FromSeconds(1);

    public static readonly RetryPolicy Default = new();
}
