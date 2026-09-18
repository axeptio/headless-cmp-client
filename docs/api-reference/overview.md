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

> **The published spec is not always right.** Where the OpenAPI document and the live API disagree,
> this page follows the live API. Two known spec errors: `GET /mobile/auth/me` is documented as
> returning `valid` (it returns `authorized`), and `GET /mobile/health` is documented without a
> security scheme (it requires a Bearer token).

---

## Base URLs

| Environment | Base URL | When to use |
|-------------|----------|-------------|
| Production | `https://headless-api.axeptio.tech` | Live apps, real consent data |
| Staging | `https://staging-api.axeptio.tech` | Testing, development, experiments |

The base URL is the host only. Paths on this page are shown in full, including their prefix — most carry `/mobile`, while `/public/geolocation/{projectId}` and `/api/health` do not. Do not append `/mobile` to the base URL.

> **Warning**: You may encounter `https://api.axept.io/v1` in older examples or external guides. This is the wrong URL for the headless API. Always use the URLs above.

---

## Authentication

Almost every endpoint requires a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

The only routes that do **not** require authentication are the documentation routes
(`/mobile/docs`, `/mobile/swagger.json`), `GET /mobile/changelog`,
[`GET /public/geolocation/{projectId}`](geolocation.md#public-unauthenticated-geolocation), and
`GET /api/health`. `GET /mobile/health` **does** require a token, despite what the spec says.

See [Get your credentials](../getting-started/credentials.md) for how to obtain and validate your token.

---

## Rate limits

Rate limits are applied per project, based on your tier. When you exceed them, the API returns `429 Too Many Requests` with a `Retry-After` header. Implement exponential backoff in your client.

Every `/mobile/*` response carries the current budget:

| Header | Meaning |
|--------|---------|
| `X-RateLimit-Limit` | Requests allowed per minute for your tier |
| `X-RateLimit-Remaining` | Requests left in the current window |
| `X-RateLimit-Reset` | When the window resets |
| `Retry-After` | On `429` only: seconds to wait before retrying |

`GET /public/geolocation/{projectId}` is not rate limited.

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

> **Note**: The field is `authorized`, not `valid`. The published OpenAPI spec says `valid`; that is a spec bug, verified against the live API.

**Responses:** `200` valid, `401` unauthorized, `405` method not allowed (only `GET` is supported)

---

### Fetch project configuration

```
GET /mobile/configurations/{projectId}
```

Returns the configurations in your project (language, region, flow type, Google Consent Mode settings), identifies the default one, and carries project-level branding and native-screen copy.

**Path parameters:**
- `projectId`: Your project identifier (24-char hex). See [Identifiers](../getting-started/identifiers.md#projectid).

**Query parameters (all optional):**
- `lang`: Two-letter language code for the localized `screens` copy. Falls back to English silently.
- `platform`: `ios`, `android`, … — returns a platform-optimized payload.
- `version`: Your app version, for feature-flag support.

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "primaryColor": "#013974",
  "isDomainRestrictionEnabled": false,
  "verifiedDomains": [],
  "configurations": [
    {
      "identifier": "67fcddc2673e895f81feb6c3",
      "name": "fr-eu-14-04-2025",
      "language": "fr",
      "country": "FR",
      "title": "My Cookie Banner",
      "flowType": "brands",
      "googleConsentMode": {
        "display": false,
        "displayIllustrations": false,
        "position": "second",
        "adsDataRedaction": false,
        "urlPassthrough": false
      },
      "policyUrl": null,
      "cookieStatementUrl": null,
      "isDefault": false
    }
  ],
  "defaultConfigId": "6859079473219bcbb8435079",
  "screens": {
    "att": {
      "background": ["#E9CBFF", "#FFCCCD"],
      "media": null,
      "title": "Your Tracking Choice, Your Control",
      "description": "A pop-in will ask whether you'd like to allow or decline tracking…"
    },
    "permissions": {
      "background": ["#FFF8CC", "#CCF6FF"],
      "media": null,
      "title": "Unlock all features of the app",
      "description": "Allow the app to use various features on your device…"
    }
  }
}
```

**Field notes:**

| Field | Description |
|-------|-------------|
| `primaryColor` | Project brand colour, for native UIs |
| `isDomainRestrictionEnabled`, `verifiedDomains` | Web domain allow-listing; not applicable to native apps |
| `configurations[].identifier` | The `configId`. A 24-char hex ObjectId, **not** a human-readable slug |
| `configurations[].flowType` | `brands` (standard Axeptio flow) or `tcf` (IAB TCF flow) |
| `configurations[].googleConsentMode` | Back-office Google Consent Mode display settings for this configuration |
| `configurations[].policyUrl`, `cookieStatementUrl` | Links to show in your UI; may be `null` |
| `defaultConfigId` | The configuration to use when you have no better signal |
| `screens.att`, `screens.permissions` | Ready-made copy and gradient for native ATT / permissions pre-prompts |

Use the `defaultConfigId` value as the `configId` in consent submission and retrieval endpoints. See [Identifiers: configId](../getting-started/identifiers.md#configid). To pick a configuration from the user's location instead, see [Geolocation](geolocation.md).

---

### Fetch vendors

```
GET /mobile/vendors/{projectId}
```

Returns all vendors configured for your project, with categories and image URLs.

**Path parameters:**
- `projectId`: Your project identifier

**Query parameters:**
- `lang` (optional): Language for the localized vendor texts.

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "vendors": [
    {
      "id": "674475bd56e4d7163746ace3",
      "iabId": null,
      "name": "google_firebase_analytics",
      "title": "Google Firebase Analytics",
      "description": "Google Analytics is an app measurement solution…",
      "longDescription": "Analytics reports help you understand user behaviour…",
      "category": "Analytics",
      "categories": ["Analytics"],
      "type": "analytics",
      "domain": "https://firebase.google.com/docs/analytics",
      "policyUrl": "https://policies.google.com/privacy",
      "isAxeptioVendor": true,
      "image": {
        "identifier": "google_firebase_analytics",
        "baseUrl": "https://favicons.axept.io/favicons?domain=firebase.google.com",
        "optimized": {
          "small": "…",
          "medium": "…",
          "large": "…"
        },
        "fallbackUrl": "…"
      }
    }
  ],
  "totalVendors": 25,
  "categories": ["Analytics", "CRM", "Functional", "Marketing", "Advertising"],
  "fetchedAt": "2025-06-01T12:00:00.000Z"
}
```

**Field notes:**

| Field | Description |
|-------|-------------|
| `id` | 24-char hex ObjectId. **Not** the key to use in `preferences.vendors` |
| `name` | The vendor slug (e.g. `googletagmanager`). **This is the key to use in `preferences.vendors`** — see [Consent Model](../getting-started/consent-model.md#preferencesvendors) |
| `iabId` | IAB TCF vendor ID, or `null` for non-IAB vendors |
| `title` | Display name for your UI |
| `description`, `longDescription` | Short and long copy, localized |
| `category`, `categories` | Comma-joined string and array form of the vendor's categories |
| `type` | Machine-readable category slugs (e.g. `functional, tag_management`) |
| `domain`, `policyUrl` | Vendor website and privacy policy |
| `isAxeptioVendor` | `true` for vendors from the Axeptio catalogue |
| `image` | Logo URLs: `optimized.small` / `.medium` / `.large`, with `fallbackUrl` |

**Related endpoints:**

```
GET /mobile/vendors/{projectId}/{configId}
```

Vendors for a specific configuration. Same vendor shape, plus `configId` and `configName` at the top level.

```
GET /mobile/vendors/{projectId}/categories
GET /mobile/vendors/{projectId}/{configId}/categories
```

Vendors grouped into the consent UI's purpose steps, with the copy needed to render them.

> **Breaking change (2026-07-07).** `GET /mobile/vendors/{projectId}/categories` used to return the
> union of categories across every configuration. It now returns the purpose-step categories of a
> **single** selected configuration (the default one), and `name` is a localized display label
> rather than a free-text value.

**Query parameters:** `lang` (optional) on both. The selector is best-effort: an unavailable
language silently falls back to the configuration's own language, and never returns a `400`.

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "configId": "6859079473219bcbb8435079",
  "configName": "mchffr-app",
  "welcomingScreen": {
    "title": "It's your call on cookies!",
    "subtitle": "Over to you",
    "description": "A few cookies join the game to smooth your browsing…",
    "picture": "https://axeptio.imgix.net/…"
  },
  "categories": [
    {
      "category": "analytics",
      "name": "Analytics",
      "title": "Measuring our audience",
      "subtitle": null,
      "description": "These cookies let us count visits…",
      "image": null,
      "vendors": [],
      "count": 7
    }
  ],
  "totalCategories": 5,
  "totalVendors": 14,
  "fetchedAt": "2025-06-01T12:00:00.000Z"
}
```

`categories[].category` is the canonical slug (`info`, `analytics`, `social_networks`, `crm`, `targeted_ads`, …); `categories[].vendors` holds the full vendor objects in that step.

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

**Responses:** `200` success, `401` unauthorized, `405` method not allowed (only `GET` is supported)

---

### Submit consent

```
POST /mobile/consents/{projectId}/{collection}/{configId}
```

Records a user's consent choices.

**Path parameters:**
- `projectId`: Your project identifier (24-char hex)
- `collection`: Consent type: `cookies`, `processings`, `contractsV2`, or its public alias `terms`. See [Consent Model: Collection types](../getting-started/consent-model.md#collection-types).
- `configId`: Configuration identifier from `GET /mobile/configurations/{projectId}`. See [Identifiers: configId](../getting-started/identifiers.md#configid).

> **Naming note**: The Swagger documentation uses `clientId` as the parameter name in this path. It is the same value as `projectId`. This documentation standardizes on `projectId`.

**Minimal request body:**

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

The keys in `preferences.vendors` are vendor **`name` slugs** from `GET /mobile/vendors/{projectId}` — not the 24-hex `id`. The API accepts any string, but only the `name` slug is understood by the rest of the platform.

**Limits:** request body must be **100 KB or smaller** (`413` above that) and `token` must be 255 characters or fewer.

For the full payload schema (including `googleConsentMode`, `preferences.config`, `headers`, `timestamp`, and `value`), see [Consent Model](../getting-started/consent-model.md).

**Response:**

```json
{
  "consentId": "01a0b37b-3621-7913-bd50-7a37b56816e7",
  "_id": "01a0b37b-3621-7913-bd50-7a37b56816e7",
  "projectId": "507f1f77bcf86cd799439011",
  "createdAt": "2025-06-01T12:05:00.000Z",
  "headers": {
    "ip": "203.0.113.45",
    "country": "GB",
    "userAgent": "..."
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
    }
  }
}
```

**Response fields:**

| Field | Description |
|-------|-------------|
| `consentId`, `_id` | Same value; the unique ID for this consent record (a UUID). The **read** endpoint returns `_id` only |
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

**Responses:** `200` success, `400` validation error, `401` unauthorized, `413` body too large, `500` server error, `503` upstream unavailable

> A `400` from the legacy validation path is returned as `text/plain`. TCF submissions (bodies carrying `preferences.tcString`) return a JSON error body instead.

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
- `service`: The collection type (e.g. `cookies`; `terms` is the alias for `contractsV2`). **Required.**
- `identifier`: The configuration identifier (`configId`). **Required.**

> **Important**: Both `service` and `identifier` are required. Omitting either returns `400 missing_parameter`.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/client/YOUR_PROJECT_ID/consents/USER_TOKEN?service=cookies&identifier=YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

The response carries `accept`, `timestamp`, `_id`, `projectId`, `token`, `collection`, `identifier`, `createdAt`, `headers`, `value` and `preferences`. Note there is **no `consentId`** on the read path — use `_id`. For TCF consents the response also includes a `decoded` object with the parsed TC string.

**Responses:** `200` consent data, `400` missing/invalid parameters, `404` not found, `500` server error

---

### Submit analytics events

```
POST /mobile/analytics/evts
```

Submits analytics events for compliance reporting and consent interaction tracking.

**Required headers:**
- `Authorization: Bearer YOUR_API_TOKEN`
- `Content-Type: application/json`
- `X-Mobile-Platform: headless` (selects the strict headless event schema below)

**Constraints:**
- Accepts a JSON array of events, or a single event object
- Maximum 100 events per request
- Maximum 100KB payload size
- `POST` only — any other method returns `405`
- The `projectId` field in events is overridden server-side from your auth context (you cannot submit events for a different project)

**Headless event schema** (applies when you send `X-Mobile-Platform: headless` — every field is required):

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `page_view`, `consent_displayed`, `consent_accepted`, `consent_rejected`, `consent_partial`, `settings_opened`, `category_toggled`, `app_att_authorized`, `app_att_denied` |
| `timestamp` | string | ISO 8601 |
| `token` | string | The user's consent token, 10–100 characters |
| `domain` | string | Your app's identifier (bundle ID or host) |
| `config` | object | `{ "identifier": "<configId>", "name": …, "language": …, "consentMode": …, "displayMode": … }` — `identifier` is required |
| `preferences` | object | `{ "enabled": ["vendor_slug"], "disabled": ["vendor_slug"] }` |
| `userAgent` | string | |
| `pathname` | string | |
| `referrer` | string \| null | |

```json
[
  {
    "type": "consent_accepted",
    "timestamp": "2025-06-01T12:05:00.000Z",
    "token": "flfvv6d974b9jxwd",
    "domain": "com.example.myapp",
    "config": { "identifier": "6859079473219bcbb8435079" },
    "preferences": { "enabled": ["googletagmanager"], "disabled": ["google_firebase_analytics"] },
    "userAgent": "MyApp/2.1.0 (iOS 17.0; iPhone)",
    "pathname": "/checkout",
    "referrer": null
  }
]
```

**Response:** `{ "success": true, "processed": 1, "timestamp": "…", "batchId": "…", "errors": [] }`. Rejected events are reported per index in `errors[]`.

Without the `X-Mobile-Platform: headless` header a looser schema applies, which also accepts `widget_opened`, `widget_closed`, `vendor_toggled`, `privacy_policy_clicked`, `pagehide` and `pagevisible` event types with a `metadata` object.

---

### Health check

```
GET /mobile/health
```

Service health check. **Requires a Bearer token** (the published spec omits this). Returns `status`, `environment`, `timestamp` and a large block of internal database and lock diagnostics that is not part of the public contract — read `status` only.

For an unauthenticated liveness probe, use `GET /api/health` instead:

```json
{ "status": "healthy", "environment": "production", "timestamp": "…", "version": "1.0.0", "worker": "api-gateway" }
```

---

### Batch consent (not implemented)

The Swagger documentation includes a `POST /mobile/consents/batch` endpoint. This endpoint is **not implemented**; it has no route handler in the gateway. Calling it returns `404 Not Found`.

To submit multiple consents, call the single-consent endpoint (`POST /mobile/consents/{projectId}/{collection}/{configId}`) multiple times, sequentially or in parallel.

---

## Error codes

| Code | Meaning | Action |
|------|---------|--------|
| `400` | Validation error, or a missing required query parameter | Fix request body or query string; check error message for field details |
| `401` | Unauthorized | Check Bearer token; use `GET /mobile/auth/me` to validate |
| `403` | Forbidden — token is valid but not allowed for this project or resource | Confirm the token belongs to the project you are calling |
| `404` | Not found | Verify projectId, token, and query parameters exist and are correct |
| `405` | Method not allowed | Check the verb; several endpoints accept `GET` only, and analytics accepts `POST` only |
| `413` | Payload too large | Keep request bodies at or under 100 KB |
| `429` | Rate limited | Back off and retry after `Retry-After` seconds |
| `500` | Server error | Retry with exponential backoff; contact support if persistent |
| `503` | Upstream unavailable | Retry with exponential backoff |

---

## Endpoint summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mobile/auth/me` | Validate Bearer token, get project/tier info |
| `GET` | `/mobile/configurations/{projectId}` | Fetch project configurations, `defaultConfigId` and native screens |
| `GET` | `/mobile/vendors/{projectId}` | Fetch all vendors for a project |
| `GET` | `/mobile/vendors/{projectId}/categories` | Purpose-step categories of the default configuration |
| `GET` | `/mobile/vendors/{projectId}/{configId}` | Vendors for a specific configuration |
| `GET` | `/mobile/vendors/{projectId}/{configId}/categories` | Purpose-step categories for a specific configuration |
| `GET` | `/mobile/token` | Generate a user consent token |
| `POST` | `/mobile/consents/{projectId}/{collection}/{configId}` | Submit a consent record |
| `GET` | `/mobile/client/{projectId}/consents/{token}` | Retrieve consent (requires `service` and `identifier` query params) |
| `GET` | `/mobile/geolocation/{projectId}` | Resolve country, regulation and the applicable configuration — see [Geolocation](geolocation.md) |
| `GET` | `/public/geolocation/{projectId}` | Same resolution, unauthenticated — see [Geolocation](geolocation.md) |
| `GET` | `/mobile/terms/{projectId}/{configId}` | Terms & Conditions content — see [Terms & Conditions](terms.md) |
| `GET` | `/mobile/terms/{projectId}/{configId}/pdf` | Terms & Conditions PDF — see [Terms & Conditions](terms.md) |
| `POST` | `/mobile/analytics/evts` | Submit analytics events (requires `X-Mobile-Platform: headless` header) |
| `GET` | `/mobile/health` | Service health check (Bearer required) |

### Not covered here yet

The API also exposes an IAB TCF suite (`/mobile/tcf/decode`, `/mobile/tcf/encode`, `/mobile/tcf/configurations/…`, `/mobile/tcf/standard-info/…`, `/mobile/tcf/texts`, `/mobile/tcf/gvl/…`), project statistics (`GET /stats`) and a machine-readable API changelog (`GET /mobile/changelog`). Use the [Swagger UI](https://headless-api.axeptio.tech/mobile/docs) for those until they are documented here.

---

## Related

- [Get your credentials](../getting-started/credentials.md)
- [Identifiers](../getting-started/identifiers.md)
- [Integration Lifecycle](../getting-started/integration-lifecycle.md)
- [Consent Model](../getting-started/consent-model.md)
- [Geolocation](geolocation.md)
- [Terms & Conditions](terms.md)
- [Quick Start](../getting-started/quick-start.md)
- [React Native Guide](../platform-guides/react-native.md)
