# Convert

Convert between plain text, Markdown, and mymind's internal prose format. Useful when you need to show prose externally, or produce prose from a Markdown file you'd like to send to [object markdown](objects.md) endpoints.

## Actions

### Convert content

Converts the request body from the `Content-Type` format to the requested `Accept` format.

```
POST /convert
```

**Credits:** 1 credit

### Headers

| Header | Description |
|--------|-------------|
| Content-Type (required) | Format of the request body: `text/plain`, `text/markdown`, or `application/prose+json`. |
| Accept (required) | Desired response format: `text/plain`, `text/markdown`, or `application/prose+json`. Must differ from `Content-Type`. |

### Examples

Plain text → Prose

```
POST /convert
Content-Type: text/plain
Accept: application/prose+json
```

Markdown → Prose

```
POST /convert
Content-Type: text/markdown
Accept: application/prose+json
```

Prose → Markdown

```
POST /convert
Content-Type: application/prose+json
Accept: text/markdown
```

### Response — unsupported conversion

**Status:** 422

```json
{
  "type": "Unprocessable",
  "status": 422,
  "detail": "Cannot convert from the provided Content-Type to the requested Accept format."
}
```

### Notes

Conversions may not be lossless. Converting prose to Markdown drops prose-only features that have no Markdown equivalent — see [Markdown Support](markdown-support.md) for the details.
