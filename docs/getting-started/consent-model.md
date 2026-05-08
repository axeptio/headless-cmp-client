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
      "vendor_key_1": true,
      "vendor_key_2": false
    }
  }
}
```

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `accept` | boolean | `true` if the user accepts all or some vendors; `false` if they reject all vendors; can also represent a partial acceptance depending on your UI flow |
| `token` | string | The user token from `GET /mobile/token` (16-char lowercase alphanumeric) |
| `preferences.vendors` | object | Keys are vendor IDs from your vendor list; values are `true` (accepted) or `false` (rejected). Must have at least one vendor key. |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `preferences.config` | object | Configuration details; can include `language`, `identifier` (configId), and other metadata |
| `preferences.googleConsentMode` | object | Google Consent Mode v2 signals (see [Google Consent Mode](#google-consent-mode-v2) section below) |
| `value` | string or null | Optional pass-through field; max 255 characters. Returned as-is in the consent record. Useful for storing custom metadata. |

### Field details

#### `accept`

- `true`: User accepted consent (all or some vendors)
- `false`: User rejected consent (rejected all vendors)
- Both are valid. Use `false` when the user declines all vendors or does not interact with the consent interface

#### `preferences.vendors`

An object where:
- **Key**: Vendor identifier (string). Must match a vendor ID from your vendor list (from `GET /mobile/vendors/{projectId}`), or can be an arbitrary string (the API does not validate against the configured vendor list)
- **Value**: `true` (accepted) or `false` (rejected)

Example:

```json
"preferences": {
  "vendors": {
    "google_analytics": true,
    "facebook_pixel": false,
    "custom_vendor": true
  }
}
```

> **Important**: This object must not be empty. Every consent submission must include at least one vendor key.

#### `preferences.config` (optional)

Additional configuration metadata. Typically includes:

```json
"preferences": {
  "config": {
    "language": "en",
    "identifier": "my-config-en"
  },
  "vendors": { ... }
}
```

If omitted, the API uses the configuration from the endpoint path (`{configId}`).

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

This is tracked as a known issue (MSK-208) in the internal Axeptio ticket management, directed to the Example App..

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
  "consentId": "507f1f77bcf86cd799439012",
  "_id": "507f1f77bcf86cd799439012",
  "projectId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-06-01T12:05:00.000Z",
  "headers": {
    "ip": "203.0.113.45",
    "country": "GB",
    "userAgent": "Mozilla/5.0..."
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
| `consentId`, `_id` | Same value; the unique ID for this consent record |
| `projectId` | Your project ID |
| `createdAt` | ISO 8601 timestamp when the consent was recorded |
| `headers` | Metadata from the HTTP request: IP address, country, user agent |
| `accept` | The `accept` value you submitted |
| `collection` | The collection type: `cookies`, `processings`, `contracts`, or `contractsV2` |
| `identifier` | The configuration identifier (`configId`) used |
| `token` | The user token (echoes what you sent) |
| `value` | The `value` field you submitted (or `null` if not provided) |
| `preferences` | The full preferences object you submitted, including vendors and googleConsentMode |

---

## Collection types

The `POST /mobile/consents/{projectId}/{collection}/{configId}` endpoint supports different collection types:

| Collection | Purpose | When to use |
|------------|---------|-------------|
| `cookies` | Cookie consent (most common) | Default consent type for website/app cookie preferences |
| `processings` | GDPR legal basis / data processing consent | When you need to track legal basis for data processing (contract, legitimate interest, etc.) |
| `contracts` | Legacy contract consent | Deprecated; use `contractsV2` instead |
| `contractsV2` | Modern contract consent with support for `consentFor` field | For service-specific consent tracking |

In the integration lifecycle, we use `cookies` in the examples:

```
POST /mobile/consents/{projectId}/cookies/{configId}
```

To submit to a different collection, change the path:

```
POST /mobile/consents/{projectId}/processings/{configId}
POST /mobile/consents/{projectId}/contractsV2/{configId}
```

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
      "identifier": "my-config-en"
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
