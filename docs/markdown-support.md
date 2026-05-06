# Markdown Support

mymind accepts Markdown for notes and any text-based object. Input is parsed as [CommonMark](https://commonmark.org), with a small set of extensions.

## CommonMark

Rendering and parsing follow the [CommonMark specification](https://commonmark.org). Non-significant whitespace is stripped on save.

## Extensions

The following are mymind-specific extensions on top of CommonMark. They are always enabled.

### Page links

`[[Page Link]]` creates a link to another object in your mind. The text inside the brackets is matched against object titles.

### Pipe tables

Pipe `|` syntax creates tables with optional header row and column alignment.

```
| Format | Extension |
| ------ | --------: |
| PNG    |      .png |
| JPEG   |      .jpg |
```

### Task lists

`- [ ]` and `- [x]` render as interactive task lists for incomplete and completed items.

```
- [x] Draft outline
- [ ] Review with team
- [ ] Publish
```

## About prose

Internally, mymind stores text in a format called **prose**, based on the document model used by [ProseMirror](https://prosemirror.net). When you read content as Markdown, prose is converted on the fly.

Most content round-trips cleanly, but prose-specific features (custom blocks, rich formatting) have no Markdown equivalent. Writing back as Markdown will drop them. To read and write without losing information, use the [Prose](prose.md) format directly.

To translate between Markdown and Prose programmatically, use the [Convert](convert.md) endpoint.
