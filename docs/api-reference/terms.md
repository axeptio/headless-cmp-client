# Terms & Conditions

Fetches the published Terms & Conditions for a configuration, either as structured content you
render natively or as a PDF you display or let the user download. Pair it with a consent
submission to the `terms` collection to record that the user accepted them.

---

## Fetch terms content

```
GET /mobile/terms/{projectId}/{configId}
```

**Headers:** `Authorization: Bearer YOUR_API_TOKEN`

**Path parameters:**
- `projectId`: Your project identifier (24-char hex)
- `configId`: The configuration identifier

**Query parameters:**
- `tag` (optional): The published version to fetch. Defaults to `latest`.

**Example:**

```bash
curl "https://headless-api.axeptio.tech/mobile/terms/YOUR_PROJECT_ID/YOUR_CONFIG_ID?tag=latest" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Response:**

```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "identifier": "6859079473219bcbb8435079",
  "language": "en",
  "tag": "latest",
  "versionName": "2025-06 terms",
  "publishedAt": "2025-06-01T12:00:00.000Z",
  "pdfUrl": "https://…/terms.pdf",
  "content": {
    "strings": {},
    "sections": [
      { "id": "intro", "title": "Introduction", "body": "…" }
    ]
  }
}
```

**Field notes:**

| Field | Description |
|-------|-------------|
| `identifier` | The `configId` these terms belong to |
| `language` | Language of the published content |
| `tag` | The version tag that was served (echoes your `?tag=`, or `latest`) |
| `versionName` | Human-readable version label from the back-office |
| `publishedAt` | When this version was published |
| `pdfUrl` | Source PDF, if one was published. May be an empty string |
| `content.strings` | Key/value UI labels; `{}` when none are published |
| `content.sections` | Ordered sections, each `{ id, title, body }`; `[]` when none are published |

**Responses:** `200` content, `401` unauthorized, `404` not found, `502` upstream unavailable

A configuration with no published terms returns `404`:

```json
{
  "error": "not_found",
  "message": "No published terms for this configuration",
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

---

## Download the terms PDF

```
GET /mobile/terms/{projectId}/{configId}/pdf
```

Same parameters, including the optional `?tag=`. Returns the PDF itself
(`Content-Type: application/pdf`, served inline as `terms-<configId>-<tag>.pdf`), not JSON.

Returns `404 no PDF available for these terms` when the published version has no PDF attached, so
check for it rather than assuming the download will succeed.

---

## Recording acceptance

Terms acceptance is a consent record like any other — submit it to the `terms` collection:

```
POST /mobile/consents/{projectId}/terms/{configId}
```

`terms` is the public alias for the internal `contractsV2` collection; both route to the same
place, and `terms` is the name to use in new integrations. The same alias applies when reading the
record back:

```
GET /mobile/client/{projectId}/consents/{token}?service=terms&identifier={configId}
```

See [Consent Model: Collection types](../getting-started/consent-model.md#collection-types) for the
payload, and [API Reference](overview.md#submit-consent) for the submission contract.

---

## Related

- [API Reference](overview.md)
- [Consent Model](../getting-started/consent-model.md)
- [Identifiers](../getting-started/identifiers.md)
