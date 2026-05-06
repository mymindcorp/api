# Tags

Tags are free-form labels you attach to objects. They are created implicitly the first time they're used — there is no separate "create tag" endpoint. Tags can be applied by the user or inferred automatically by AI.

## The tag model

| Property | Type | Description |
|----------|------|-------------|
| name | string | The tag label, set by the user or inferred by AI. Tags are identified by their name — there is no separate identifier. |
| count | integer | Number of objects currently tagged. |
| flags | [TagFlag](#tagflag) | Bitmask describing how the tag was applied. See [TagFlag](#tagflag). |
| modified | [Timestamp](types.md#timestamp) | When the tag was last added to or removed from an object. |

### TagFlag

A bitmask describing how a tag was applied. A single tag may carry multiple flags at once (e.g. AI-suggested and later confirmed manually) — use bitwise-AND to test for a specific flag.

| Value | Name | Description |
|-------|------|-------------|
| 0 | None | No flags set. |
| 2 | AI | Applied automatically by AI. |
| 8 | Manual | Applied manually by the user. |

## Actions

### List tags

Returns the authenticated user's tags, sorted by most recently used first.

```
GET /tags
```

**Credits:** 5

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | `1000` | Max results. Capped at `10000`. |

### Response 200 OK

```json
[
  {
    "name": "writing",
    "count": 14,
    "modified": "2024-04-01T10:30:00Z"
  },
  {
    "name": "tools",
    "count": 8,
    "modified": "2024-03-28T15:45:00Z"
  }
]
```
