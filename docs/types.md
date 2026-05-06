# Base Types

Types used across multiple resources. Scalars are stringly-typed with documented formats; object types share a consistent shape wherever they appear.

## Uid

A case-sensitive, base62 string that uniquely identifies a resource.

| Type | Description |
|------|-------------|
| string | 22 case-sensitive base62 characters (`A-Z`, `a-z`, `0-9`), e.g. `A1B2c3D4e5F6g7H8i9J0K1`. |

## Timestamp

An ISO 8601 date-time string in UTC.

| Type | Description |
|------|-------------|
| string | ISO 8601 in UTC, e.g. `2024-03-01T12:00:00Z`. |

## UUID

A standard v4 UUID used for client-assigned identifiers such as attachment IDs.

| Type | Description |
|------|-------------|
| string | Standard v4 UUID, e.g. `550e8400-e29b-41d4-a716-446655440000`. |

## Url

A fully-qualified URL string.

| Type | Description |
|------|-------------|
| string | An absolute URL, e.g. `https://example.com/page`. |

## Color

Any valid CSS color value, typically a hex code.

| Type | Description |
|------|-------------|
| string | CSS color, e.g. `#ff5924`, `rgb(255 89 36)`, `hsl(14 100% 57%)`, `rebeccapurple`. |

## Palette

A map of dominant Color values to their relative weight in the source — used to describe the color makeup of an image or other visual content. Weights are between `0` and `1` and typically sum to `1.0`.

| Type | Description |
|------|-------------|
| object | Object keyed by Color with `number` values, e.g. `{ "#000": 0.5, "#fff": 0.5 }`. |

## AI

AI-generated metadata attached to an object. Fields are populated asynchronously — they may be absent immediately after creation and appear once analysis completes.

| Property | Type | Description |
|----------|------|-------------|
| summary | string | AI generated summary of the object. |

## Content

A tagged union representing a content body. Use the `type` discriminator to decide how to interpret `body`.

| Property | Type | Description |
|----------|------|-------------|
| type | string | A MIME type — one of `text/plain`, `text/markdown`, `text/html`, or `application/prose+json`. |
| body | string \| Prose | The content payload. A string for `text/plain`, `text/markdown`, and `text/html`; a Prose object for `application/prose+json`. |

## BlobReference

A reference to a binary object such as an image, video, or document.

| Property | Type | Description |
|----------|------|-------------|
| path | string | The blob's path under `https://mymind.media`. |
| type | string | MIME type of the blob, e.g. `image/jpeg`, `video/mp4`. |
| url? | string | Fully-qualified URL to the blob. |
| width? | integer | Width in pixels. |
| height? | integer | Height in pixels. |
| palette? | Palette | Dominant colors of the blob, weighted. Present for image blobs. |

## EntityReference

A reference to another entity by its unique identifier.

| Property | Type | Description |
|----------|------|-------------|
| id | Uid | The referenced entity's unique identifier. |

## Duration

An ISO 8601 duration string.

| Type | Description |
|------|-------------|
| string | ISO 8601 duration, e.g. `PT3M45S`, `PT1H30M`. |

## ISBN

An ISBN-13 identifier.

| Type | Description |
|------|-------------|
| string | 13-digit ISBN, e.g. `9780141036144`. |

## Offer

A price with its currency.

| Property | Type | Description |
|----------|------|-------------|
| price | number | Price amount. |
| currencyCode | string | ISO 4217 currency code, e.g. `USD`, `EUR`. |
