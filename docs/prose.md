# Prose (WIP)

Prose is mymind's internal rich-text format. It is a structured JSON document based on the [ProseMirror](https://prosemirror.net) document model, and is served with the `application/prose+json` media type.

**Work in progress**

All APIs that accept and return content support Prose, but the schema below is still being filled in. Round-trip with caution until this page is complete.

## When you receive it

Any endpoint that returns [Content](types.md#content) may return prose. You'll see it when `content.type` is `application/prose+json`, in which case `content.body` is a Prose document rather than a string.

For a lossy plain-text view of the same content, convert the prose to Markdown using the [/convert](convert.md) endpoint.

## Structure

A Prose document is a tree of nodes. Every node has a `type` and may have `content` (an array of child nodes), `text` (a leaf string), `attrs` (type-specific attributes), and `marks` (inline formatting like bold or links).

### Example

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello, " },
        { "type": "text", "text": "world", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": "." }
      ]
    }
  ]
}
```

Prose preserves features that have no Markdown equivalent — custom blocks and rich inline formatting — without losing information on round-trip.

## Nodes

A Prose document is built from the following node types. `text` is the universal leaf — every node listed here is either a container of children or a self-closing block.

| Type | Attributes | Description |
|------|-----------|-------------|
| doc | — | The root of every Prose document. Contains one or more block-level children. |
| paragraph | — | A run of inline content — `text` nodes and `hardBreak`s. |
| heading | `level` | A heading. `level` is an integer from `1` through `6`. |
| bulletList | — | An unordered list. Wraps one or more `listItem` children. |
| orderedList | — | A numbered list. Wraps one or more `listItem` children. |
| listItem | — | A single entry inside a `bulletList` or `orderedList`. |
| taskList | — | A checklist. Wraps one or more `taskItem` children. |
| taskItem | `checked` | A single checkbox entry inside a `taskList`. |
| codeBlock | `language?` | A block of preformatted, monospaced code. |
| table | — | A table. Wraps one or more `tableRow` children. |
| tableRow | — | A row inside a `table`. Wraps one or more `tableHeader` or `tableCell` children. |
| tableHeader | — | A header cell — typically the first row of a `table`. |
| tableCell | — | A body cell inside a `tableRow`. |
| html | — | A block of raw HTML preserved verbatim through round-trips. |
| wikiLink | `text`, `target?` | An internal link to another object — `text` is the displayed label; `target`, when present, is the resolved object reference. Created by the `[[Page Link]]` Markdown extension. |
| image | `src?`, `alt?`, `title?` | An inline image. `src` is the image URL, `alt` is alternative text, `title` is the hover tooltip. |
| hardBreak | — | A forced line break inside a paragraph or heading. |
| horizontalRule | — | A horizontal divider between blocks. |

## Marks

Marks decorate ranges of text without breaking the underlying text node — bold, italic, links, and so on. A node carries an array of marks under its `marks` property.

| Type | Attributes | Description |
|------|-----------|-------------|
| bold | — | Makes the text bold. |
| italic | — | Makes the text italic. |
| underline | — | Underlines the text. |
| strike | — | Strikes through the text. |
| code | — | Renders the text as inline monospaced code. |
| link | `href`, `title?` | Wraps the text in a hyperlink. `title` renders as the hover tooltip. |
| highlight | — | Highlights the text. |
| ins | — | Marks the text as inserted (e.g. tracked-change additions). |
| superscript | — | Raises the text as superscript. |
| subscript | — | Lowers the text as subscript. |

## Converting to and from other formats

Use the [Convert](convert.md) endpoint to transform content between Prose, Markdown, and plain text. Set the source format on `Content-Type` and the target format on `Accept`.

### Markdown → Prose

```
POST /convert
Content-Type: text/markdown
Accept: application/prose+json
```

### Prose → Markdown

```
POST /convert
Content-Type: application/prose+json
Accept: text/markdown
```

**Conversion may be lossy**

Conversion can lose information in either direction whenever a feature isn't shared between the two formats. Going _from_ Prose drops custom blocks and rich-formatting marks that have no Markdown or plain-text equivalent. Going _to_ Prose drops Markdown constructs that don't map to a Prose node. To avoid data loss, use Prose directly.

## See also

* [ProseMirror document model](https://prosemirror.net/docs/guide/#doc) — the upstream spec Prose builds on.
* [Markdown Support](markdown-support.md) — lossy Markdown view of the same content.
* [Content](types.md#content) — the tagged-union wrapper returned by content-bearing endpoints.
