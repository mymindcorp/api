# Introduction

The mymind API lets you connect your mind to other tools. Build private integrations for your own workflow, wire it into AI agents, or publish extensions for other mymind users.

## How mymind works

Everything you save becomes an [object](objects.md) — a URL, image, note, document, or file. Objects carry [tags](tags.md), live in one or more [spaces](spaces.md), and are recalled through a [search engine](search.md) that supports keyword, semantic, and filtered queries.

## Base URL

```
https://api.mymind.com
```

## Authentication

Every request must be signed with an access key and sent as a bearer token in the `Authorization` header. See [Authentication](authentication.md) for how to create and sign tokens.

### Example

```
curl https://api.mymind.com/objects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "User-Agent: my-extension/1.0"
```

## Requests

Every request must send a `User-Agent` header identifying your application. Requests with a JSON body must set `Content-Type: application/json`.

## Responses

Successful responses return JSON. List endpoints return flat arrays. Some endpoints return other content types — `text/markdown`, binary attachments, and so on — documented per action.

Errors follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) and are returned as `application/problem+json`. See [Error Handling](errors.md) for the full list of status codes.

## Building a client?

Are you building a client that can be installed by other mymind users? [Get in touch](mailto:support@mymind.com?subject=Register%20a%20client) to register it.
