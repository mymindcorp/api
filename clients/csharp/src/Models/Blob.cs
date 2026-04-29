namespace MyMind.Models;

/// <summary>
/// A binary payload — used both for uploads (on <see cref="MyMind.Actions.CreateObjectRequest"/>)
/// and for downloads (returned by <see cref="MyMind.Services.ObjectsService.DownloadAsync"/>).
/// </summary>
public class Blob
{
    public required Stream Stream { get; init; }
    public required string Type { get; init; }
    public string? Name { get; init; }
}
