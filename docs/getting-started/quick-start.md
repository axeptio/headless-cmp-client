# 5-Minute Quick Start

Get consent running in your React Native app in minutes.

## Prerequisites

- React Native 0.73+ or Expo SDK 50+
- Axeptio account with API access
- Basic knowledge of REST APIs

## Step 1: Get Your Credentials

To get API access, [contact our sales team](https://www.axeptio.eu). Once onboarded, you will receive your **Project ID** and **API Token**.

> Store your token in the device keychain, not in source code or plain AsyncStorage. See [Authentication Guide](./authentication.md).

## Step 2: Test with cURL

Verify credentials before writing any app code:

```bash
# Validate your token
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
# → { "valid": true, "projectId": "...", "tier": "..." }

# Get project configuration
curl https://headless-api.axeptio.tech/mobile/configurations/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Step 3: Submit Your First Consent

```bash
# 1. Generate a consent token
TOKEN=$(curl -s https://headless-api.axeptio.tech/mobile/token \
  -H "Authorization: Bearer YOUR_API_TOKEN" | jq -r .token)

# 2. Submit consent
curl -X POST \
  "https://headless-api.axeptio.tech/mobile/consents/YOUR_PROJECT_ID/cookies/default" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-mobile-platform: react-native" \
  -d "{
    \"accept\": true,
    \"token\": \"$TOKEN\",
    \"preferences\": {
      \"vendors\": { \"google_analytics\": true, \"facebook_pixel\": false }
    }
  }"

# 3. Read it back
curl "https://headless-api.axeptio.tech/mobile/client/YOUR_PROJECT_ID/consents/$TOKEN" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Step 4: Integrate in React Native

```javascript
const BASE_URL = 'https://headless-api.axeptio.tech';
const PROJECT_ID = 'YOUR_PROJECT_ID';
const API_TOKEN = 'YOUR_API_TOKEN'; // Use secure storage in production

async function initConsent() {
  // Get a token for this user
  const { token } = await fetch(`${BASE_URL}/mobile/token`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  }).then(r => r.json());

  // Submit consent
  await fetch(`${BASE_URL}/mobile/consents/${PROJECT_ID}/cookies/default`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'x-mobile-platform': 'react-native',
    },
    body: JSON.stringify({
      accept: true,
      token,
      preferences: {
        vendors: { google_analytics: true, facebook_pixel: false },
      },
    }),
  });
}
```

For the full `useConsent` hook, `ConsentProvider`, offline queue, and TypeScript types, see the [React Native Guide](../platform-guides/react-native.md).

## Step 5: Checklist

- [ ] Token validated with `GET /mobile/auth/me`
- [ ] Project configuration loads (`GET /mobile/configurations/{projectId}`)
- [ ] Consent submission returns `200`
- [ ] Consent can be retrieved (`GET /mobile/client/{projectId}/consents/{token}`)
- [ ] Error handling covers `401`, `429`, and offline scenarios

## Interactive API Explorer

Browse and test all endpoints in Swagger UI:
- Production: https://headless-api.axeptio.tech/mobile/docs
- Staging: https://staging-api.axeptio.tech/mobile/docs

Full endpoint reference: [API Reference](../api-reference/overview.md)

## Common Issues

**401 Unauthorized** — Check your token format (`Bearer ` prefix required). Validate with `GET /mobile/auth/me`.

**404 Not Found** — Verify your Project ID matches the project that issued the token.

**429 Rate Limited** — Implement exponential backoff. See [rate limits](../api-reference/overview.md#rate-limits).

**Network timeout** — Add offline queue support. See [React Native Guide](../platform-guides/react-native.md#offline-queue).

---

Next: [Authentication Guide →](./authentication.md) | [React Native Guide →](../platform-guides/react-native.md)
