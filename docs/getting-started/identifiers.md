# Identifiers

The headless API uses several identifiers across its endpoints. This page explains what each one is, where it comes from, and where you'll need it. Think of it as a passport control sheet: each endpoint asks for specific IDs, and this page tells you which ones and how to get them.

## Overview

| Identifier | What it is | Format | Where it comes from |
|------------|-----------|--------|-------------------|
| `projectId` | Your project's unique ID | 24-char hex (e.g. `507f1f77bcf86cd799439011`) | Available when you create a new project in the admin panel (no subscription required) |
| `configId` | A configuration within your project | String identifier (e.g. `my-config-en`) | From `defaultConfigId` in the `GET /mobile/configurations/{projectId}` response |
| User token | Identifies a user's consent record | 16-char lowercase alphanumeric (e.g. `flfvv6d974b9jxwd`) | Generated via `GET /mobile/token` |
| Bearer token (API token) | Authenticates your API requests | Long string, passed in the `Authorization` header | Requested from support (see [Credentials](./credentials.md)) |

## projectId

Your project's unique identifier. You need this before requesting an API token.

To get your projectId:

1. Create an account at [admin.axeptio.eu](https://admin.axeptio.eu/) (no subscription required for this step)
2. Create a new project in the Admin panel
   - If you just created the project, you'll be redirected to the project configuration page
   - If you already have a project created, select it from the panel
3. Find your projectId on the project configuration page:
   - In the URL: `https://admin.axeptio.eu/projects/69e28f08e8c9b136a93672ee/services` (the 24-char hex after `/projects/`)
   - In the **Integration** tab: click it and copy the Project ID field
4. With your projectId, open a support ticket to request your API token. Click **Support** in the admin panel (requires being logged in with cookies allowed), which redirects to [support.axeptio.eu](https://support.axeptio.eu/en/) where you can use the chat to make your request

For internal Axeptio projects, contact the engineering team instead.

Every endpoint that targets a specific project requires this value in the URL path:

```
GET  /mobile/configurations/{projectId}
GET  /mobile/vendors/{projectId}
POST /mobile/consents/{projectId}/cookies/{configId}
GET  /mobile/client/{projectId}/consents/{token}
```

> **Naming note**: The Swagger documentation and some endpoint paths use `clientId` as a parameter name. This is the same value as `projectId`. The codebase uses both names interchangeably, but this documentation standardizes on `projectId`.

## configId

A configuration identifier within your project. Projects can have multiple configurations (e.g. different languages or regions). Each configuration has its own `identifier` string.

To get the default configuration ID, call the configurations endpoint:

```bash
curl https://headless-api.axeptio.tech/mobile/configurations/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Response:

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

Use the `defaultConfigId` value (or the `identifier` of a specific configuration) as the `configId` in the consent submission path:

```
POST /mobile/consents/{projectId}/cookies/{configId}
```

You can also include it in the optional `preferences.config` object when submitting consent, and it is required as a query parameter when reading consent back:

```
GET /mobile/client/{projectId}/consents/{token}?identifier={configId}&service=cookies
```

## User token (consent token)

A 16-character lowercase alphanumeric string that identifies a specific user's consent record. Generated server-side using `crypto.getRandomValues()` (base36 encoding).

To generate one:

```bash
curl https://headless-api.axeptio.tech/mobile/token \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Response:

```json
{
  "token": "flfvv6d974b9jxwd",
  "projectId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

Important characteristics:

- Tokens do not expire. There is no TTL or cleanup mechanism.
- Generate one token per user (or per device), then store and reuse it for all future consent submissions from that user.
- Store it in the device's secure storage alongside the API token.
- This is NOT the same as the Bearer token. The user token goes in the request body and URL path; the Bearer token goes in the `Authorization` header.

## Bearer token (API token)

The authentication token for all API requests. See [Credentials](./credentials.md) for how to obtain and validate it.

Quick distinction: the Bearer token authenticates *your app* to the API. The user token identifies *a specific user's* consent. Every request needs the Bearer token. Only consent-related requests need a user token.

## Which endpoint needs which identifiers

| Endpoint | `projectId` | `configId` | User token | Bearer token |
|----------|:-----------:|:----------:|:----------:|:------------:|
| `GET /mobile/auth/me` | | | | Required |
| `GET /mobile/configurations/{projectId}` | In path | | | Required |
| `GET /mobile/vendors/{projectId}` | In path | | | Required |
| `GET /mobile/token` | | | | Required |
| `POST /mobile/consents/{projectId}/cookies/{configId}` | In path | In path | In body | Required |
| `GET /mobile/client/{projectId}/consents/{token}` | In path | Query param (`identifier`) | In path | Required |
| `POST /mobile/analytics/evts` | | | | Required |

> **Note on reading consent**: The `identifier` and `service` query parameters on `GET /mobile/client/{projectId}/consents/{token}` are both required. Without them, the endpoint will not return the expected consent data.

## Next steps

Now that you know what each identifier is and where to find it, see the full integration flow that ties them together: [Integration Lifecycle](./integration-lifecycle.md).

---

**Related**: [Credentials](./credentials.md) | [Integration Lifecycle](./integration-lifecycle.md) | [Consent Model](./consent-model.md) | [API Reference](../api-reference/overview.md)
