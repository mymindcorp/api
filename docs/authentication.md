# Authentication

Requests are authenticated with a signed JWT. Each JWT is signed with an access key you create from your account settings, and sent as a bearer token.

## Access keys

Create access keys from your [Extensions page](https://access.mymind.com/extensions). Each key has a `kid` (key identifier) and a base64-encoded 128-bit `secret`.

### Permissions

Each access key is scoped by an access level and a content scope. See [Access Control](access-control.md) for details.

## Keep your key private

Your access key secret is shown **only once**, at creation time. It cannot be downloaded again — if you lose it, create a new one and update every integration that uses it.

Treat the secret like a password, and keep it on the device where you created it. **It should never leave that device.** Don't sync it through cloud drives, don't paste it into chat messages or emails, don't commit it to a repository, and don't bundle it into code that ships to a client. Anyone with the secret can sign requests on your behalf.

If you suspect a key has been exposed, revoke it immediately from your [Extensions page](https://access.mymind.com/extensions) and issue a new one.

## Signing a request

Generate a fresh JWT for each request, signed with your access key's secret. Binding the token to a specific path and method ensures a stolen token can't be replayed against a different endpoint.

### Header

| Field | Description |
|-------|-------------|
| alg | Signing algorithm. Must be `HS256`. |
| kid | Your access key's identifier. |

### Claims

| Field | Description |
|-------|-------------|
| path | The request path, e.g. `/objects`. |
| method | The HTTP method, uppercase, e.g. `GET`, `POST`. |
| iat | Issued-at time as Unix seconds. |
| exp | Expiry as Unix seconds. Recommended: 5 minutes from `iat` (`iat + 300`). Tokens past `exp` are rejected. |

### Signing in JavaScript

Pass the signed JWT as a bearer token in the `Authorization` header:

Request headers

```
Authorization: Bearer <signed-jwt>
Content-Type: application/json
User-Agent: my-app/1.0
```

Example — curl

```
curl https://api.mymind.com/objects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "User-Agent: my-app/1.0"
```

## Failed authentication

If the token is missing, malformed, or signed with the wrong secret, the API returns `401 Unauthorized`. If the key doesn't have permission for the requested action or scope, the API returns `403 Forbidden` — see [Access Control](access-control.md).

Response 401 Unauthorized
