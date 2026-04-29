using MyMind.Models;
using MyMind.RateLimiting;

namespace MyMind.Exceptions;

public class RateLimitedException : ApiException
{
    public RateLimitState[] States { get; }

    public RateLimitedException(Problem problem, RateLimitState[] states)
        : base(429, problem)
    {
        States = states;
    }
}
