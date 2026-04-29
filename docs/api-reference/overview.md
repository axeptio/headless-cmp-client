# API Reference

Complete reference for the Axeptio Headless CMP mobile API.

Interactive documentation (Swagger UI):
- **Production**: https://headless-api.axeptio.tech/mobile/docs
- **Staging**: https://staging-api.axeptio.tech/mobile/docs

Raw OpenAPI specs:
- Production JSON: https://headless-api.axeptio.tech/mobile/swagger.json
- Staging JSON: https://staging-api.axeptio.tech/mobile/swagger.json
- Widget API: https://staging-api.axeptio.tech/mobile/swagger/widget.json

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://headless-api.axeptio.tech` |
| Staging | `https://staging-api.axeptio.tech` |

---

## Authentication

All endpoints require a Bearer token:

```
Authorization: Bearer YOUR_API_TOKEN
```

Obtain your token from the [Axeptio Dashboard](https://dashboard.axept.io) → **Project Settings → API Access**.

Validate your token and check the associated project/tier:

```bash
curl https://headless-api.axeptio.tech/mobile/auth/me \
  -H "Authorization: Bearer YOUR_API_TOKEN"
# → { "valid": true, "projectId": "...", "tier": "enterprise" }
```

See [Authentication Guide](../getting-started/authentication.md) for secure storage, error handling, and lifecycle management.

---

## Rate Limits

| Tier | Requests / minute |
|------|-------------------|
| Free | 100 |
| Pro | 1 000 |
| Enterprise | 10 000 |

On limit breach the API returns `429 Too Many Requests` with a `Retry-After` header. Use exponential backoff.

---

## Mobile-Specific Request Headers

Include these headers for platform-aware responses and analytics:

| Header | Description | Example |
|--------|-------------|---------|
| `x-mobile-platform` | Platform identifier | `react-native` |
| `x-mobile-version` | OS version | `17.0` |
| `x-app-version` | App version | `2.1.0` |
| `x-device-id` | Stable device UUID | `uuid-device-123` |
| `x-session-id` | Session identifier | `session-789` |

---

## Endpoints

### Consent Ingestion

#### `POST /mobile/consents/{clientId}/{collection}/{configId}`

Submit a consent record.

**Path parameters:**
- `clientId` — Project/Client identifier (24-char hex, e.g. `507f1f77bcf86cd799439011`)
- `collection` — Consent type: `cookies` · `processings` · `contracts` · `contractsV2`
- `configId` — Configuration identifier (max 255 chars)

**Request body:**

```json
{
  "accept": true,
  "token": "rn_user_11111",
  "preferences": {
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false
    },
    "config": {
      "mobileContext": {
        "platform": "react-native",
        "offline": false
      }
    },
    "googleConsentMode": {
      "version": 2,
      "analytics_storage": "granted",
      "ad_storage": "denied"
    }
  },
  "headers": {
    "x-mobile-platform": "react-native",
    "x-app-version": "1.5.2"
  }
}
```

**Responses:** `200` success · `400` validation error · `500` server error

---

#### `POST /mobile/consents/batch`

Submit multiple consent records in one request (designed for offline sync scenarios).

---

### Consent Reading

#### `GET /mobile/client/{projectId}/consents/{token}`

Retrieve stored consent for a user token.

**Path parameters:**
- `projectId` — Project identifier
- `token` — User consent token

**Query parameters:**
- `service` — Filter by service/collection (optional)
- `identifier` — Filter by identifier (optional)

**Responses:** `200` consent data · `404` not found

---

### Mobile SDK

#### `GET /mobile/token`

Generate a cryptographically secure random token for consent identification.

```bash
curl https://headless-api.axeptio.tech/mobile/token \
  -H "Authorization: Bearer YOUR_API_TOKEN"
# → { "token": "abc123def456ghi789" }
```

---

#### `GET /mobile/auth/me`

Validate bearer token and return project/tier information.

```json
{ "valid": true, "projectId": "67fcdb2b52ab9a99a5865f4d", "tier": "enterprise" }
```

---

#### `GET /mobile/configurations/{projectId}`

Mobile-optimized project configuration with minimal payload.

**Query parameters:**
- `platform` — `ios` · `android` · `react-native` · `flutter` (optional, for optimized responses)
- `version` — App version for feature flag support (optional)

**Response includes:** consent categories, vendor list, UI settings, legal URLs.

---

#### `GET /mobile/vendors/{projectId}`

All vendors for a project with imgix-optimized images for mobile screen densities.

**Response includes:** vendor metadata, categories, imgix image URLs (small/medium/large).

---

#### `GET /mobile/vendors/{projectId}/categories`

Vendors grouped by category.

---

#### `GET /mobile/vendors/{projectId}/{configId}`

Vendors for a specific configuration.

---

#### `POST /mobile/analytics/evts`

Submit analytics events — accepts a single event or an array.

---

### Health

#### `GET /mobile/health`

Service health check with circuit breaker status.

```json
{
  "status": "healthy",
  "circuitBreaker": "enabled",
  "timestamp": "2025-09-03T10:30:00Z"
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `400` | Validation error | Fix request body (check error message for field details) |
| `401` | Unauthorized | Check Bearer token — use `GET /mobile/auth/me` to validate |
| `404` | Not found | Verify project ID / token exist |
| `429` | Rate limited | Back off and retry after `Retry-After` seconds |
| `500` | Server error | Retry with exponential backoff; contact support if persistent |

---

## Related

- [Quick Start](../getting-started/quick-start.md)
- [Authentication Guide](../getting-started/authentication.md)
- [React Native Guide](../platform-guides/react-native.md)
- [Mobile Integration Reference](../platform-guides/mobile-integration-reference.md)
