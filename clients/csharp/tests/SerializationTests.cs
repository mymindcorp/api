using System.Text.Json;
using MyMind.Actions;
using MyMind.Models;
using Xunit;

namespace MyMind.Tests;

public class SerializationTests
{
    [Fact]
    public void CreateObjectRequest_Serializes_Url_As_String()
    {
        var req = new CreateObjectRequest { Url = new Uri("https://example.com/page") };

        var json = JsonSerializer.Serialize(req);
        var doc = JsonDocument.Parse(json).RootElement;

        Assert.Equal("https://example.com/page", doc.GetProperty("url").GetString());
    }

    [Fact]
    public void CreateObjectRequest_Omits_Null_Fields()
    {
        var req = new CreateObjectRequest { Title = "Hello" };

        var json = JsonSerializer.Serialize(req);
        var doc = JsonDocument.Parse(json).RootElement;

        Assert.Equal("Hello", doc.GetProperty("title").GetString());
        Assert.False(doc.TryGetProperty("url", out _));
        Assert.False(doc.TryGetProperty("content", out _));
        Assert.False(doc.TryGetProperty("tags", out _));
        Assert.False(doc.TryGetProperty("spaces", out _));
    }

    [Fact]
    public void CreateObjectRequest_Excludes_Blob_From_Json()
    {
        var req = new CreateObjectRequest
        {
            Title = "Photo",
            Blob = new Blob
            {
                Stream = new MemoryStream([0x89, 0x50, 0x4E, 0x47]),
                Type = "image/png",
                Name = "photo.png",
            },
        };

        var json = JsonSerializer.Serialize(req);
        var doc = JsonDocument.Parse(json).RootElement;

        Assert.False(doc.TryGetProperty("blob", out _));
        Assert.Equal("Photo", doc.GetProperty("title").GetString());
    }

    [Fact]
    public void CreateObjectRequest_Serializes_Tags_And_Spaces()
    {
        var req = new CreateObjectRequest
        {
            Tags = [new ObjectTag { Name = "reading" }],
            Spaces = [new ObjectSpace { Id = "sp_123" }],
        };

        var json = JsonSerializer.Serialize(req);
        var doc = JsonDocument.Parse(json).RootElement;

        Assert.Equal("reading", doc.GetProperty("tags")[0].GetProperty("name").GetString());
        Assert.Equal("sp_123", doc.GetProperty("spaces")[0].GetProperty("id").GetString());
    }
}
