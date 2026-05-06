# Access Control

Each access key is scoped along two independent dimensions: an access level (what actions it can perform) and a content scope (what it can see). Choose the narrowest combination that still lets the integration do its job.

## Access level

The access level controls whether a key can modify your mind or only read from it.

| Level | Description |
|-------|-------------|
| Read only | Retrieve objects, tags, spaces, and search results. The key cannot create, modify, or delete anything. |
| Full access | All read operations, plus the ability to create, update, and delete. |

**Important**

A **Full access** key can **permanently delete** content from your mind. AI agents acting on your behalf can move, modify, or remove anything within the key's content scope. Issue this level only when an integration genuinely needs to write, and prefer **Read only** for everything else.

## Content scope (Coming soon)

The content scope determines which objects a key can see.

**Not yet enforced**

**Content scope is not currently enforced.** Until enforcement ships, every API key has access to **Everything** — including NSFW and private content — regardless of the scope you assign it.

| Scope | Description |
|-------|-------------|
| Everything | All content in your mind, including anything you've marked sensitive. |
| Non-sensitive | Only content saved from a public URL — this still includes NSFW items. Notes, PDFs, images, and other content saved directly to your mind is excluded. |

## Choosing the right policy

A key shared with a third party or AI agent can do anything within its scope — read your most private notes, modify content, or delete it. Once a key leaves your control, you have to assume it may be logged, cached, or misused, so give each integration only the access it actually needs.

Two rules of thumb:

* Pick **Read only** unless the integration demonstrably needs to write.
* Pick **Non-sensitive** unless it needs to see private notes, uploaded files, or other directly saved content.

**Coming soon**

We are working on more granular access controls, including per-space permissions and action-level restrictions.
