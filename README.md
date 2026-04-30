# mymind API

Reference clients for the mymind API.

> **Status: pre-0.0.1, work in progress.** Everything here is a stub. The shape
> of the API, the auth model, and the client surfaces will all change over the
> coming weeks as things stabilise. Don't depend on any of it yet.

## Layout

```
clients/
  csharp/      # .NET 10 client
  swift/       # Swift 6 client (macOS 14+ / iOS 17+)
  typescript/  # TypeScript client (Node 20+)
```

Each client is self-contained and built/tested independently. CI runs all three
on every push to `main` (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

## What's stubbed in so far

A rough sketch of the surface — names and shapes will move:

- `MyMindClient` — top-level entry point, constructed with a key id + secret
  pair (from the Extensions page) and a user-agent string.
- Services for `objects`, `spaces`, `tags`.
- Top-level `search` and `convert` endpoints.
- Auth, retry/rate-limiting, and exception scaffolding.

## Working on a client

```sh
# C#
cd clients/csharp && dotnet test tests/MyMindClientTests.csproj

# TypeScript
cd clients/typescript && npm install && npm test

# Swift
cd clients/swift && swift test
```

## Contributing

Contributions are welcome — issues and PRs against any of the clients are
appreciated. Given how early this is, please open an issue to discuss before
starting any larger changes.

By submitting a contribution, you agree that it is licensed under the same
terms as this project ([MIT](LICENSE)).

## License

[MIT](LICENSE).
