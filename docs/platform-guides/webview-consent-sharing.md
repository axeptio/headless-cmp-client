# Sharing Consent with a WebView or Custom Tab

Your app collects consent natively through the Headless CMP API, then opens a web page — a checkout, an account area, a partner flow — inside a **Chrome Custom Tab**, an `SFSafariViewController`, or an embedded WebView. That web page runs the Axeptio **web widget** (`client.axept.io`). Without help, the widget has no idea the user already consented in your app, so it prompts again.

This guide shows how to share the user's consent into that web context so the widget recognizes the existing consent and stays hidden.

---

## How it works

The web widget accepts a consent identity through a single URL query parameter: **`axeptio_token`**. When the page loads with `?axeptio_token=<token>`, the widget:

1. Reads the token from the URL.
2. Looks up the matching consent in Axeptio's consent store, keyed by **project, token, `cookies` service, and config identifier** (`GET https://api.axept.io/v1/app/consent/{projectId}?token=<token>&service=cookies&identifier=<configId>`).
3. If a consent record exists for that token, it **stays hidden**. If not, it shows the banner.

The Headless CMP API writes consent to that **same store**, keyed by `projectId + token + service (collection) + identifier (configId)`. So the two contexts line up as long as you use the **same token value** in both:

- the native consent submission (`POST /mobile/consents/{projectId}/cookies/{configId}`, with `token` in the body), and
- the web URL (`?axeptio_token=<same token>`).

No cookies, JavaScript injection, or SDK is required on the web side — the widget resolves everything from the token.

---

## The one rule: reuse the same token

The Headless API's `GET /mobile/token` returns an opaque, **non-expiring** token that is **not persisted server-side** on generation — it only becomes meaningful once you submit a consent under it. This has one practical consequence:

> **Generate the token once, store it, and reuse it everywhere** — for every native consent call *and* every webview URL for that user. If you generate a fresh token for the webview, it has no consent behind it and the widget will prompt.

See [Identifiers](../getting-started/identifiers.md) for token formats and storage guidance.

---

## Custom Tab vs. embedded WebView

| Container | Can the host app inject cookies / JS? | Sharing mechanism |
|-----------|----------------------------------------|-------------------|
| **Chrome Custom Tab** / `SFSafariViewController` | **No** — it is the system browser, isolated from your app | **URL token only** (`?axeptio_token=`) |
| **Embedded WebView** (Android WebView / WKWebView) | Yes | URL token *or* cookie/localStorage injection |

Because a Custom Tab shares nothing with your app, the **URL token is the only mechanism that works there** — and it is also the simplest option for an embedded WebView. This guide uses the URL-token approach throughout: it covers both containers with one code path. (The native SDKs expose helpers for this — `appendAxeptioTokenToURL` on iOS, `appendAxeptioToken` on Android — but with the headless approach you append the parameter yourself.)

---

## Requirements

For the widget to find the consent and stay hidden, **all** of these must line up between the native submission and the web page:

- **Same project** — the `projectId` in your headless calls is the widget's client id.
- **Same environment / store** — the production web widget reads from `api.axept.io/v1`. The **production** Headless API (`headless-api.axeptio.tech`) writes to that same store. Staging writes to a separate store the public widget does not read. **Use Production for cross-context sharing.**
- **`cookies` collection** — the widget queries `service=cookies`. Submit the cookie consent under the `cookies` collection.
- **Same config identifier** — submit under the `configId` (your project's `defaultConfigId`) that the web page's widget is configured with.
- **Same token value** — as described above.

If the app only submitted, say, a `processings` consent, or used a different project or config, the widget's `service=cookies` lookup finds nothing and it still prompts.

---

## Building the URL

Append `axeptio_token` to your target URL, preserving any existing query string and replacing the parameter if it is already present:

```js
const AXEPTIO_TOKEN_PARAM = 'axeptio_token';

function appendAxeptioToken(url, token) {
  if (!url || !token) return url;
  const [base, hash = ''] = url.split('#');
  const [path, query = ''] = base.split('?');
  const params = query
    .split('&')
    .filter(part => part && part.split('=')[0] !== AXEPTIO_TOKEN_PARAM);
  params.push(`${AXEPTIO_TOKEN_PARAM}=${encodeURIComponent(token)}`);
  const rebuilt = `${path}?${params.join('&')}`;
  return hash ? `${rebuilt}#${hash}` : rebuilt;
}

// https://shop.example/checkout?step=1  ->  ...?step=1&axeptio_token=flfvv6d974b9jxwd
```

---

## Opening it (React Native / Expo)

Open the tokenized URL in a Custom Tab with [`expo-web-browser`](https://docs.expo.dev/versions/latest/sdk/webbrowser/):

```js
import * as WebBrowser from 'expo-web-browser';

async function openCheckout(checkoutUrl, consentToken) {
  const target = appendAxeptioToken(checkoutUrl, consentToken);
  await WebBrowser.openBrowserAsync(target); // Chrome Custom Tab (Android) / SFSafariViewController (iOS)
}
```

`consentToken` must be the token you already submitted consent under — not a freshly generated one. The [React Native example](../../examples/react-native/) implements exactly this: set a **Checkout URL** in Settings, submit a consent, then tap **Open Checkout (share consent)**.

---

## Verifying it works

1. **Happy path** — submit a `cookies` consent (Accept All) under token `X` on **Production**, then open `checkout?axeptio_token=X`. The widget should **not** appear.
2. **Negative test** — open the same page with a fresh token that has no consent (or with no `axeptio_token` at all). The widget **should** appear. This confirms the token is what suppresses it, not caching.
3. Check the console log for the final URL, and confirm the widget's network call `GET api.axept.io/v1/app/consent/{projectId}?token=X&service=cookies&identifier={configId}` returns a consent record (`accept` / `_id`). A token with no consent returns `{"accept":false}` and the banner shows.

---

## Listening for consent inside the web page

If your web page needs to react to consent (e.g. to fire tracking), listen through the widget's real event API — the `window._axcb` queue, which is race-free whether your code runs before or after the SDK loads:

```js
window._axcb = window._axcb || [];
window._axcb.push(function (sdk) {
  // sdk === window.axeptioSDK, guaranteed ready here
  sdk.on('cookies:complete', function (choices) {
    // consent chosen or already present — run your tracking
  });
  sdk.on('ready', function () {
    // the SDK finished initializing
  });
});
```

> **There is no `axeptio:init` DOM event.** The widget does not dispatch a `window`/`document` event by that name, so `addEventListener('axeptio:init', …)` never fires. Use `window._axcb` with `cookies:complete` / `ready` instead. In the mobile app-SDK/WebView bridge, the "ready" signal is `app:cookies:ready`.

---

## Further reading

- [Integration Lifecycle](../getting-started/integration-lifecycle.md): the six-step API flow
- [Consent Model](../getting-started/consent-model.md): payload schema and the `cookies` collection
- [Identifiers](../getting-started/identifiers.md): projectId, configId, and the user token
- [React Native Guide](./react-native.md): the example app walkthrough
- [Multi-Platform Overview](./mobile-integration-reference.md): choosing headless vs. WebView SDKs
