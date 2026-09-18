# Consent Model

This page explains the structure of a consent record: what fields it contains, what they mean, and how to build a valid payload. If you need to understand exactly what you're sending and why each field matters, this is where you go.

For the step-by-step flow that uses this payload, see [Integration Lifecycle](./integration-lifecycle.md).

## Consent payload (what you send)

When you submit consent via `POST /mobile/consents/{projectId}/cookies/{configId}`, the request body must include:

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "preferences": {
    "vendors": {
      "googletagmanager": true,
      "google_firebase_analytics": false
    }
  }
}
```

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `accept` | boolean | `true` if the user accepts all or some vendors; `false` if they reject all vendors; can also represent a partial acceptance depending on your UI flow |
| `token` | string | The user token from `GET /mobile/token` (16-char lowercase alphanumeric) |
| `preferences.vendors` | object | Keys are vendor **`name` slugs** from your vendor list; values are `true` (accepted) or `false` (rejected). Must have at least one vendor key. |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `preferences.config` | object | Configuration details; see [`preferences.config`](#preferencesconfig-optional) below |
| `preferences.googleConsentMode` | object | Google Consent Mode v2 signals (see [Google Consent Mode](#google-consent-mode-v2) section below) |
| `value` | string or null | Optional pass-through field; max 255 characters. Returned as-is in the consent record. Useful for storing custom metadata. |
| `timestamp` | string | ISO 8601 time the user made the choice. Defaults to the time the API received the request |
| `headers` | object | Client metadata; see [`headers`](#headers-optional) below |

### Size limits

The request body must be **100 KB or smaller** — a larger body is rejected with `413`. The `token`
field must be 255 characters or fewer.

### Field details

#### `accept`

- `true`: User accepted consent (all or some vendors)
- `false`: User rejected consent (rejected all vendors)
- Both are valid. Use `false` when the user declines all vendors or does not interact with the consent interface

#### `preferences.vendors`

An object where:
- **Key**: the vendor's **`name`** field from `GET /mobile/vendors/{projectId}` — a slug such as
  `googletagmanager` or `google_firebase_analytics`. **Not** the vendor's `id` (the 24-char hex
  ObjectId), and not a display title.
- **Value**: `true` (accepted) or `false` (rejected)

Example:

```json
"preferences": {
  "vendors": {
    "googletagmanager": true,
    "google_firebase_analytics": false,
    "custom_vendor": true
  }
}
```

> **This is the single easiest thing to get wrong.** The API does not validate vendor keys — it
> stores whatever you send and returns `200`. But the rest of the platform, including the web
> widget that reads a shared consent, matches on the `name` slug. Send an `id`, a display title, or
> an invented key and the consent is recorded but effectively invisible: the widget will not
> recognise the user's choices and will prompt them again. See
> [WebView consent sharing](../platform-guides/webview-consent-sharing.md).

> **Important**: This object must not be empty. Every consent submission must include at least one vendor key.

#### `preferences.config` (optional)

Additional configuration metadata:

```json
"preferences": {
  "config": {
    "name": "mchffr-app",
    "identifier": "6859079473219bcbb8435079",
    "language": "en",
    "consentMode": "opt-in",
    "displayMode": "banner",
    "tag": "v2",
    "mobileContext": {
      "platform": "react-native",
      "offline": false,
      "networkType": "wifi"
    }
  },
  "vendors": { ... }
}
```

| Field | Description |
|-------|-------------|
| `name` | The configuration's back-office name |
| `identifier` | The `configId` (24-char hex ObjectId) |
| `language` | Language the consent UI was shown in |
| `consentMode` | How consent was collected, e.g. `opt-in` |
| `displayMode` | How the UI was presented, e.g. `banner` |
| `tag` | Free-form version tag for your own UI |
| `mobileContext` | `platform`, `offline` (boolean), `syncBatch` (for queued offline submissions), `networkType` (`wifi` \| `cellular` \| `unknown`) |

If omitted, the API uses the configuration from the endpoint path (`{configId}`).

#### `headers` (optional)

Client metadata stored alongside the consent. Top-level, **not** inside `preferences`:

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "headers": {
    "user-agent": "MyApp/2.1.0 (iOS 17.0; iPhone)",
    "x-mobile-platform": "react-native",
    "x-mobile-version": "17.0",
    "x-app-version": "2.1.0",
    "x-device-id": "uuid-device-123",
    "x-session-id": "session-789"
  },
  "preferences": { ... }
}
```

`x-mobile-platform` accepts `ios`, `android`, `react-native`, `flutter`, `xamarin`, or `cordova`.
The API also records its own `headers` block on the response (IP, country, user agent); the two are
merged, not overwritten.

#### `preferences.googleConsentMode` (optional)

Google Consent Mode v2 signals. See [Google Consent Mode v2](#google-consent-mode-v2) section below. Must go inside `preferences`, NOT at the top level of the payload.

**Common mistake**:

```json
// WRONG: googleConsentMode at top level
{
  "accept": true,
  "token": "...",
  "googleConsentMode": { ... },    // ← WRONG: silently ignored
  "preferences": { ... }
}

// CORRECT: googleConsentMode inside preferences
{
  "accept": true,
  "token": "...",
  "preferences": {
    "googleConsentMode": { ... },  // ← CORRECT
    "vendors": { ... }
  }
}
```

#### `value` (optional)

A pass-through string field (max 255 characters) or `null`. The API stores and returns it as-is in the consent record. Useful for:
- Storing custom metadata (e.g. a session ID, campaign code)
- Tracking integration points
- A/B testing UI variants

Example:

```json
{
  "accept": true,
  "token": "...",
  "value": "campaign_summer_2025_v2",
  "preferences": { ... }
}
```

---

## Consent response (what the API returns)

When you submit consent or retrieve it later, the API returns:

```json
{
  "consentId": "01a0b37b-3621-7913-bd50-7a37b56816e7",
  "_id": "01a0b37b-3621-7913-bd50-7a37b56816e7",
  "projectId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-06-01T12:05:00.000Z",
  "headers": {
    "ip": "203.0.113.45",
    "country": "GB",
    "userAgent": "Mozilla/5.0..."
  },
  "accept": true,
  "collection": "cookies",
  "identifier": "6859079473219bcbb8435079",
  "token": "flfvv6d974b9jxwd",
  "value": null,
  "preferences": {
    "vendors": {
      "googletagmanager": true,
      "google_firebase_analytics": false
    },
    "googleConsentMode": {
      "version": 2,
      "ad_storage": "granted",
      "analytics_storage": "granted",
      "ad_user_data": "denied",
      "ad_personalization": "denied",
      "functionality_storage": "denied",
      "personalization_storage": "denied",
      "security_storage": "denied"
    }
  }
}
```

### Response fields

| Field | Description |
|-------|-------------|
| `consentId`, `_id` | Same value; the unique ID for this consent record (a UUID). Only `_id` is present when reading a consent back |
| `projectId` | Your project ID |
| `createdAt` | ISO 8601 timestamp when the consent was recorded |
| `headers` | Metadata from the HTTP request: IP address, country, user agent |
| `accept` | The `accept` value you submitted |
| `collection` | The collection type: `cookies`, `processings`, `terms` / `contractsV2` |
| `identifier` | The configuration identifier (`configId`) used |
| `token` | The user token (echoes what you sent) |
| `value` | The `value` field you submitted (or `null` if not provided) |
| `preferences` | The full preferences object you submitted, including vendors and googleConsentMode |

When reading a consent back, `preferences` may also carry `mobileOptimized` (`compactVendors`, `essentialOnly`), and TCF consents include a top-level `decoded` object with the parsed TC string.

---

## Collection types

The `POST /mobile/consents/{projectId}/{collection}/{configId}` endpoint supports different collection types:

| Collection | Purpose | When to use |
|------------|---------|-------------|
| `cookies` | Cookie consent (most common) | Default consent type for website/app cookie preferences |
| `processings` | GDPR legal basis / data processing consent | When you need to track legal basis for data processing (contract, legitimate interest, etc.) |
| `terms` | Terms & Conditions acceptance | The public name for `contractsV2`. Use this in new integrations — see [Terms & Conditions](../api-reference/terms.md) |
| `contractsV2` | Same collection as `terms` | The internal name; both paths route to the same place |
| `contracts` | Legacy contract consent | Deprecated; use `terms` instead |

In the integration lifecycle, we use `cookies` in the examples:

```
POST /mobile/consents/{projectId}/cookies/{configId}
```

To submit to a different collection, change the path:

```
POST /mobile/consents/{projectId}/processings/{configId}
POST /mobile/consents/{projectId}/terms/{configId}
```

The same names are used when reading a consent back, as the `?service=` query parameter:

```
GET /mobile/client/{projectId}/consents/{token}?service=terms&identifier={configId}
```

### IAB TCF consents

Projects whose configuration has `flowType: "tcf"` submit an IAB TCF consent instead: the same
endpoint, with `preferences.tcString`, `preferences.cmpVersion`, `preferences.gdprApplies` and
`preferences.version` in the body. Those submissions are validated against a dedicated schema and
return JSON error bodies rather than plain text. The TCF flow is not covered in this guide yet —
see the [Swagger UI](https://headless-api.axeptio.tech/mobile/docs) for the full contract.

---

## Google Consent Mode v2

Google Consent Mode v2 signals tell Google how to behave based on user consent choices. They are optional but recommended if you use Google products (Analytics, Ads, Tag Manager).

### Structure

```json
"preferences": {
  "googleConsentMode": {
    "version": 2,
    "ad_storage": "granted" | "denied",
    "analytics_storage": "granted" | "denied",
    "ad_user_data": "granted" | "denied",
    "ad_personalization": "granted" | "denied",
    "functionality_storage": "granted" | "denied",
    "personalization_storage": "granted" | "denied",
    "security_storage": "granted" | "denied"
  }
}
```

### Signals explained

| Signal | Meaning |
|--------|---------|
| `ad_storage` | Whether Google can store cookies for advertising purposes |
| `analytics_storage` | Whether Google can store cookies for analytics (Google Analytics) |
| `ad_user_data` | Whether Google can use user data for ads (Google Ads, DV360) |
| `ad_personalization` | Whether Google can use user data to personalize ads |
| `functionality_storage` | Whether cookies for website functionality (non-marketing) can be stored |
| `personalization_storage` | Whether cookies for site personalization can be stored |
| `security_storage` | Whether cookies for security (fraud prevention, abuse) can be stored |

### Typical mappings

If your consent UI has buttons like "Accept All" and "Reject All":

**Accept All**:
```json
"googleConsentMode": {
  "version": 2,
  "ad_storage": "granted",
  "analytics_storage": "granted",
  "ad_user_data": "granted",
  "ad_personalization": "granted",
  "functionality_storage": "granted",
  "personalization_storage": "granted",
  "security_storage": "granted"
}
```

**Reject All**:
```json
"googleConsentMode": {
  "version": 2,
  "ad_storage": "denied",
  "analytics_storage": "denied",
  "ad_user_data": "denied",
  "ad_personalization": "denied",
  "functionality_storage": "denied",
  "personalization_storage": "denied",
  "security_storage": "denied"
}
```

### Known issues

1) The example app places `googleConsentMode` at the top level of the payload instead of inside `preferences`. At the top level, it is silently ignored by the API. Always put it inside `preferences`.
2) The example app only sends 4 of the 7 Google Consent Mode signals. It is missing `functionality_storage`, `personalization_storage`, and `security_storage`. Make sure your implementation sends all 7.

---

## Minimal vs. complete payload

### Minimal payload

The smallest valid consent submission:

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "preferences": {
    "vendors": {
      "google_analytics": true
    }
  }
}
```

This works. The API does not require Google Consent Mode, `preferences.config`, or the `value` field.

### Complete payload

A comprehensive consent submission with all optional fields:

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "value": "campaign_id_12345",
  "preferences": {
    "config": {
      "language": "en",
      "identifier": "6859079473219bcbb8435079"
    },
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false,
      "custom_vendor": true
    },
    "googleConsentMode": {
      "version": 2,
      "ad_storage": "granted",
      "analytics_storage": "granted",
      "ad_user_data": "denied",
      "ad_personalization": "denied",
      "functionality_storage": "granted",
      "personalization_storage": "denied",
      "security_storage": "granted"
    }
  }
}
```

---

## API validation behavior

### What the API validates

- `accept` is a boolean
- `token` is a non-empty string
- `preferences.vendors` is an object with at least one key-value pair

### What the API does NOT validate

- Vendor keys against your configured vendor list (arbitrary vendor keys are accepted)
- Google Consent Mode signal values (any string is accepted, though `granted` and `denied` are recommended)
- `preferences.config` field structure (any values are accepted)
- `value` field content (any string up to 255 chars is accepted)

This flexibility allows for forward compatibility and experimentation, but it also means **your client code** should validate:
- Vendor keys against the vendor list from `GET /mobile/vendors/{projectId}`
- Google Consent Mode signal values are either `granted` or `denied`
- User input is valid before submitting

---

## Batch endpoint (not implemented)

The Swagger documentation includes a `POST /mobile/consents/batch` endpoint for submitting multiple consent records at once. This endpoint is **not implemented** and returns a 404 error.

```bash
# This will fail
curl -X POST https://headless-api.axeptio.tech/mobile/consents/batch \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[...]'

# Response: 404 Not Found
```

To submit multiple consents, call the single-consent endpoint multiple times (or in parallel).

---

## Next steps

- See how this payload fits into the full integration: [Integration Lifecycle](./integration-lifecycle.md)
- Implement this in your app: [React Native Guide](../platform-guides/react-native.md)
- Deep dive into Google Consent Mode: see the [Google Consent Mode v2](#google-consent-mode-v2) section above

---

**Related**: [Integration Lifecycle](./integration-lifecycle.md) | [Identifiers](./identifiers.md) | [API Reference](../api-reference/overview.md)
