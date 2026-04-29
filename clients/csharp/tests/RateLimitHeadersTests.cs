using MyMind.RateLimiting;
using Xunit;

namespace MyMind.Tests;

public class RateLimitHeadersTests
{
    [Fact]
    public void ParseState_Parses_Multiple_Policies()
    {
        var states = RateLimitHeaders.ParseState("\"burst\";r=9990;t=300, \"sustained\";r=99641;t=2589945");

        Assert.Equal(2, states.Length);
        Assert.Equal("burst",     states[0].Name);
        Assert.Equal(9990,        states[0].Remaining);
        Assert.Equal(300,         states[0].ResetSeconds);
        Assert.Equal("sustained", states[1].Name);
        Assert.Equal(99641,       states[1].Remaining);
        Assert.Equal(2589945,     states[1].ResetSeconds);
    }

    [Fact]
    public void ParsePolicy_Parses_Multiple_Policies()
    {
        var policies = RateLimitHeaders.ParsePolicy("\"burst\";q=10000;w=300, \"sustained\";q=100000;w=2592000");

        Assert.Equal(2, policies.Length);
        Assert.Equal("burst",     policies[0].Name);
        Assert.Equal(10000,       policies[0].Quota);
        Assert.Equal(300,         policies[0].WindowSeconds);
        Assert.Equal("sustained", policies[1].Name);
        Assert.Equal(100000,      policies[1].Quota);
        Assert.Equal(2592000,     policies[1].WindowSeconds);
    }

    [Fact]
    public void ParseCost_Returns_Integer()
    {
        Assert.Equal(10, RateLimitHeaders.ParseCost("10"));
        Assert.Equal(0,  RateLimitHeaders.ParseCost("0"));
        Assert.Equal(0,  RateLimitHeaders.ParseCost(null));
        Assert.Equal(0,  RateLimitHeaders.ParseCost("   "));
    }

    [Fact]
    public void ParseState_Returns_Empty_For_Null_Or_Whitespace()
    {
        Assert.Empty(RateLimitHeaders.ParseState(null));
        Assert.Empty(RateLimitHeaders.ParseState(""));
        Assert.Empty(RateLimitHeaders.ParseState("   "));
    }

    [Fact]
    public void ParsePolicy_Returns_Empty_For_Null_Or_Whitespace()
    {
        Assert.Empty(RateLimitHeaders.ParsePolicy(null));
        Assert.Empty(RateLimitHeaders.ParsePolicy(""));
    }

    [Fact]
    public void ParseState_Skips_Malformed_Entries()
    {
        var states = RateLimitHeaders.ParseState("\"burst\";r=10;t=5, garbage, \"ok\";r=1;t=2");

        Assert.Equal(2, states.Length);
        Assert.Equal("burst", states[0].Name);
        Assert.Equal("ok",    states[1].Name);
    }

    [Fact]
    public void ParseState_Tolerates_Extra_Whitespace()
    {
        var states = RateLimitHeaders.ParseState("  \"burst\" ; r=10 ; t=5  ");

        Assert.Single(states);
        Assert.Equal("burst", states[0].Name);
        Assert.Equal(10,      states[0].Remaining);
        Assert.Equal(5,       states[0].ResetSeconds);
    }
}
