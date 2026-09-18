# Geolocation

Resolves the visitor's country, the privacy regulation that applies to them, and the configuration
you should use — in one call, before you fetch vendors or show any consent UI.

Use it when your app serves more than one region and you cannot rely on `defaultConfigId` from
[`GET /mobile/configurations/{projectId}`](overview.md#fetch-project-configuration).

There are two variants: an authenticated one for your app, and an unauthenticated one for contexts
that cannot hold a credential.

---

## Authenticated geolocation

```
GET /mobile/geolocation/{projectId}
```

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Path parameters:**
- `projectId`: Your project identifier (24-char hex)

**Query parameters (all optional):**

| Parameter | Description |
|-----------|-------------|
| `language` | ISO 639-1 preference, used to break ties between configurations |
| `platform` | Preferred platform flavour of the resolved configuration; falls back to any available one |
| `country` | **Non-production only.** Override the detected country (`FR`, `US`, `GB`, …). Ignored in production |
| `region` | **Non-production only.** Override the detected subdivision (`QC`, …). Ignored in production |

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/geolocation/YOUR_PROJECT_ID?language=fr" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response:**

```json
{
  "geolocation": {
    "countryCode": "FR",
    "subdivisionCode": "IDF",
    "source": "cloudflare"
  },
  "regulation": {
    "code": "gdpr",
    "internalIsoCode": "EU",
    "isDefault": false
  },
  "resolvedConfig": {
    "configId": "67fcddc2673e895f81feb6c3",
    "matchMode": "regulation",
    "language": "fr",
    "platform": null,
    "isFallback": false,
    "platformNarrowed": false
  },
  "next": {
    "vendorsEndpoint": "/mobile/vendors/67fcdb2b52ab9a99a5865f4d/67fcddc2673e895f81feb6c3"
  },
  "availableRegulations": ["gdpr", "uk_gdpr", "fadp", "ccpa", "gpp", "lgpd", "loi25"]
}
```

**Field notes:**

| Field | Description |
|-------|-------------|
| `geolocation.source` | `cloudflare` (edge-detected), `override` (you passed `country`/`region` in a non-production environment), or `none` |
| `regulation.code` | The applicable regulation; one of `availableRegulations` |
| `regulation.isDefault` | `true` when no regulation matched and the project default was used |
| `resolvedConfig.configId` | The `configId` to use for vendors and for the consent submission |
| `resolvedConfig.matchMode` | How it was chosen: `country-exact`, `subdivision`, `regulation`, or `fallback` |
| `resolvedConfig.isFallback` | `true` when nothing matched and a catch-all configuration was used |
| `next.vendorsEndpoint` | Ready-made path for the next call — follow it rather than building it yourself |

**Responses:** `200` resolved, `401` unauthorized, `403` forbidden, `404` project or configuration not found, `405` method not allowed, `409` conflicting configuration, `429` rate limited, `502`/`503`/`504` upstream failure

---

## Public (unauthenticated) geolocation

```
GET /public/geolocation/{projectId}
GET /public/geolocation/{projectId}.js
```

The same resolution with **no `Authorization` header** and **no rate limiting**, for contexts that
cannot hold a credential — a Google Tag Manager template, a landing page, a pre-login screen. The
`.js` form returns an `application/javascript` settings snippet for the Axeptio GTM template:

```js
window.axeptioSettings = window.axeptioSettings || {};
window.axeptioSettings.cookiesVersion = "67fcddc2673e895f81feb6c3";
window.axeptioSettings.flowType = "brands";
```

Note the different, flatter shape: `flowType` and `configId` are at the top level, and there is no
`next` block.

**Query parameters (all optional):** `language`, `platform` (`mobile` | `web`, default `web`),
`country`, `region`.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/public/geolocation/YOUR_PROJECT_ID"
```

**Response:**

```json
{
  "flowType": "brands",
  "configId": "67fcddc2673e895f81feb6c3",
  "matchMode": "regulation",
  "isFallback": false,
  "language": "fr",
  "geolocation": {
    "countryCode": "FR",
    "subdivisionCode": "IDF",
    "source": "cloudflare"
  },
  "regulation": {
    "code": "gdpr",
    "internalIsoCode": "EU",
    "isDefault": false
  }
}
```

`flowType` tells you which consent experience to build: `brands` for the standard Axeptio flow,
`tcf` for the IAB TCF flow.

---

## Where this fits in the flow

Geolocation is an optional step 0, replacing "use `defaultConfigId`":

1. `GET /mobile/geolocation/{projectId}` → `resolvedConfig.configId`
2. Follow `next.vendorsEndpoint` → the vendor list for that configuration
3. `GET /mobile/token` → a user token
4. `POST /mobile/consents/{projectId}/cookies/{configId}` with the resolved `configId`

See [Integration Lifecycle](../getting-started/integration-lifecycle.md) for the full sequence.

---

## Related

- [API Reference](overview.md)
- [Identifiers](../getting-started/identifiers.md)
- [Integration Lifecycle](../getting-started/integration-lifecycle.md)
