# 5-Minute Quick Start

Get consent running in your app in minutes. This guide walks you through validating your credentials, submitting a consent record, and reading it back, all from the command line first, then in code.

For the full step-by-step flow, see [Integration Lifecycle](./integration-lifecycle.md).

## Prerequisites

- Axeptio API token and project ID (see [Get your credentials](./credentials.md))
- A terminal with cURL and [jq](https://jqlang.github.io/jq/) (for steps 1-3)
- React Native 0.73+ or Expo SDK 50+ (for step 4, if using the example app)

## Step 1: Validate your token

Confirm your credentials work before writing any code:

```bash
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

You should see:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "tier": "pro",
  "authorized": true,
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

Check that `authorized` is `true` and that `projectId` matches your project. If you get a `401`, double-check the `Bearer ` prefix (with a space). See [Credentials](./credentials.md) for troubleshooting.

## Step 2: Fetch your configuration

Get your default configuration identifier (`configId`). You'll need it for consent submission and retrieval.

```bash
curl https://headless-api.axeptio.tech/mobile/configurations/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Look for the `defaultConfigId` field in the response. Save that value; you'll use it in every consent call. See [Identifiers: configId](./identifiers.md#configid) for details.

## Step 3: Submit and read your first consent

```bash
# 1. Generate a user token
TOKEN=$(curl -s https://headless-api.axeptio.tech/mobile/token \
  -H "Authorization: Bearer YOUR_API_TOKEN" | jq -r .token)

# 2. Submit consent (replace YOUR_PROJECT_ID and YOUR_CONFIG_ID)
curl -X POST \
  "https://headless-api.axeptio.tech/mobile/consents/YOUR_PROJECT_ID/cookies/YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"accept\": true,
    \"token\": \"$TOKEN\",
    \"preferences\": {
      \"vendors\": { \"google_analytics\": true, \"facebook_pixel\": false }
    }
  }"

# 3. Read it back (both query params are required)
curl "https://headless-api.axeptio.tech/mobile/client/YOUR_PROJECT_ID/consents/$TOKEN?service=cookies&identifier=YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

If step 3 returns the consent you just submitted, your integration is working. For the full payload schema (including optional Google Consent Mode signals), see [Consent Model](./consent-model.md).

## Step 4: Run the example app

The repo includes a working React Native (Expo) example that demonstrates a custom consent modal with vendor toggles and direct API integration:

```bash
cd examples/react-native
npm install
npm start
```

Open `examples/react-native/App.js` to see how the API calls from steps 1-3 translate into a real app. The example app is a reference implementation, not a packaged SDK; copy and adapt the patterns for your own UI.

For a guided walkthrough of the example app's code, see the [React Native Guide](../platform-guides/react-native.md).

## Step 5: Integrate in your own code

Here's the minimal integration in JavaScript (works in React Native, Node.js, or any fetch-capable environment):

```javascript
const PROJECT_ID = 'your_project_id';
const API_TOKEN  = 'your_api_token'; // Use secure storage in production
const BASE_URL   = 'https://headless-api.axeptio.tech';

// 1. Get a consent token
const { token } = await fetch(`${BASE_URL}/mobile/token`, {
  headers: { Authorization: `Bearer ${API_TOKEN}` },
}).then(r => r.json());

// 2. Fetch configuration to get configId
const { defaultConfigId } = await fetch(`${BASE_URL}/mobile/configurations/${PROJECT_ID}`, {
  headers: { Authorization: `Bearer ${API_TOKEN}` },
}).then(r => r.json());

// 3. Submit consent
await fetch(`${BASE_URL}/mobile/consents/${PROJECT_ID}/cookies/${defaultConfigId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    accept: true,
    token,
    preferences: {
      vendors: { google_analytics: true, facebook_pixel: false },
    },
  }),
});

// 4. Read consent back (both query params are required)
const consent = await fetch(
  `${BASE_URL}/mobile/client/${PROJECT_ID}/consents/${token}?service=cookies&identifier=${defaultConfigId}`,
  { headers: { Authorization: `Bearer ${API_TOKEN}` } }
).then(r => r.json());
```

This matches the snippet in the [README](../../README.md). Store the API token in secure storage (iOS Keychain, Android Keystore) in production; see [Credentials: Store the token securely](./credentials.md#store-the-token-securely).

## Checklist

- [ ] Token validated with `GET /mobile/auth/me` (response has `authorized: true`)
- [ ] Configuration loads (`GET /mobile/configurations/{projectId}`) and you have a `configId`
- [ ] Consent submission returns `200` (`POST /mobile/consents/{projectId}/cookies/{configId}`)
- [ ] Consent can be retrieved (`GET /mobile/client/{projectId}/consents/{token}?service=cookies&identifier={configId}`)
- [ ] API token stored in secure storage (not in source code or plain AsyncStorage)

## Interactive API explorer

Browse and test all endpoints in Swagger UI:
- Production: https://headless-api.axeptio.tech/mobile/docs
- Staging: https://staging-api.axeptio.tech/mobile/docs

Full endpoint reference: [API Reference](../api-reference/overview.md)

## Common issues

**401 Unauthorized**: Check your token format (`Bearer ` prefix required, with a space). Validate with `GET /mobile/auth/me`. See [Credentials](./credentials.md).

**404 Not Found**: Verify your project ID matches the project associated with your token. For consent retrieval, confirm both `service` and `identifier` query parameters are present.

**Empty response on consent retrieval**: The `service` and `identifier` query parameters are both required. Without them, the endpoint will not return the expected data.

**Network timeout**: Add retry logic with exponential backoff for production apps.

---

Next: [Integration Lifecycle](./integration-lifecycle.md) | [Consent Model](./consent-model.md) | [API Reference](../api-reference/overview.md)