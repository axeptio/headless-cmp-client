# Statistics

Returns aggregated, read-only consent statistics for a project — page views, widget displays,
interactions, consent / partial / reject counts and the derived rates — over a date range, optionally
broken down by date, country, device or configuration. It is built for BI tools (Looker Studio,
Power BI, Tableau) rather than for your app's consent flow.

This endpoint is **not** under `/mobile`: the path is `/stats` on the same host.

---

## Fetch statistics

```
GET /stats
```

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`, where the token is one of:

| Token | `projectId` query parameter |
|-------|-----------------------------|
| Your headless project token (the one you use for `/mobile/*`) | Optional. The token already identifies the project. If you pass `projectId`, it must be that same project, otherwise the response is `403` — including for a malformed id |
| A Frontegg access token (JWT) — *per spec, not verified live* | **Required**, 24-char hex. A Frontegg token carries no project, so access to the named project is authorized on each request. Missing or malformed is a `400`; a project the identity may not read is a `403` |

The project token remains supported for now; the changelog marks Frontegg as the additive option for BI
connectors (see [API Changelog](changelog.md)).

**Query parameters (all optional):**

| Parameter | Description |
|-----------|-------------|
| `from`, `to` | `YYYY-MM-DD`, both inclusive. Give **both or neither**: a single bound is a `400`. With neither, the window is the last 30 days ending today. Each date must be a real calendar day (`2026-13-01` is rejected), `to` must be the same day as `from` or later, and the range may span at most 365 days |
| `groupBy` | Comma-separated dimensions from `date`, `country`, `device`, `configVersion`. Defaults to `date`. Any other value is a `400` |
| `projectId` | 24-char hex. See the token table above |

All dates are in **UTC**; the time zone cannot be changed and is echoed as `meta.timeZone`.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/stats" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response** (default window, trimmed to 1 of 29 `data` rows):

```json
{
  "success": true,
  "meta": {
    "filters": { "from": "2026-08-30", "to": "2026-09-28" },
    "groupBy": ["date"],
    "rows": 29,
    "timeZone": "UTC"
  },
  "summary": {
    "bounce": 653505,
    "bounceRate": 0.7163,
    "consent": 309784,
    "consentRate": 0.635,
    "couldInteract": 641548,
    "interaction": 489072,
    "interactionRate": 0.7623,
    "optInRate": 0.4841,
    "pageview": 13638263,
    "partial": 1148,
    "quickBounce": 230505,
    "quickBounceRate": 0.2527,
    "reject": 188818,
    "suspectedBots": 254831,
    "visitor": 912290,
    "widgetDisplay": 1315333,
    "responses": [
      { "label": "Consent", "value": 309784 },
      { "label": "Partial", "value": 1148 },
      { "label": "Reject", "value": 188818 }
    ]
  },
  "data": [
    {
      "bounce": 17569,
      "bounceRate": 0.7199,
      "consent": 5546,
      "consentRate": 0.6143,
      "couldInteract": 12881,
      "date": "2026-08-30",
      "interaction": 9053,
      "interactionRate": 0.7028,
      "optInRate": 0.4317,
      "pageview": 105306,
      "partial": 15,
      "quickBounce": 4677,
      "quickBounceRate": 0.1916,
      "reject": 3579,
      "suspectedBots": 7600,
      "visitor": 24404,
      "widgetDisplay": 20382,
      "responses": [
        { "label": "Consent", "value": 5546 },
        { "label": "Partial", "value": 15 },
        { "label": "Reject", "value": 3579 }
      ]
    }
  ],
  "status": 200
}
```

A breakdown by several dimensions returns one `data` row per combination, each carrying its
dimension keys (response trimmed to 1 of 345 rows, and to a few of that row's metrics):

```bash
curl "https://headless-api.axeptio.tech/stats?from=2026-08-01&to=2026-08-31&groupBy=country,device" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

```json
{
  "meta": {
    "filters": { "from": "2026-08-01", "to": "2026-08-31" },
    "groupBy": ["country", "device"],
    "rows": 345,
    "timeZone": "UTC"
  },
  "data": [
    {
      "country": "AD",
      "device": "desktop",
      "pageview": 223,
      "consent": 13,
      "reject": 6,
      "partial": 0,
      "consentRate": 0.6842
    }
  ]
}
```

With a Frontegg token (*per spec, not verified live*), add `?projectId={projectId}` to the same
request.

**Field notes:**

| Field | Description |
|-------|-------------|
| `meta.filters` | The `from`/`to` actually applied — useful when you relied on the default window. `projectId` is not echoed |
| `meta.groupBy` | The dimensions applied, in the order you gave them |
| `meta.rows` | Number of entries in `data` |
| `summary` | Totals over the whole period (no dimension keys) |
| `data[]` | One row per `groupBy` combination: the dimension keys (`date`, `country`, `device`, `configVersion`) plus the same metrics as `summary` |
| Counts | Integers: `pageview`, `visitor`, `couldInteract`, `widgetDisplay`, `interaction`, `consent`, `reject`, `partial`, `bounce`, `quickBounce`, `suspectedBots` |
| Rates | Ratios between 0 and 1, rounded to 4 decimals: `interactionRate`, `consentRate`, `optInRate`, `bounceRate`, `quickBounceRate` |
| `responses` | The `consent`, `partial` and `reject` counts pivoted into rows, always in the order `Consent`, `Partial`, `Reject`, so a BI tool has a dimension to chart. It adds no new data |

Ignore keys you do not recognise: new metrics may be added.

---

## Caching and latency

Successful responses carry:

```
Cache-Control: private, max-age=300
Vary: Authorization
X-Cache: MISS
```

Results are cached for 5 minutes per project, date range and `groupBy`. `X-Cache` is `HIT` when
the response came from that cache and `MISS` when it was computed. Passing `?projectId=` with your
own project hits the same cache entry as omitting it.

**Uncached queries are slow.** A cold `MISS` took 15 s for the default window and 9 s for a month
broken down by `country,device`; a `HIT` returned in under 0.2 s. Set your client timeout to **at
least 30 s** — a query the API cannot complete in time returns `504` rather than hanging.

`/stats` is rate limited like the `/mobile/*` endpoints and carries the `X-RateLimit-*` headers
described in [API Reference: Rate limits](overview.md#rate-limits). It never carries
`X-Api-Changelog` or the deprecation headers, which are specific to `/mobile/*` (see
[API Changelog](changelog.md#response-headers-on-mobile)).

---

## Errors

Every error body has the shape `{"error": "…", "message": "…", "timestamp": "…"}`.

| Code | `error` | `message` | When |
|------|---------|-----------|------|
| `400` | `bad_request` | `Provide both 'from' and 'to', or neither — a single bound is not allowed.` | Only one of `from`/`to` given |
| `400` | `bad_request` | `Invalid 'from' date: '2026-13-01'. Expected format YYYY-MM-DD.` | A date that is malformed or not a real day |
| `400` | `bad_request` | `'to' must be the same as or after 'from'.` | `to` earlier than `from` |
| `400` | `bad_request` | `Date range must not exceed 365 days.` | Range longer than 365 days |
| `400` | `bad_request` | `Invalid groupBy value: 'browser'. Allowed values: date, country, device, configVersion.` | Unknown `groupBy` value |
| `400` | `invalid_project_id` | `A valid projectId query parameter is required when authenticating with a Frontegg token` | *Per spec, not verified live.* Frontegg token without a valid `projectId` |
| `401` | `unauthorized` | `Valid bearer token required` | Missing or invalid token |
| `401` | `unauthorized` | `Bearer token was not accepted` | *Per spec, not verified live.* Frontegg token rejected |
| `403` | `forbidden` | `Access denied to this project's statistics` | `projectId` is not the project token's own project, or is malformed; or the Frontegg identity may not read it. Also returned for a project that does not exist, so the endpoint cannot be used to probe project ids |
| `405` | `method_not_allowed` | `Only GET method is allowed` | Any method other than `GET` (including `HEAD`). The response carries `Allow: GET` |
| `429` | `rate_limit_exceeded` | `Too many requests. Please try again later.` | *Per spec, not verified live.* Rate limit exceeded; wait `Retry-After` seconds |
| `500` | `internal_server_error` or `internal_error` | `Failed to retrieve stats`, or varies | *Not in the spec; not verified live.* Unexpected server or statistics-backend error. Retry with backoff |
| `502` | `bad_gateway` | varies | *Per spec, not verified live.* The statistics or authorization backend returned an error |
| `503` | `service_unavailable` | varies | *Per spec, not verified live.* A backend is not configured or temporarily unavailable |
| `504` | `gateway_timeout` | `Stats backend timed out` or `Authorization backend timed out` | *Per spec, not verified live.* The query, or the authorization check for a Frontegg token, did not complete in time. Retry with backoff |

Rows marked *not verified live* could not be reproduced against the live API; their status codes
come from the published spec and their message text from the API's implementation.

Checks run in this order: method, authentication, rate limit, then parameters. So a `400`
carries the `X-RateLimit-*` headers, while a `401` or `403` from authentication does not.

---

## Related

- [API Reference](overview.md)
- [API Changelog](changelog.md)
- [Get your credentials](../getting-started/credentials.md)
- [Identifiers](../getting-started/identifiers.md)
