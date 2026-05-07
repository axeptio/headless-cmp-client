# API Reference

Complete reference for the Axeptio Headless CMP API. This page documents every endpoint with confirmed request/response shapes.

For the step-by-step integration flow, see [Integration Lifecycle](../getting-started/integration-lifecycle.md).
For payload details, see [Consent Model](../getting-started/consent-model.md).

Interactive documentation (Swagger UI):
- **Production**: https://headless-api.axeptio.tech/mobile/docs
- **Staging**: https://staging-api.axeptio.tech/mobile/docs

Raw OpenAPI specs:
- Production JSON: https://headless-api.axeptio.tech/mobile/swagger.json
- Staging JSON: https://staging-api.axeptio.tech/mobile/swagger.json
- Widget API: https://staging-api.axeptio.tech/mobile/swagger/widget.json

---

## Base URLs

| Environment | Base URL | When to use |
|-------------|----------|-------------|
| Production | `https://headless-api.axeptio.tech/mobile` | Live apps, real consent data |
| Staging | `https://staging-api.axeptio.tech/mobile` | Testing, development, experiments |

> **Warning**: You may encounter `https://api.axept.io/v1` in older examples or external guides. This is the wrong URL for the headless API. Always use the URLs above.

---

## Authentication

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

See [Get your credentials](../getting-started/credentials.md) for how to obtain and validate your token.

---

## Rate limits

Rate limits vary by tier. When you exceed them, the API returns `429 Too Many Requests` with a `Retry-After` header. Implement exponential backoff in your client.

---

## Endpoints

### Validate your token

```
GET /mobile/auth/me
```

Confirms that your Bearer token is valid and returns the associated project and tier.

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "tier": "pro",
  "authorized": true,
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

> **Note**: The field is `authorized`, not `valid`. Some older documentation may reference `valid`; that is incorrect.

---

### Fetch project configuration

```
GET /mobile/configurations/{projectId}
```

Returns the list of configurations in your project (language, region, etc.) and identifies the default one.

**Path parameters:**
- `projectId`: Your project identifier (24-char hex). See [Identifiers](../getting-started/identifiers.md#projectid).

**Response:**

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
    }
  ],
  "defaultConfigId": "my-config-en"
}
```

Use the `defaultConfigId` value as the `configId` in consent submission and retrieval endpoints. See [Identifiers: configId](../getting-started/identifiers.md#configid).

---

### Fetch vendors

```
GET /mobile/vendors/{projectId}
```

Returns all vendors configured for your project, with categories and image URLs.

**Path parameters:**
- `projectId`: Your project identifier

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "vendors": [
    {
      "id": "google_analytics",
      "name": "Google Analytics",
      "description": "Measures website usage",
      "category": "analytics"
    }
  ],
  "totalVendors": 1,
  "categories": ["analytics", "advertising", "functional"],
  "fetchedAt": "2025-06-01T12:00:00.000Z"
}
```

**Related endpoints:**

```
GET /mobile/vendors/{projectId}/categories
```

Vendors grouped by category.

```
GET /mobile/vendors/{projectId}/{configId}
```

Vendors for a specific configuration.

---

### Generate a user token

```
GET /mobile/token
```

Generates a cryptographically secure random token for identifying a user's consent record. Tokens are 16-character lowercase alphanumeric strings, generated via `crypto.getRandomValues()` (base36 encoding).

**Response:**

```json
{
  "token": "flfvv6d974b9jxwd",
  "projectId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

Tokens do not expire. Generate one per user (or per device) and store it in secure storage for reuse. See [Identifiers: User token](../getting-started/identifiers.md#user-token-consent-token).

---

### Submit consent

```
POST /mobile/consents/{projectId}/{collection}/{configId}
```

Records a user's consent choices.

**Path parameters:**
- `projectId`: Your project identifier (24-char hex)
- `collection`: Consent type: `cookies`, `processings`, `contracts`, or `contractsV2`. See [Consent Model: Collection types](../getting-started/consent-model.md#collection-types).
- `configId`: Configuration identifier from `GET /mobile/configurations/{projectId}`. See [Identifiers: configId](../getting-started/identifiers.md#configid).

> **Naming note**: The Swagger documentation uses `clientId` as the parameter name in this path. It is the same value as `projectId`. This documentation standardizes on `projectId`.

**Minimal request body:**

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "preferences": {
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false
    }
  }
}
```

For the full payload schema (including optional `googleConsentMode`, `preferences.config`, and `value` fields), see [Consent Model](../getting-started/consent-model.md).

**Response:**

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

**Response fields:**

| Field | Description |
|-------|-------------|
| `consentId`, `_id` | Same value; unique ID for this consent record |
| `projectId` | Your project ID |
| `createdAt` | ISO 8601 timestamp when the consent was recorded |
| `headers` | Metadata from the HTTP request: IP address, country, user agent |
| `accept` | The `accept` value you submitted |
| `collection` | The collection type used in the path |
| `identifier` | The `configId` used in the path |
| `token` | The user token (echoes what you sent) |
| `value` | The `value` field you submitted, or `null` if omitted |
| `preferences` | The full preferences object you submitted |

**Validation behavior**: The API requires `accept` (boolean), `token` (non-empty string), and `preferences.vendors` (object with at least one key). It does not validate vendor keys against your configured vendor list. See [Consent Model: API validation behavior](../getting-started/consent-model.md#api-validation-behavior).

**Responses:** `200` success, `400` validation error, `401` unauthorized, `500` server error

---

### Retrieve consent

```
GET /mobile/client/{projectId}/consents/{token}
```

Retrieves stored consent for a user token.

**Path parameters:**
- `projectId`: Your project identifier
- `token`: The user's consent token (from `GET /mobile/token`)

**Query parameters (both required):**
- `service`: The collection type (e.g. `cookies`). **Required.**
- `identifier`: The configuration identifier (`configId`). **Required.**

> **Important**: Both `service` and `identifier` are required. Without them, the endpoint will not return the expected consent data.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/client/YOUR_PROJECT_ID/consents/USER_TOKEN?service=cookies&identifier=YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Responses:** `200` consent data, `404` not found

---

### Submit analytics events

```
POST /mobile/analytics/evts
```

Submits analytics events for compliance reporting and consent interaction tracking.

**Required headers:**
- `Authorization: Bearer YOUR_API_TOKEN`
- `Content-Type: application/json`
- `X-Mobile-Platform: headless` (required for this endpoint)

**Constraints:**
- Accepts a JSON array of events
- Maximum 100 events per request
- Maximum 100KB payload size
- The `projectId` field in events is overridden server-side from your auth context (you cannot submit events for a different project)

**Event types:** `page_view`, `consent_displayed`, `consent_accepted`, `consent_rejected`, `consent_partial`, `settings_opened`, `category_toggled`, `app_att_authorized`, `app_att_denied`

---

### Health check

```
GET /mobile/health
```

Service health check. Does not require authentication.

---

### Batch consent (not implemented)

The Swagger documentation includes a `POST /mobile/consents/batch` endpoint. This endpoint is **not implemented**; it has no route handler in the gateway. Calling it returns `404 Not Found`.

To submit multiple consents, call the single-consent endpoint (`POST /mobile/consents/{projectId}/{collection}/{configId}`) multiple times, sequentially or in parallel.

---

## Error codes

| Code | Meaning | Action |
|------|---------|--------|
| `400` | Validation error | Fix request body; check error message for field details |
| `401` | Unauthorized | Check Bearer token; use `GET /mobile/auth/me` to validate |
| `404` | Not found | Verify projectId, token, and query parameters exist and are correct |
| `429` | Rate limited | Back off and retry after `Retry-After` seconds |
| `500` | Server error | Retry with exponential backoff; contact support if persistent |

---

## Endpoint summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mobile/auth/me` | Validate Bearer token, get project/tier info |
| `GET` | `/mobile/configurations/{projectId}` | Fetch project configurations and `defaultConfigId` |
| `GET` | `/mobile/vendors/{projectId}` | Fetch all vendors for a project |
| `GET` | `/mobile/vendors/{projectId}/categories` | Vendors grouped by category |
| `GET` | `/mobile/vendors/{projectId}/{configId}` | Vendors for a specific configuration |
| `GET` | `/mobile/token` | Generate a user consent token |
| `POST` | `/mobile/consents/{projectId}/{collection}/{configId}` | Submit a consent record |
| `GET` | `/mobile/client/{projectId}/consents/{token}` | Retrieve consent (requires `service` and `identifier` query params) |
| `POST` | `/mobile/analytics/evts` | Submit analytics events (requires `X-Mobile-Platform: headless` header) |
| `GET` | `/mobile/health` | Service health check |

---

## Related

- [Get your credentials](../getting-started/credentials.md)
- [Identifiers](../getting-started/identifiers.md)
- [Integration Lifecycle](../getting-started/integration-lifecycle.md)
- [Consent Model](../getting-started/consent-model.md)
- [Quick Start](../getting-started/quick-start.md)
- [React Native Guide](../platform-guides/react-native.md)