# Rate Limits

API usage is metered in credits. Every endpoint lists its cost; actions with variable cost depend on request complexity and are always rounded up.

## Plans

Two quotas run in parallel. The **burst** quota gives you headroom for short spikes of activity; the **sustained** quota is your monthly (30 day) allowance. Exceed either and the API returns [`429 Too Many Requests`](errors.md) until the window replenishes. You may also [upgrade](https://access.mymind.com/upgrade) your plan to increase your quota immediately.

| Plan | Burst | Sustained |
|------|-------|-----------|
| Guest | 500 | 5,000 |
| Bookmarker | 2,500 | 25,000 |
| Student of Life | 5,000 | 50,000 |
| Mastermind | 10,000 | 100,000 |

## [RateLimit](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) headers

Every response carries three headers describing your quota state. **Read them and pace your traffic accordingly** — don't guess when a window replenishes, and don't retry in a tight loop after a `429`.

Example response headers

```
RateLimit-Policy: "burst";q=10000;w=300, "sustained";q=100000;w=2592000
RateLimit:        "burst";r=9990;t=300, "sustained";r=99641;t=2589945
RateLimit-Cost:   10
```

Each header is a list with one entry per active policy. The quoted string is the policy name; the remaining tokens are parameters. Both `burst` and `sustained` policies always appear — read the window lengths from `w`.

### RateLimit-Policy

Declares the quota and window of each policy. These values reflect your current plan and only change when you upgrade.

| Variable | Type | Description |
|----------|------|-------------|
| name | string | Policy identifier — either `burst` or `sustained`. |
| q | integer | Total credits granted for the window. |
| w | integer | Window length, in seconds. |

### RateLimit

Reports each policy's state after the current request has been charged.

| Variable | Type | Description |
|----------|------|-------------|
| name | string | Policy identifier matching an entry in `RateLimit-Policy`. |
| r | integer | Credits remaining in the current window. `0` means the policy is exhausted. |
| t | integer | Seconds until the window resets. After a `429`, treat the exhausted policy's `t` as your back-off — it serves the same purpose as `Retry-After`. |

### RateLimit-Cost

The credits charged for this request. Variable-cost actions report their final, rounded-up value here.

## Backing off after 429

When a request returns `429 Too Many Requests`, parse the `RateLimit` header, find every policy with `r=0`, and sleep until the slowest of those windows resets — that is, the largest `t` among the exhausted policies. Waiting against a policy that still has credits will retry too soon and trip the limit again. The official [SDKs](sdks.md) handle this for you.

## Storage

Attachments and saved content count toward your plan's storage limit. Individual uploads are capped at 64 MB; larger files return `413 Payload Too Large`.

| Plan | Storage |
|------|---------|
| Guest | 1 GB |
| Bookmarker | 50 GB |
| Student of Life | 100 GB |
| Mastermind | 200 GB |
