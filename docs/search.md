# Search

Search across every object in your mind using a Lucene-inspired query syntax with boolean operators, phrase matching, and field filters. Combine with semantic search and optional reranking for higher-quality results at the cost of more credits.

## The match model

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | The unique identifier of the matching object. |
| score | number | Relevance score. Higher values indicate a stronger match. |
| semanticScore? | number | Semantic similarity score. Only present when `semantic=true` (or `rerank=true`, which implies it). |

## Actions

### Search objects

Returns a `matches` array of objects matching the query, sorted by descending relevance score.

```
GET /search        10–250 credits
```

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q (required) | string | — | Search query. See [syntax](#query-syntax). |
| limit | integer | `20` | Max results per page. Capped at `1000`. |
| semantic | boolean | `false` | Match by meaning rather than exact terms. |
| semanticBoost | number | — | Multiplier on semantic relevance. Higher values rank semantic matches higher. |
| similarTo (Mastermind) | [Uid](types.md#uid) | — | Finds content in the same vibe as the provided ID. Implies `semantic=true`. |
| rerank (Mastermind) | boolean | `false` | Re-score with a cross-encoder for higher precision. |

Query strings must be URL-encoded (e.g. `%26%26` for `&&`, `%3A` for `:`). `semanticBoost` only applies when `semantic=true`. `rerank` implies `semantic=true` and caps results at `100`.

### Response 200 OK

```json
{
  "matches": [
    {
      "id": "a1B2c3D4e5F6g7H8i9J0k1",
      "score": 0.94
    },
    {
      "id": "z9Y8x7W6v5U4t3S2r1Q0p9",
      "score": 0.71
    }
  ]
}
```

## Examples

### Keyword Query

```
GET /search?q=design+tools
```

#### Response 200 OK

```json
{
  "matches": [
    {
      "id": "a1B2c3D4e5F6g7H8i9J0k1",
      "score": 0.94
    },
    {
      "id": "z9Y8x7W6v5U4t3S2r1Q0p9",
      "score": 0.71
    }
  ]
}
```

### Field-filtered Query

```
GET /search?q=action%3Aread%20%26%26%20completed%3Afalse
```

### Semantic Query

```
GET /search?q=warm+evening+light&semantic=true
```

#### Response 200 OK

```json
{
  "matches": [
    {
      "id": "k4L8m2N6p9Q3r5T7v1X0z2",
      "score": 0.88,
      "semanticScore": 0.93
    },
    {
      "id": "b7C5d2E9f1G6h3J0k8L4m2",
      "score": 0.72,
      "semanticScore": 0.81
    }
  ]
}
```

## Query syntax

The `q` parameter supports a Lucene-inspired syntax for precise filtering. Terms are case-insensitive; operators must be uppercase or their symbolic form.

### Operators

| Syntax | Example | Description |
|--------|---------|-------------|
| term | `design` | Matches objects containing the word in title, content, or URL. |
| phrase | `"design tools"` | Exact phrase match across title and content. |
| && | `design && tools` | Both terms must be present. This is the default between terms. |
| \|\| | `design \|\| sketch` | Either term may be present. |
| \- | `design -figma` | Excludes objects containing the term. |
| wildcard \* | `des*` | Matches any term beginning with the prefix. |

### Fields

Use `field:value` to filter by a specific attribute. Combine multiple fields with operators above. Wrap values in double quotes to include whitespace or other special characters, e.g. `title:"plain text"`.

| Field | Values | Example | Description |
|-------|--------|---------|-------------|
| tag | any tag name | `tag:reading` | Filters by a specific tag name. |
| type | `article`, `image`, `note`, … | `type:image` | Filters by object type. |
| title | any string | `title:"plain text"` | Matches against the object's title only. Wrap multi-word values in quotes. |
| author | any string | `author:"jenny holzer"` | Filters by the author of the source content. |
| domain | any domain | `domain:nytimes.com` | Filters to objects saved from a specific domain. |
| action | `read`, `watch`, `make`, `purchase` | `action:read` | Filters to objects with an associated action. |
| completed | `true`, `false` | `action:read && completed:false` | Whether the action has been completed. Pair with `action:` to find pending or finished items. |
