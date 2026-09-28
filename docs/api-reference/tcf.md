# IAB TCF

The `/mobile/tcf/*` endpoints serve everything a native IAB TCF v2.x consent UI needs: the Global
Vendor List (GVL), a per-configuration projection of it, the first-layer notice, UI labels, and a
TC string encoder/decoder. The resulting TC string is then stored with the usual
[consent submission](overview.md#submit-consent).

Use this flow when a configuration has `flowType: "tcf"` — see
[`GET /mobile/configurations/{projectId}`](overview.md#fetch-project-configuration) or
[Geolocation](geolocation.md). Configurations with `flowType: "brands"` use the standard vendor flow
instead.

Every endpoint on this page requires `Authorization: Bearer YOUR_API_TOKEN`.

---

## Which endpoint when

| Step | Endpoint | Use it to |
|------|----------|-----------|
| 1 | [`GET /mobile/tcf/gvl/status`](#gvl-status) | Find the latest GVL version and which versions are cached |
| 2 | [`GET /mobile/tcf/configurations/{projectId}/{configId}`](#configuration-projection) | Get the GVL purposes, features, stacks and your configured vendors, localised |
| 3 | [`GET /mobile/tcf/standard-info/{projectId}/{configId}`](#standard-information) | Build the first-layer notice: intro text, button labels, one card per section |
| 4 | [`GET /mobile/tcf/texts`](#ui-texts) | Get the UI label strings for your locale |
| 5 | [`POST /mobile/tcf/encode`](#encode-a-tc-string) | Turn the user's choices into a TC string |
| 6 | [`POST /mobile/consents/{projectId}/cookies/{configId}`](#submit-a-tcf-consent) | Store the consent with `preferences.tcString` |
| 7 | [`GET /mobile/client/{projectId}/consents/{token}`](#read-a-tcf-consent-back) | Read it back, with the TC string already decoded |

[`GET /mobile/tcf/decode`](#decode-a-tc-string) parses any TC string on demand, and the
[raw GVL endpoints](#global-vendor-list) serve the IAB list itself — around 1 MB per version, so
prefer the configuration projection for UI work.

---

## Caching

No TCF endpoint returns an `ETag` or `Last-Modified` header.

| Endpoint | `Cache-Control` | `X-Cache` |
|----------|-----------------|-----------|
| `GET /mobile/tcf/gvl/status` | `no-store` | not sent |
| `GET /mobile/tcf/configurations/…` | `public, max-age=300` | `MISS`, then `HIT` on a repeat call |
| `GET /mobile/tcf/standard-info/…` | `public, max-age=300` | `MISS` |
| `GET /mobile/tcf/texts` | `public, max-age=300` | `MISS`, then `HIT` on a repeat call |
| `GET /mobile/tcf/gvl/latest`, `/gvl/{version}`, `/gvl/latest/lang/{lang}` | `public, max-age=300` | not sent |
| `GET /mobile/tcf/decode` | `public, max-age=300` | not sent |
| `POST /mobile/tcf/encode` | not sent | not sent |
| `POST /mobile/consents/…`, `GET /mobile/client/…/consents/…` | not sent | not sent |

`gvl/status` is never cached, so poll it to detect a new GVL version; everything else can be held
for five minutes.

---

## GVL status

```
GET /mobile/tcf/gvl/status
```

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/gvl/status" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response:**

```json
{
  "ok": true,
  "latest": {
    "version": 178,
    "fetchedAt": "2026-09-25T06:00:03.599Z",
    "etag": "W/\"ea88c2cc1c402669b97a5acd9a105efc\"",
    "lastModified": "Fri, 25 Sep 2026 05:00:50 GMT"
  },
  "cachedVersions": [159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178],
  "count": 20
}
```

**Field notes:**

| Field | Description |
|-------|-------------|
| `latest.version` | The current IAB `vendorListVersion` — pass it to [encode](#encode-a-tc-string) |
| `cachedVersions` | The only GVL versions the API can serve or encode against |
| `latest.etag`, `latest.lastModified` | Upstream IAB metadata; not HTTP caching headers on this response |

**Responses:** `200` status, `401` unauthorized

---

## Configuration projection

```
GET /mobile/tcf/configurations/{projectId}/{configId}
```

The GVL, localised and narrowed to the vendors your configuration declares.

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Path parameters:**
- `projectId`: Your project identifier (24-char hex)
- `configId`: The configuration identifier (24-char hex)

**Query parameters:**
- `lang` (optional): `lang` or `lang-region` (`fr`, `fr-CA`). Defaults to `en`. Localises the GVL labels.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/configurations/YOUR_PROJECT_ID/YOUR_CONFIG_ID?lang=en" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response** (trimmed: 1 of 11 purposes shown, other GVL sections replaced by their counts in the
note below, long strings shortened):

```json
{
  "projectId": "67fcdb2b52ab9a99a5865f4d",
  "configId": "6859079473219bcbb8435079",
  "lang": "en",
  "welcomingScreen": {
    "title": "les Cookies !",
    "subtitle": null,
    "description": "On a attendu d'être sûrs que le contenu de ce site vous intéresse…",
    "picture": null
  },
  "gvlSpecificationVersion": 3,
  "vendorListVersion": 178,
  "tcfPolicyVersion": 5,
  "gvlLastUpdated": "2026-09-24T16:00:19Z",
  "purposes": {
    "1": {
      "id": 1,
      "name": "Store and/or access information on a device",
      "description": "Cookies, device or similar online identifiers…",
      "illustrations": ["Most purposes explained in this notice rely on the storage or accessing of information…"]
    }
  },
  "stacks": {},
  "vendors": [],
  "publisherRestrictions": [],
  "builtAt": "2026-09-28T15:59:22.528Z"
}
```

The full response also carries `specialPurposes` (3), `features` (3) and `specialFeatures` (2),
each keyed by id like `purposes` (11). With `lang=fr` the GVL labels come back in French.
`welcomingScreen` is the configuration's own text and is not translated by `lang`.

This sample comes from a `brands` configuration, which still returns `200` with the GVL sections
populated but `vendors`, `stacks` and `publisherRestrictions` empty. Only vendors with an IAB id
are projected.

> **Per spec, not verified live.** On a `tcf` configuration:
> - each `vendors[]` entry is `{ id, name, purposes, legIntPurposes, flexiblePurposes, specialPurposes, features, specialFeatures, policyUrl, axeptio }` — `id` is the IAB vendor id, the arrays are GVL ids, `axeptio` is Axeptio metadata or `null`;
> - `stacks` holds the stacks you configured, keyed by stack id;
> - each `publisherRestrictions[]` entry is `{ purposeId, restrictionType, vendorIds }`, where `restrictionType` is `0` not allowed, `1` require consent, `2` require legitimate interest.

**Responses:** `200` projection, `400` invalid `lang`, `401` unauthorized, `403` project not
accessible with this token, `404` configuration not found

---

## Standard information

```
GET /mobile/tcf/standard-info/{projectId}/{configId}
```

The first-layer notice, with its dynamic values already computed.

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Path parameters:** same as [Configuration projection](#configuration-projection).

**Query parameters:**
- `lang` (optional): `lang` or `lang-region`. Defaults to `en`.
- `context` (optional): `app` (default) or `web`. Picks the wording — "On this application" vs. "On this website".

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/standard-info/YOUR_PROJECT_ID/YOUR_CONFIG_ID?lang=en&context=app" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response** (trimmed: 2 of 19 cards shown, descriptions shortened):

```json
{
  "lang": "en",
  "gvlVersion": 178,
  "variables": {
    "vendorCount": 0,
    "refuseOrWithdrawButtonText": "No thanks",
    "chooseButtonText": "Let me choose",
    "onThisAppOrWebsite": "On this application",
    "ourAppOrWebsite": "our application",
    "manageCookiesText": "the \"Manage cookies\" button in your application preferences settings"
  },
  "introduction": {
    "raw": null,
    "html": null
  },
  "cards": [
    {
      "id": "purpose-1",
      "type": "purpose",
      "title": "Store and/or access information on a device",
      "description": "Cookies, device or similar online identifiers…",
      "vendorCount": 0
    },
    {
      "id": "special-purpose-1",
      "type": "specialPurpose",
      "title": "Ensure security, prevent and detect fraud, and fix errors",
      "description": "Your data can be used to monitor for and prevent unusual and possibly fraudulent activity…",
      "vendorCount": 0
    }
  ]
}
```

Without stacks, `cards` lists every GVL section in order: 11 `purpose`, 3 `specialPurpose`,
3 `feature` and 2 `specialFeature` cards. With `lang=fr&context=web`, `variables` switches to
website wording (`"onThisAppOrWebsite": "Sur ce site web"`). Use `variables` as given rather than
recomputing them.

This sample comes from a `brands` configuration, so `vendorCount` is `0` and `introduction` is null.

> **Per spec, not verified live.** On a `tcf` configuration, `introduction.raw` is the publisher's
> notice HTML with placeholders intact (e.g. `[VENDOR_COUNT]`) and `introduction.html` the same
> text with them filled in. When stacks are configured, `cards` starts with purpose 1 followed by
> one `stack` card per stack (`id` like `stack-7`).

**Responses:** `200` notice, `400` invalid `lang` or `context`, `401` unauthorized, `404`
configuration not found

---

## UI texts

```
GET /mobile/tcf/texts
```

UI label strings plus the GVL reference texts for a locale. Not tied to a project.

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Query parameters:**
- `lang` (optional): `lang`, `lang-region` or `lang-region-subdivision` (`fr`, `fr-CA`, `fr-CA-GC`). Defaults to `en`.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/texts?lang=en" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response** (trimmed: 2 of 66 `ui` keys and 1 of 11 purposes shown):

```json
{
  "lang": "en",
  "gvlVersion": 178,
  "texts": {
    "ui": {
      "acceptAllButton": "Accept all & continue",
      "legitimateInterestAllowedSwitch{0}": "Legitimate interest for {0} allowed"
    },
    "purposes": {
      "1": {
        "id": 1,
        "name": "Store and/or access information on a device",
        "description": "Cookies, device or similar online identifiers…"
      }
    }
  }
}
```

`texts` also carries `specialPurposes` (3), `features` (3), `specialFeatures` (2), `stacks` (45)
and `dataCategories` (11), each keyed by id as `{ id, name, description }`. Placeholders such as
`{0}` in `ui` keys and values are left for you to fill in. The `ui` key set varies by locale
(66 for `en`, 70 for `fr`).

The spec also describes a `uiFallback: "en"` field for locales without a UI pack. It was not
observed live — even `lang=xx` returned `200` without it.

**Responses:** `200` texts, `400` invalid `lang`, `401` unauthorized

---

## Encode a TC string

```
POST /mobile/tcf/encode
```

Builds a TC string from the user's choices. The request mirrors the [decode](#decode-a-tc-string)
output.

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`, `Content-Type: application/json`

**Request body:**

| Field | Required | Description |
|-------|----------|-------------|
| `cmpId` | Yes | Your registered IAB CMP id. `1` is rejected (`400 bad_format`); the spec reserves `0` as well |
| `cmpVersion` | Yes | Your CMP version. Use `1` or higher — see the note below |
| `vendorListVersion` | Yes | A version from `cachedVersions` in [GVL status](#gvl-status) |
| `consentLanguage` | No | Two-letter language (defaults to `EN`) |
| `publisherCC` | No | Two-letter publisher country code (defaults to `AA`) |
| `purposes` | No | `{ consents: [ids], legitimateInterests: [ids] }` |
| `vendors` | No | `{ consents: [IAB vendor ids], legitimateInterests: [IAB vendor ids] }` |
| `specialFeatures` | No | Opted-in special feature ids |
| `publisher` | No | `{ consents, legitimateInterests, customConsents, customLegitimateInterests }` for the publisher segment |

**Example** (`cmpId: 260` is an example value, not a real registration — use your own):

```bash
curl -X POST "https://headless-api.axeptio.tech/mobile/tcf/encode" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cmpId": 260,
    "cmpVersion": 1,
    "vendorListVersion": 178,
    "consentLanguage": "EN",
    "publisherCC": "FR",
    "purposes": { "consents": [1, 2, 3], "legitimateInterests": [2, 7] },
    "vendors": { "consents": [1, 755], "legitimateInterests": [755] },
    "specialFeatures": [1]
  }'
```

**Response:**

```json
{
  "tcString": "CQrQMwAQrQMwAEEABAENCyFoAOAAAEIAAAqIF5wAgAAgLzAvOACAvMAA.IAAA.YAAAAAAAAAAA"
}
```

Encoding is lenient where storage is not:

- vendor ids that are not in the GVL are dropped silently, still with `200`;
- `cmpVersion: 0` encodes fine, but the consent endpoint then rejects that string with
  `400 invalid_cmp`.

**Responses:** `200` encoded, `400` invalid body (see [Errors](#errors)), `401` unauthorized,
`405` for any method other than `POST`

---

## Decode a TC string

```
GET /mobile/tcf/decode?tc={tcString}
```

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Query parameters:**
- `tc` (required): A TCF v2.x TC string, including any `.`-separated segments.

**Example** (decoding the string from the encode example above):

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/decode?tc=CQrQMwAQrQMwAEEABAENCyFoAOAAAEIAAAqIF5wAgAAgLzAvOACAvMAA.IAAA.YAAAAAAAAAAA" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response:**

```json
{
  "cmpId": 260,
  "cmpVersion": 1,
  "vendorListVersion": 178,
  "tcfPolicyVersion": 5,
  "publisherCC": "FR",
  "consentLanguage": "EN",
  "created": "2026-09-28T00:00:00.000Z",
  "lastUpdated": "2026-09-28T00:00:00.000Z",
  "purposes": { "consents": [1, 2, 3], "legitimateInterests": [2, 7] },
  "vendors": { "consents": [1, 755], "legitimateInterests": [755] },
  "specialFeatures": [1],
  "specialPurposes": [],
  "publisher": {
    "consents": [],
    "legitimateInterests": [],
    "customConsents": [],
    "customLegitimateInterests": []
  }
}
```

The string round-trips: every field sent to encode comes back unchanged. `created` and
`lastUpdated` are set by the encoder and only carry the day.

The Swagger example value for `tc` (`COtybn4OtybnEAAABAENAA`) is not a valid string and returns
`400 bad_format`. TCF v1 strings return `400 unsupported_version`.

**Responses:** `200` decoded, `400` missing or invalid `tc`, `401` unauthorized, `405` for any
method other than `GET`

---

## Global Vendor List

```
GET /mobile/tcf/gvl/latest
GET /mobile/tcf/gvl/{version}
GET /mobile/tcf/gvl/latest/lang/{lang}
GET /mobile/tcf/gvl/{version}/lang/{lang}
```

The IAB GVL as published. You only need these if you render from the raw list rather than the
[configuration projection](#configuration-projection).

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Path parameters:**
- `version`: A GVL `vendorListVersion`. **Only versions listed in `cachedVersions` from [GVL status](#gvl-status) can be served.**
- `lang`: `lang` or `lang-region`, case-insensitive (`fr` and `FR` both work).

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/tcf/gvl/latest" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

`/gvl/latest` and `/gvl/{version}` return the full list, about 977 KB for version 178:
`gvlSpecificationVersion` (3), `vendorListVersion` (178), `tcfPolicyVersion` (5), `lastUpdated`,
`purposes` (11), `specialPurposes` (3), `features` (3), `specialFeatures` (2), `standardTexts` (1),
`stacks` (45), `dataCategories` (11) and `vendors` (1,562, of which 190 carry a `deletedDate`).
One vendor entry, with `urls` trimmed to 1 of its 23 languages:

```json
{
  "id": 755,
  "name": "Google Advertising Products",
  "purposes": [1, 3, 4],
  "legIntPurposes": [2, 7, 9, 10],
  "flexiblePurposes": [2, 7, 9, 10],
  "specialPurposes": [1, 2, 3],
  "features": [1, 2, 3],
  "specialFeatures": [],
  "cookieMaxAgeSeconds": 34190000,
  "usesCookies": true,
  "cookieRefresh": false,
  "urls": [
    {
      "langId": "en",
      "privacy": "https://business.safety.google/privacy/",
      "legIntClaim": "https://policies.google.com/privacy#europeanrequirements"
    }
  ],
  "usesNonCookieAccess": true,
  "dataRetention": {
    "stdRetention": 548,
    "purposes": { "3": 180, "4": 180 },
    "specialPurposes": { "1": 1096 }
  },
  "dataDeclaration": [1, 2, 3, 4, 5, 6, 7, 8, 10, 11],
  "deviceStorageDisclosureUrl": "https://www.gstatic.com/iabtcf/deviceStorageDisclosure.json"
}
```

`/gvl/latest/lang/{lang}` returns the translations only (about 49 KB for `fr`), with no vendors
(trimmed: 1 of 11 purposes shown, strings shortened):

```json
{
  "vendorListVersion": 178,
  "lastUpdated": "2026-09-24T16:00:25Z",
  "purposes": {
    "1": {
      "id": 1,
      "name": "Stocker et/ou accéder à des informations sur un appareil",
      "description": "Les cookies, appareils ou identifiants en ligne similaires…",
      "illustrations": ["La plupart des finalités expliquées dans le présent avis…"]
    }
  },
  "standardTexts": {
    "features": "Ces méthodes de traitement ne peuvent être utilisées que dans le cadre d’une ou plusieurs finalités…"
  }
}
```

It also carries `specialPurposes` (3), `features` (3), `specialFeatures` (2), `stacks` (45) and
`dataCategories` (11). The `en` translation has no `standardTexts`.

**Uncached versions and unsupported languages return `502`, not `404`.** The spec says a version
or language the API does not hold returns `404 not_found`; live, `/gvl/150`, `/gvl/9999` and
`/gvl/latest/lang/xx` all return:

```json
{
  "error": "fetch_failed",
  "message": "GVL fetch failed",
  "timestamp": "2026-09-28T16:01:21.088Z"
}
```

Treat that as "not available" rather than a transient failure worth retrying, and check
[GVL status](#gvl-status) before asking for a specific version. Version-specific translations were
not available either: `/gvl/177/lang/fr` returned `404 not_found` ("GVL translation not cached for
this version+language") although version 177 is cached. Use `/gvl/latest/lang/{lang}`.

**Responses:** `200` GVL, `400` version not a positive integer, `401` unauthorized, `404`
translation not cached or malformed path, `502` version or language not held

---

## Submit a TCF consent

The TC string is stored through the normal
[consent submission](overview.md#submit-consent) endpoint:

```
POST /mobile/consents/{projectId}/cookies/{configId}
```

The TCF fields go in `preferences`:

| Field | Description |
|-------|-------------|
| `tcString` | The TC string from [encode](#encode-a-tc-string). Its presence switches on TCF validation |
| `cmpVersion` | Your CMP version, `1` or higher |
| `gdprApplies` | Boolean — whether GDPR applies to this user |
| `version` | Number, stored as sent |
| `consentFor` | String, stored as sent |

`accept` and `token` are required as for any consent.

**Example** (staging; the TC string is the one encoded above):

```bash
curl -X POST "https://staging-api.axeptio.tech/mobile/consents/YOUR_PROJECT_ID/cookies/YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accept": true,
    "token": "tcfcapad6be0e3cf8ec291",
    "preferences": {
      "tcString": "CQrQMwAQrQMwAEEABAENCyFoAOAAAEIAAAqIF5wAgAAgLzAvOACAvMAA.IAAA.YAAAAAAAAAAA",
      "cmpVersion": 1,
      "gdprApplies": true,
      "version": 1,
      "consentFor": "tcf-capture",
      "vendors": {}
    }
  }'
```

**Response** (`headers` trimmed to 3 keys; client IPs redacted):

```json
{
  "consentId": "01a0e8c2-32fb-77e2-a0fa-f66967b93b0c",
  "_id": "01a0e8c2-32fb-77e2-a0fa-f66967b93b0c",
  "projectId": "67fcdb2b52ab9a99a5865f4d",
  "createdAt": "2026-09-28T16:03:56.283Z",
  "headers": {
    "cf-ipcountry": "FR",
    "user-agent": "curl/8.7.1",
    "x-forwarded-for": "<redacted>"
  },
  "accept": true,
  "collection": "cookies",
  "identifier": "6859079473219bcbb8435079",
  "token": "tcfcapad6be0e3cf8ec291",
  "value": null,
  "preferences": {
    "tcString": "CQrQMwAQrQMwAEEABAENCyFoAOAAAEIAAAqIF5wAgAAgLzAvOACAvMAA.IAAA.YAAAAAAAAAAA",
    "cmpVersion": 1,
    "gdprApplies": true,
    "version": 1,
    "consentFor": "tcf-capture",
    "vendors": {}
  }
}
```

TCF submissions return JSON errors, with a `details` array on schema failures:

```json
{
  "error": "invalid_argument",
  "message": "Invalid TCF consent payload",
  "timestamp": "2026-09-28T16:04:30.656Z",
  "details": [
    {
      "field": "preferences.gdprApplies",
      "message": "must be boolean",
      "constraint": "type",
      "expectedType": "boolean",
      "receivedValue": "yes",
      "receivedType": "string"
    }
  ]
}
```

---

## Read a TCF consent back

```
GET /mobile/client/{projectId}/consents/{token}?service=cookies&identifier={configId}
```

```bash
curl "https://staging-api.axeptio.tech/mobile/client/YOUR_PROJECT_ID/consents/USER_TOKEN?service=cookies&identifier=YOUR_CONFIG_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

The stored record comes back with a top-level `decoded` block, identical to the
[decode](#decode-a-tc-string) output for the stored `tcString` (trimmed: `headers` omitted):

```json
{
  "accept": true,
  "timestamp": "2026-09-28T16:03:56.283Z",
  "_id": "01a0e8c2-32fb-77e2-a0fa-f66967b93b0c",
  "projectId": "67fcdb2b52ab9a99a5865f4d",
  "token": "tcfcapad6be0e3cf8ec291",
  "collection": "cookies",
  "identifier": "6859079473219bcbb8435079",
  "createdAt": "2026-09-28T16:03:56.283Z",
  "value": null,
  "preferences": {
    "vendors": {},
    "version": 1,
    "tcString": "CQrQMwAQrQMwAEEABAENCyFoAOAAAEIAAAqIF5wAgAAgLzAvOACAvMAA.IAAA.YAAAAAAAAAAA",
    "cmpVersion": 1,
    "consentFor": "tcf-capture",
    "gdprApplies": true
  },
  "decoded": {
    "cmpId": 260,
    "cmpVersion": 1,
    "vendorListVersion": 178,
    "tcfPolicyVersion": 5,
    "publisherCC": "FR",
    "consentLanguage": "EN",
    "created": "2026-09-28T00:00:00.000Z",
    "lastUpdated": "2026-09-28T00:00:00.000Z",
    "purposes": { "consents": [1, 2, 3], "legitimateInterests": [2, 7] },
    "vendors": { "consents": [1, 755], "legitimateInterests": [755] },
    "specialFeatures": [1],
    "specialPurposes": [],
    "publisher": {
      "consents": [],
      "legitimateInterests": [],
      "customConsents": [],
      "customLegitimateInterests": []
    }
  }
}
```

A token with no stored consent returns `200` with `{"accept": false}`.

---

## Errors

Every TCF endpoint returns errors as JSON:

```json
{
  "error": "unauthorized",
  "message": "Valid bearer token required",
  "timestamp": "2026-09-28T16:00:14.923Z"
}
```

| Endpoint | Case | Status | `error` | `message` |
|----------|------|--------|---------|-----------|
| Any | No Bearer token | `401` | `unauthorized` | Valid bearer token required |
| configurations | `projectId` not accessible with this token | `403` | `forbidden` | Access denied to this project |
| configurations, standard-info | Unknown `configId` | `404` | `not_found` | Configuration not found for this project |
| configurations | `configId` not 24-char hex | `404` | `not_found` | The requested endpoint was not found |
| configurations | Invalid `lang` | `400` | `invalid_argument` | Invalid lang query parameter — expected BCP47 lang or lang-region |
| standard-info | `context` not `app`/`web` | `400` | `invalid_argument` | Invalid context query parameter — expected 'app' or 'web' |
| texts | Invalid `lang` | `400` | `invalid_argument` | Invalid lang query parameter — expected BCP47 lang, lang-region, or lang-region-subdivision |
| gvl | `version` is `0` | `400` | `invalid_argument` | Invalid GVL version (expected positive integer) |
| gvl | `version` not numeric, or bare `/gvl` | `404` | `not_found` | The requested endpoint was not found |
| gvl | Version not cached, or language not supported | `502` | `fetch_failed` | GVL fetch failed |
| gvl | `/gvl/{version}/lang/{lang}` | `404` | `not_found` | GVL translation not cached for this version+language |
| encode | `vendorListVersion` missing | `400` | `invalid_argument` | vendorListVersion is required and must be a positive integer |
| encode | `vendorListVersion` not cached | `400` | `unknown_gvl_version` | No cached GVL for the requested vendorListVersion |
| encode | `cmpId: 1` | `400` | `bad_format` | Unable to encode the provided TCF model |
| encode | Body not valid JSON | `400` | `bad_format` | Request body must be valid JSON |
| encode | Not `POST` | `405` | `method_not_allowed` | Only POST method is allowed |
| decode | `tc` missing | `400` | `invalid_argument` | Missing required query parameter: tc |
| decode, consent POST | Not a valid TC string | `400` | `bad_format` | Invalid TCF consent string |
| decode | TCF v1 string | `400` | `unsupported_version` | TCF v1 is not supported |
| decode | Not `GET` | `405` | `method_not_allowed` | Only GET method is allowed |
| consent POST | TC string with `cmpVersion` `0` | `400` | `invalid_cmp` | TC string has unregistered cmpId or cmpVersion |
| consent POST | TCF field of the wrong type | `400` | `invalid_argument` | Invalid TCF consent payload (plus `details`) |

---

## Related

- [API Reference](overview.md)
- [Consent Model: IAB TCF consents](../getting-started/consent-model.md#iab-tcf-consents)
- [Geolocation](geolocation.md)
- [Identifiers](../getting-started/identifiers.md)
