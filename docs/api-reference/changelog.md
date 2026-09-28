# API Changelog

A machine-readable, curated list of API-behaviour changes: breaking changes, new features, fixes
and deprecations, one entry per endpoint change, newest first. It is aimed at SDK and integration
maintainers, and is distinct from the repository's commit-level changelog.

Every `/mobile/*` response points at it with an `X-Api-Changelog` header, and an endpoint scheduled
for removal will also announce it with `Deprecation` and `Sunset` headers.

---

## Fetch the changelog

```
GET /mobile/changelog
```

**Headers:** none required. The endpoint is public: it returns `200` and the same body with no
`Authorization` header, with a valid token, or with an invalid one.

**Query parameters:** none. Unknown parameters such as `?since=`, `?version=` or `?format=` are
ignored and the full changelog is returned. There is no filtering or pagination — filter on your
side.

**Caching:** `Cache-Control: public, max-age=300` (5 minutes). The route is not rate limited, so the
response carries no `X-RateLimit-*` headers.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/changelog"
```

**Response** (trimmed to 2 of 6 entries):

```json
{
  "entries": [
    {
      "id": "sup-1027-stats-frontegg-auth",
      "date": "2026-08-10",
      "version": "0.23.0",
      "endpoint": "/stats",
      "type": "feature",
      "summary": "`GET /stats` now also accepts a Frontegg access token, so BI/common-API consumers no longer need a headless SDK bearer token. A Frontegg-authenticated call must name its project with `?projectId=`, and access to it is authorized per request. Existing headless bearer tokens keep working unchanged.",
      "migration": "No action required today — this is additive and the headless bearer token remains supported for now. …"
    },
    {
      "id": "eng-12029-categories-scope",
      "date": "2026-07-07",
      "version": "0.18.0",
      "endpoint": "/mobile/vendors/{projectId}/categories",
      "type": "breaking",
      "summary": "The project-wide categories endpoint now returns a single selected configuration's purpose-step categories instead of the union across all configurations, and `name` is now a localized display label (previously a free-text category label).",
      "migration": "Use the new `category` field (canonical, language-independent slug) as the stable key and `title` for the display label. The flat vendor list `GET /mobile/vendors/{projectId}` still returns the full union across configurations. Pass `?lang=` to select a language."
    }
  ]
}
```

**Entry fields:**

| Field | Description |
|-------|-------------|
| `id` | Stable identifier for the entry. Use it to tell which entries you have already seen |
| `date` | `YYYY-MM-DD`. Entries are sorted by this field, newest first |
| `version` | API version that shipped the change |
| `endpoint` | Full public path the change applies to, e.g. `/mobile/vendors/{projectId}/categories`. A `{param}` segment stands for exactly one path segment; `"*"` means every `/mobile/` path |
| `type` | `breaking`, `feature`, `fix` or `deprecation` |
| `summary` | What changed |
| `migration` | Optional. What you need to do, if anything |
| `sunset` | Optional, `deprecation` entries only. ISO date after which the endpoint may be removed |

Today's changelog has 6 entries (5 `feature`, 1 `breaking`), no `deprecation` entries and no
`sunset` field.

**Responses:** `200` changelog, `405` method not allowed

---

## Response headers on `/mobile/*`

### `X-Api-Changelog`

Every response from a `/mobile/*` path carries

```
X-Api-Changelog: /mobile/changelog
```

including error responses (`401`, `405`) and CORS preflight `204`s. It is a pointer, not a version
marker: its value is always the same. It is not sent on paths outside `/mobile/` — `GET /stats`,
for instance, never carries it.

### `Deprecation`, `Sunset` and `Link`

> **Per spec, not verified live.** No endpoint is deprecated today, so no response currently carries
> these headers.

When a changelog entry has `type: "deprecation"` **and** a `sunset` date, every `/mobile/*` response
whose path matches that entry's `endpoint` carries:

```
Deprecation: true
Sunset: <the sunset date at 00:00:00 GMT, in HTTP-date format>
Link: </mobile/changelog>; rel="sunset"
```

`Deprecation` and `Sunset` follow RFC 8594. They are only emitted for `deprecation` entries that
have a `sunset` date: a `breaking` entry never triggers them, and neither does a `deprecation`
entry without one. They are only added to `/mobile/*` responses, never to other routes such as
`/stats` or `/public/*`.

---

## Recommended client policy

1. **Watch the changelog.** Poll `GET /mobile/changelog` from CI or a scheduled job (daily is
   plenty; the response is cached for 5 minutes anyway). Store the `id`s you have seen and review
   each new entry, starting with `breaking` and `deprecation` ones and those whose `endpoint`
   matches a path you call.
2. **Alert on deprecation headers.** In your HTTP layer, log or report any response that carries a
   `Deprecation` or `Sunset` header, with the request path and the `Sunset` date. Do not change
   behaviour on it at runtime — treat it as a signal to schedule a migration before the sunset date.
3. **Don't parse `X-Api-Changelog` for versioning.** It always points at `/mobile/changelog`; read
   the changelog itself for what changed.

---

## Errors

| Code | When | Body |
|------|------|------|
| `405` | Any method other than `GET`, **including `HEAD`**. The response carries `Allow: GET` | `{"error":"method_not_allowed","message":"Only GET method is allowed","timestamp":"…"}` |

A `HEAD` request gets the `405` status and headers with no body, so do not use `HEAD` to check
whether the changelog has changed — issue a `GET`.

---

## Related

- [API Reference](overview.md)
- [Statistics](stats.md)
- [Authentication](../getting-started/authentication.md)
