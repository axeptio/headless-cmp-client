# Get your credentials

Before you can call any endpoint, you need two things: an **API token** (for authentication) and a **project ID** (to identify your project). Think of them as a key and an address: the token proves you're allowed in, and the project ID tells the API which project you're working with.

## What you need

| Credential | What it is | Looks like |
|------------|-----------|------------|
| API token (Bearer token) | Authenticates every API request | A long string, passed in the `Authorization` header |
| Project ID (`projectId`) | Identifies your Axeptio project | 24-character hexadecimal string (e.g. `507f1f77bcf86cd799439011`) |

## How to get them

Getting credentials is a two-step process:

**Step 1: Get your projectId** (no subscription required)

1. Create an account at [admin.axeptio.eu](https://admin.axeptio.eu/)
2. Create a new project (or select an existing one)
3. Find your projectId in the URL (`https://admin.axeptio.eu/projects/69e28f08e8c9b136a93672ee/services`) or in the **Integration** tab

See [Identifiers](./identifiers.md#projectid) for full details.

**Step 2: Get your API token** (subscription required)

1. Subscribe to any plan (all plans include API access)
2. In the admin panel, click **Support** (requires being logged in with cookies allowed). This redirects to [support.axeptio.eu](https://support.axeptio.eu/en/), where you can use the chat to request your API token
3. Include your projectId in the support request

Without a subscription, API calls will return an empty response even with a valid token.

For internal Axeptio projects, request both the projectId and API token through the engineering team.

## Validate your credentials

Once you have your token, confirm it works before writing any integration code:

```bash
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

A successful response looks like this:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "tier": "pro",
  "authorized": true,
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

Check for:

- `authorized` is `true` (not `false`, not missing)
- `projectId` matches the project you expect
- No `401 Unauthorized` HTTP status

If you get a `401`, double-check that your header uses the exact format `Authorization: Bearer YOUR_API_TOKEN` (with a space after "Bearer").

> **Note**: The response field is `authorized`, not `valid`. Some older documentation may reference `valid`; that is incorrect.

## Environments

| Environment | Base URL | When to use |
|-------------|----------|-------------|
| Production | `https://headless-api.axeptio.tech/mobile` | Live apps, real consent data |
| Staging | `https://staging-api.axeptio.tech/mobile` | Testing, development, experiments |

Both environments have Swagger UI for interactive testing:

- Production: https://headless-api.axeptio.tech/mobile/docs
- Staging: https://staging-api.axeptio.tech/mobile/docs

> **Warning**: You may encounter `https://api.axept.io/v1` in older examples or external guides. This is the wrong URL for the headless API. Always use the URLs above.

## How to use the token

Every API request must include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

This applies to all endpoints: configuration, vendors, consent submission, consent retrieval, token generation, and analytics.

## Store the token securely

The API token grants full access to your project. Treat it like a password:

- Do not commit it to source control
- Do not log it in console output, analytics, or crash reports
- In mobile apps, store it in the platform's secure storage (iOS Keychain, Android Keystore)
- In development, use environment variables or a `.env` file (excluded from git)

For platform-specific secure storage guidance, see the [React Native Guide](../platform-guides/react-native.md).

## Next steps

Now that you have working credentials, learn about the other identifiers you'll encounter during integration: [Identifiers Guide](./identifiers.md).

---

**Related**: [Identifiers](./identifiers.md) | [Integration Lifecycle](./integration-lifecycle.md) | [API Reference](../api-reference/overview.md)
