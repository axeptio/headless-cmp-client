# Axeptio Headless CMP — Mobile Integration

Official client documentation and React Native example for the [Axeptio Headless Consent Management Platform](https://www.axeptio.eu).

Axeptio Headless CMP lets you build your own consent UI on top of a privacy-compliant backend — collect, store, and retrieve GDPR/CCPA consent without being locked into a widget.

---

## API Reference (Swagger)

| Environment | Swagger UI | OpenAPI JSON |
|-------------|-----------|--------------|
| Production | https://headless-api.axeptio.tech/mobile/docs | https://headless-api.axeptio.tech/mobile/swagger.json |
| Staging | https://staging-api.axeptio.tech/mobile/docs | https://staging-api.axeptio.tech/mobile/swagger.json |

Widget API spec: https://staging-api.axeptio.tech/mobile/swagger/widget.json

---

## Endpoint Catalog

All endpoints require `Authorization: Bearer YOUR_API_TOKEN`.
Base URL: `https://headless-api.axeptio.tech`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/mobile/consents/{clientId}/{collection}/{configId}` | Submit a consent record |
| `GET` | `/mobile/client/{projectId}/consents/{token}` | Retrieve consent status for a user token |
| `GET` | `/mobile/configurations/{projectId}` | Mobile-optimized project configuration |
| `GET` | `/mobile/token` | Generate a secure consent token |
| `GET` | `/mobile/auth/me` | Validate bearer token + get project/tier info |
| `GET` | `/mobile/vendors/{projectId}` | All vendors for a project |
| `GET` | `/mobile/vendors/{projectId}/categories` | Vendors grouped by category |
| `GET` | `/mobile/vendors/{projectId}/{configId}` | Config-specific vendor list |
| `POST` | `/mobile/analytics/evts` | Submit analytics events (single or batch) |
| `GET` | `/mobile/health` | Service health + circuit breaker status |

Collections for consent submission: `cookies` · `processings` · `contracts` · `contractsV2`

---

## Quick Start

```bash
cd examples/react-native
npm install
npm start
```

### Minimal integration (React Native)

```javascript
const PROJECT_ID = 'your_project_id';
const API_TOKEN  = 'your_api_token';
const BASE_URL   = 'https://headless-api.axeptio.tech';

// 1. Get a consent token
const { token } = await fetch(`${BASE_URL}/mobile/token`, {
  headers: { Authorization: `Bearer ${API_TOKEN}` }
}).then(r => r.json());

// 2. Fetch configuration to get configId
const { defaultConfigId } = await fetch(`${BASE_URL}/mobile/configurations/${PROJECT_ID}`, {
  headers: { Authorization: `Bearer ${API_TOKEN}` }
}).then(r => r.json());

// 3. Submit consent
await fetch(`${BASE_URL}/mobile/consents/${PROJECT_ID}/cookies/${defaultConfigId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'x-mobile-platform': 'react-native',
  },
  body: JSON.stringify({
    accept: true,
    token,
    preferences: { vendors: { google_analytics: true, facebook_pixel: false } },
  }),
});

// 4. Read consent back
const consent = await fetch(
  `${BASE_URL}/mobile/client/${PROJECT_ID}/consents/${token}?identifier=${defaultConfigId}&service=cookies`,
  { headers: { Authorization: `Bearer ${API_TOKEN}` } }
).then(r => r.json());
```

---

## Documentation

| Section | Description |
|---------|-------------|
| [Quick Start](./docs/getting-started/quick-start.md) | 5-minute setup guide |
| [Authentication](./docs/getting-started/authentication.md) | Bearer tokens, secure storage, error handling |
| [API Reference](./docs/api-reference/overview.md) | Full endpoint catalog, rate limits, error codes |
| [React Native Guide](./docs/platform-guides/react-native.md) | `useConsent` hook, offline queue, Google Consent Mode |
| [Mobile Integration Reference](./docs/platform-guides/mobile-integration-reference.md) | Comprehensive multi-platform reference (iOS, Android, RN) |

---

## Example App

[`examples/react-native/`](./examples/react-native/) — A minimal Expo demo with a custom consent modal, vendor toggles, and direct API integration. No SDK required.

---

## License

MIT — see [LICENSE](./LICENSE).
