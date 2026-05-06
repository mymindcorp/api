# Error Handling

Errors use standard HTTP status codes and return a problem object following [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). The response `Content-Type` is `application/problem+json`.

## The error object

| Property | Type | Description |
|----------|------|-------------|
| type | string | A stable identifier for the error category, e.g. `NotFound` or `Unauthorized`. Branch on `type` rather than `detail` — detail messages are human-readable and may change. |
| status | integer | The HTTP status code, matching the response status. |
| detail | string | A human-readable explanation specific to this occurrence. |

### Example error response 404

```json
{
  "type": "NotFound",
  "status": 404,
  "detail": "No object with that ID exists."
}
```

## HTTP status codes

| Status | Type | Description |
|--------|------|-------------|
| 200 | — | Request succeeded. |
| 201 | — | Resource created successfully. |
| 400 | BadRequest | The request was malformed or missing required fields. |
| 401 | Unauthorized | The JWT is missing, invalid, or signed with the wrong secret. |
| 403 | Forbidden | The key is valid but lacks permission for this action or scope. |
| 404 | NotFound | The requested resource does not exist, or is outside your key's scope. |
| 413 | PayloadTooLarge | The request body exceeds the maximum allowed size (64 MB for attachments). |
| 422 | Unprocessable | The request was well-formed but failed validation. |
| 429 | RateLimited | Credit quota exceeded. See the `RateLimit` header for the reset window — see [Rate Limits](rate-limits.md). |
| 500 | InternalServerError | An unexpected error on our side. Safe to retry with exponential backoff. |
| 503 | Unavailable | The service is temporarily unavailable (maintenance or overload). Retry later. |
