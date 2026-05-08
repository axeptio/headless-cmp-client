# Integration Lifecycle

This page walks through the complete flow from getting your credentials to submitting and retrieving consent. Think of it as the recipe: each step builds on the previous one, and each endpoint call returns something the next step needs.

Before starting, make sure you have your credentials: [Get your credentials](./credentials.md).

## The six-step flow

```
1. Authenticate        ← Validate your API token
2. Fetch configuration ← Get your default configId
3. Fetch vendors       ← Get the vendor list for your UI
4. Generate user token ← Get one token per user/device
5. Submit consent      ← Send the user's choices
6. Read consent back   ← Verify what you stored
```

Each step is idempotent or can be repeated (e.g. you can fetch vendors once and cache them, or fetch on every app launch). Only step 5 (submit consent) has side effects (creates a new consent record).

## Step 1: Authenticate

**Purpose**: Validate that your API token works before building integration code.

**Endpoint**: `GET /mobile/auth/me`

**What you need**: Your Bearer token (from [Credentials](./credentials.md))

**cURL example**:

```bash
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response**:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "tier": "pro",
  "authorized": true,
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

**What to check**: The `authorized` field is `true`. If it's `false` or missing, your token is invalid.

**What you get for step 2**: The `projectId` from the response (confirms it matches your credentials).

---

## Step 2: Fetch configuration

**Purpose**: Get the list of configurations in your project and identify the default one.

**Endpoint**: `GET /mobile/configurations/{projectId}`

**What you need**: Your `projectId` (from step 1) and Bearer token

**cURL example**:

```bash
curl https://headless-api.axeptio.tech/mobile/configurations/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response**:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "configurations": [
    {
      "identifier": "my-config-en",
      "name": "English Configuration",
      "title": "Cookie Preferences",
      "language": "en",
      "country": "GB",
      "isDefault": true
    },
    {
      "identifier": "my-config-fr",
      "name": "French Configuration",
      "title": "Préférences relatives aux cookies",
      "language": "fr",
      "country": "FR",
      "isDefault": false
    }
  ],
  "defaultConfigId": "my-config-en"
}
```

**What to check**: The response contains at least one configuration. Use the `defaultConfigId` for the next steps (or pick a specific configuration by its `identifier` if you want to support multiple languages/regions).

**What you get for step 3**: The `defaultConfigId` (or your chosen `configId`).

---

## Step 3: Fetch vendors

**Purpose**: Get the list of vendors (ad networks, analytics, etc.) so you can render them in your UI.

**Endpoint**: `GET /mobile/vendors/{projectId}`

**What you need**: Your `projectId` (from step 1) and Bearer token

**cURL example**:

```bash
curl https://headless-api.axeptio.tech/mobile/vendors/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response**:

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "vendors": [
    {
      "id": "google_analytics",
      "name": "Google Analytics",
      "description": "Measures website usage",
      "category": "analytics"
    },
    {
      "id": "facebook_pixel",
      "name": "Facebook Pixel",
      "description": "Enables ads and analytics on Facebook",
      "category": "advertising"
    }
  ],
  "totalVendors": 2,
  "categories": ["analytics", "advertising", "functional"],
  "fetchedAt": "2025-06-01T12:00:00.000Z"
}
```

**What to check**: The response contains vendors. Build your UI with toggles for each vendor ID.

**What you get for step 4**: The vendor list (cache it or use it to validate user choices in step 5).

**Note**: This step is optional if you're using a pre-built UI. If you're building custom UI, you need this data.

---

## Step 4: Generate a user token

**Purpose**: Create a unique identifier for this user's consent record.

**Endpoint**: `GET /mobile/token`

**What you need**: Bearer token only

**cURL example**:

```bash
curl https://headless-api.axeptio.tech/mobile/token \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response**:

```json
{
  "token": "flfvv6d974b9jxwd",
  "projectId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

**What to check**: The response contains a `token` (16-character lowercase alphanumeric string).

**Important**: 
- Generate one token per user (or per device in a mobile app)
- Tokens do not expire
- Store the token in secure storage (iOS Keychain, Android Keystore) so you can reuse it for future consent submissions
- Do not generate a new token every time the user updates their preferences; reuse the same one

**What you get for step 5**: The user `token`.

---

## Step 5: Submit consent

**Purpose**: Record the user's consent choices.

**Endpoint**: `POST /mobile/consents/{projectId}/cookies/{configId}`

**What you need**:
- `projectId` (from step 1)
- `configId` (from step 2)
- User `token` (from step 4)
- Bearer token
- The user's consent choices (which vendors they accept/reject)

**cURL example**:

```bash
curl -X POST https://headless-api.axeptio.tech/mobile/consents/507f1f77bcf86cd799439011/cookies/my-config-en \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accept": true,
    "token": "flfvv6d974b9jxwd",
    "preferences": {
      "vendors": {
        "google_analytics": true,
        "facebook_pixel": false
      }
    }
  }'
```

**Response**:

```json
{
  "consentId": "507f1f77bcf86cd799439012",
  "_id": "507f1f77bcf86cd799439012",
  "projectId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-06-01T12:05:00.000Z",
  "headers": {
    "ip": "203.0.113.45",
    "country": "GB",
    "userAgent": "..."
  },
  "accept": true,
  "collection": "cookies",
  "identifier": "my-config-en",
  "token": "flfvv6d974b9jxwd",
  "value": null,
  "preferences": {
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false
    }
  }
}
```

**What to check**: The response contains a `consentId` and `accept` matches what you submitted.

**Important payload details**: See [Consent Model](./consent-model.md) for the full schema, including optional fields like `googleConsentMode`, `preferences.config`, and the `value` pass-through field.

**What you get for step 6**: Confirmation that the consent was recorded. You now have a `consentId` if you need to reference this record later.

---

## Step 6: Read consent back

**Purpose**: Retrieve a user's consent record to verify what was stored or to audit consent history.

**Endpoint**: `GET /mobile/client/{projectId}/consents/{token}`

**What you need**:
- `projectId` (from step 1)
- User `token` (from step 4)
- Query parameters: `identifier` (your `configId` from step 2) and `service` (the collection type, e.g. `cookies`)
- Bearer token

**cURL example**:

```bash
curl "https://headless-api.axeptio.tech/mobile/client/507f1f77bcf86cd799439011/consents/flfvv6d974b9jxwd?identifier=my-config-en&service=cookies" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response**:

```json
{
  "consentId": "507f1f77bcf86cd799439012",
  "projectId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-06-01T12:05:00.000Z",
  "accept": true,
  "collection": "cookies",
  "identifier": "my-config-en",
  "token": "flfvv6d974b9jxwd",
  "preferences": {
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false
    }
  }
}
```

**What to check**: The response contains the consent record you submitted in step 5. Verify the `accept` and `preferences` fields match your expectations.

**Important**: Both query parameters (`identifier` and `service`) are required. Without them, the endpoint will not return the expected data.

---

## Optional: Send analytics events

You can also send analytics events to track user interactions (when consent was displayed, accepted, rejected, etc.).

**Endpoint**: `POST /mobile/analytics/evts`

See the [API Reference](../api-reference/overview.md) for details on event types and payload structure.

---

## Typical integration patterns

### Pattern 1: Generate once, reuse forever

1. On app launch, check if the user has a stored token
2. If yes, skip step 4 and go straight to step 5 (submit updated consent)
3. If no, run steps 4–5

This is the most common pattern and avoids generating unnecessary tokens.

### Pattern 2: Offline support

1. Run steps 1–4 when the app has a network connection
2. Store the token locally (secure storage)
3. Queue consent submissions (step 5) locally
4. Sync queued submissions when the network is available again

### Pattern 3: Pre-built UI

If you're using one of Axeptio's native SDKs (iOS, Android, Flutter) instead of building custom UI, those SDKs handle steps 2–5 internally. You still need to set up credentials (step 1) and handle the token (step 4).

---

## Troubleshooting

**Step 1 fails (401 Unauthorized)**
- Check your Bearer token format: `Authorization: Bearer YOUR_API_TOKEN` (note the space)
- Confirm your token is correct in [Credentials](./credentials.md)

**Step 2 or 3 returns empty**
- Confirm your `projectId` is correct
- Confirm you have an active subscription (see [Credentials](./credentials.md))

**Step 5 fails**
- Confirm the `token` value is correct and in the request body (not header)
- Confirm the `preferences.vendors` object is not empty
- See [Consent Model](./consent-model.md) for the full payload schema

**Step 6 returns empty or 404**
- Confirm both `identifier` and `service` query parameters are present
- Confirm the token matches the one from step 4
- Check that you submitted consent for this token in step 5

---

## Next steps

- Understand the consent payload in detail: [Consent Model](./consent-model.md)
- Implement this flow in your platform: [React Native Guide](../platform-guides/react-native.md)
- Explore Google Consent Mode: [Consent Model: Google Consent Mode v2](./consent-model.md#google-consent-mode-v2)

---

**Related**: [Credentials](./credentials.md) | [Identifiers](./identifiers.md) | [Consent Model](./consent-model.md) | [API Reference](../api-reference/overview.md)
