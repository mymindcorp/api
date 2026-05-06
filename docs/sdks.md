# SDKs (WIP)

Minimal SDK implementations that wrap the essentials — JWT signing, request dispatch, and back-off after a `429`. Copy one into your project as a starting point, or use it as a reference while building your own.

**Official client libraries**

Full SDKs are being built in the open at `mymindcorp/api`. They're not ready yet — until they are, the snippets on this page are the canonical reference. Contributions welcome.

[View on GitHub →](https://github.com/mymindcorp/api)

## Before you start

You need an access key. Create one on your [Extensions page](https://access.mymind.com/extensions) and keep the `kid` and base64 `secret` on hand — the secret is shown only once. See [Authentication](authentication.md) for the full key format and lifecycle.

## What each SDK demonstrates

- **Identification** — every request sets the required `User-Agent` header naming the integration. Requests without one are rejected.
- **Signing** — generates a fresh JWT bound to the request's method and path. See [Authentication](authentication.md) for the full token format.
- **Two sample calls** — `createObject` and `getObject`. Every other resource method follows the same shape.
- **Back-off** — after a `429`, the SDK records when the slowest exhausted window will reset and delays the next request accordingly. See [Rate Limits](rate-limits.md) for the header format.

## Available code samples

The documentation site offers SDK examples in the following languages:

- JavaScript
- Python
- Ruby
- PHP
- C#
- Swift

## Where to next

With your SDK wired up, head to [Objects](objects.md) for the full set of resource methods, then [Spaces](spaces.md), [Tags](tags.md), and [Search](search.md) to extend it. For error handling details, see [Error Handling](errors.md).
