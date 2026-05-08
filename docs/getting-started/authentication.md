# Authentication Guide

How authentication works in the headless CMP API: what tokens exist, how to use them, and how to handle errors.

For how to obtain your credentials, see [Get your credentials](./credentials.md). For a full map of which identifier goes where, see [Identifiers](./identifiers.md).

## Two tokens, two jobs

The API uses two different tokens. Think of it like a building pass and a visitor badge: the building pass (Bearer token) gets your app through the door, and the visitor badge (user token) tracks which specific person is inside.

| Token | Purpose | Where it goes | Obtained from |
|-------|---------|--------------|---------------|
| Bearer token (API token) | Authenticates your app | `Authorization: Bearer {token}` header | Support request (see [Credentials](./credentials.md)) |
| User token (consent token) | Identifies a user's consent record | Request body and URL path | `GET /mobile/token` endpoint |

Every API request needs the Bearer token. Only consent-related requests need a user token.

See [Identifiers](./identifiers.md) for the full breakdown of which endpoint needs which token.

## How authentication works

Every request must include the Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

The API validates the token on every request. If the token is missing, malformed, or expired, the API returns `401 Unauthorized`.

### Validate your token

Before building any integration code, confirm your token works:

```bash
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Successful response:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "tier": "pro",
  "authorized": true,
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

Check that `authorized` is `true` and that `projectId` matches your project. If you get a `401`, double-check the `Bearer ` prefix (note the space after "Bearer").

> **Note**: The response field is `authorized`, not `valid`. Some older documentation references `valid`; that is incorrect.

## Bearer token expiry

Bearer tokens do expire. The API returns `401 Unauthorized` when a token has expired. There is no refresh endpoint; when your token expires, you need to request a new one through the same support channel you used originally (see [Credentials](./credentials.md)).

> **Open question**: The exact TTL (time-to-live) for Bearer tokens has not been confirmed. If your integration stops working with a `401` after a period of time, token expiry is the likely cause.

## User token lifetime

User tokens (the 16-character consent tokens from `GET /mobile/token`) do not expire. There is no TTL or cleanup mechanism in the gateway code. Generate one per user or device, store it, and reuse it for all future consent submissions.

## Secure storage recommendations

The API token grants full access to your project. Treat it like a password.

**Do:**
- Store in the platform's secure storage (iOS Keychain, Android Keystore, or equivalent)
- Use environment variables or a `.env` file during development (excluded from git)
- Clear tokens on logout or app uninstall

**Do not:**
- Commit tokens to source control
- Log tokens in console output, analytics, or crash reports
- Store in plain text files, AsyncStorage, SharedPreferences, or localStorage
- Pass tokens in URL parameters or form data

For a React Native implementation, the `react-native-keychain` package provides access to iOS Keychain and Android Keystore. See its documentation for usage patterns.

## Error handling

### HTTP status codes

| Status | Meaning | What to do |
|--------|---------|-----------|
| `200` | Success | Process the response |
| `401` | Unauthorized | Token is missing, malformed, or expired. Verify format, request a new token if needed |
| `403` | Forbidden | Token is valid but lacks permission for this endpoint |
| `404` | Not found | Check the endpoint path and identifiers (projectId, configId, token) |
| `429` | Rate limited | Wait and retry. Check the `Retry-After` header for the delay |
| `500` | Server error | Retry with backoff; report if persistent |

### Recommended error handling pattern

When your integration receives a `401`:

1. Stop making API calls
2. Log the error (without including the token value)
3. Notify the user or trigger a re-authentication flow
4. Request a new token if the current one has expired

When your integration receives a `429`:

1. Read the `Retry-After` response header
2. Wait for the specified duration
3. Retry the request
4. If you hit rate limits frequently, reduce your request frequency or batch your operations

### Network errors

For production apps, implement retry logic with exponential backoff for network failures. A reasonable starting point: retry up to 3 times, with delays of 1s, 2s, and 4s.

## Security best practices

1. **Always use HTTPS.** The API base URLs (`https://headless-api.axeptio.tech/mobile` and `https://staging-api.axeptio.tech/mobile`) are HTTPS only.

2. **Consider certificate pinning** for production mobile apps to prevent man-in-the-middle attacks.

3. **Set request timeouts.** 30 seconds is a reasonable default for mobile networks.

4. **Separate staging and production tokens.** Use the staging environment (`https://staging-api.axeptio.tech/mobile`) during development; switch to production for release builds.

---

**Related**: [Credentials](./credentials.md) | [Identifiers](./identifiers.md) | [Integration Lifecycle](./integration-lifecycle.md) | [API Reference](../api-reference/overview.md)