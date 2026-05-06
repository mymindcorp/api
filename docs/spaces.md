# Spaces

A space is a named collection of objects. Use spaces to group related items — by project, topic, trip, or any context you want to keep separate. A space can contain up to 10,000 objects, and an object can belong to up to 100 spaces at once.

## The space model

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | Unique identifier for the space. |
| name | string | Display name of the space. Must be unique across your spaces. |
| color | [Color](types.md#color) | Display color for the space. |
| created | [Timestamp](types.md#timestamp) | When the space was created. |
| objects | [SpaceObject](#spaceobject)[] | Objects in this space. |

### SpaceObject

| Property | Type | Description |
|----------|------|-------------|
| id | [Uid](types.md#uid) | The object's unique identifier. |

## Actions

### Create a space

Creates a new space.

```
POST /spaces        100 credits
```

#### Request body

| Property | Type | Description |
|----------|------|-------------|
| name (required) | string | Display name for the space. Must be unique across your spaces — duplicate names return `409 Conflict`. |
| color | [Color](types.md#color) | A [Color](types.md#color) value. If omitted, a color is assigned automatically. |

#### Request

```json
{
  "name": "Design research",
  "color": "#e0f2fe"
}
```

#### Response 201 Created

```json
{
  "id": "j5K6l7M8n9O0p1Q2r3S4t5",
  "name": "Design research",
  "color": "#e0f2fe",
  "created": "2024-04-08T09:00:00Z"
}
```

### Get a space

Retrieves a single space by its ID, including the list of objects it contains.

```
GET /spaces/:id        1 credit
```

#### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | [Uid](types.md#uid) | Space to retrieve. |

#### Response 200 OK

```json
{
  "id": "j5K6l7M8n9O0p1Q2r3S4t5",
  "name": "Design research",
  "color": "#e0f2fe",
  "created": "2024-04-08T09:00:00Z",
  "objects": [
    { "id": "a1B2c3D4e5F6g7H8i9J0k1" },
    { "id": "z9Y8x7W6v5U4t3S2r1Q0p9" }
  ]
}
```

### List spaces

Returns all spaces accessible to the authenticated user.

```
GET /spaces        10 credits
```

#### Response 200 OK

```json
[
  {
    "id": "j5K6l7M8n9O0p1Q2r3S4t5",
    "name": "Design research",
    "color": "#e0f2fe",
    "created": "2024-04-08T09:00:00Z"
  }
]
```

### Update a space

Updates a space's metadata. Only include the fields you want to change — omitted fields are left untouched.

```
PATCH /spaces/:id        2 credits
```

#### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | [Uid](types.md#uid) | Space to update. |

#### Request body

| Property | Type | Description |
|----------|------|-------------|
| name | string | New display name for the space. |
| color | [Color](types.md#color) | New display color. |

#### Response 200 OK

```json
{
  "id": "j5K6l7M8n9O0p1Q2r3S4t5",
  "name": "Travel inspiration",
  "color": "#fef3c7",
  "created": "2024-04-08T09:00:00Z"
}
```

### Delete a space

Deletes a space. Objects inside are not deleted — they simply lose this space's membership and remain in your mind.

```
DELETE /spaces/:id        Idempotent        1 credit
```

#### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | [Uid](types.md#uid) | Space to delete. |

#### Response 200 OK

```json
{}
```

### Add an object to a space

Adds an object to a space. Idempotent — adding an object that's already in the space is a no-op.

```
PUT /spaces/:spaceId/objects/:objectId        Idempotent        3 credits
```

#### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| spaceId | [Uid](types.md#uid) | Space to add to. |
| objectId | [Uid](types.md#uid) | Object to add. |

#### Response 200 OK

```json
{}
```

### Remove an object from a space

Removes an object from a space. The object itself is not deleted, and remains in any other spaces it belongs to.

```
DELETE /spaces/:spaceId/objects/:objectId        Idempotent        3 credits
```

#### Path parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| spaceId | [Uid](types.md#uid) | Space to remove from. |
| objectId | [Uid](types.md#uid) | Object to remove. |

#### Response 200 OK

```json
{}
```
