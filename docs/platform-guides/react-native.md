# React Native Integration Guide

This guide explains how to integrate the Axeptio Headless CMP API into a React Native or Expo application.

The repo includes a working example app at [`examples/react-native/`](../../examples/react-native/) that demonstrates everything covered here. For the platform-agnostic API flow, see [Integration Lifecycle](../getting-started/integration-lifecycle.md).

---

## Prerequisites

- React Native 0.73+ or Expo SDK 50+
- Node.js 18+
- An API token and project ID (see [Get your credentials](../getting-started/credentials.md))

---

## The example app

The example app is a single-file Expo app (`App.js`) that demonstrates:
- Fetching configuration and vendors from the API
- Rendering a custom consent modal with vendor toggles
- Submitting consent and reading it back
- Switching between staging and production environments
- Generating and managing user tokens

To run it:

```bash
cd examples/react-native
npm install
npm start
```

The app uses these dependencies:

```json
{
  "@react-native-async-storage/async-storage": "2.2.0",
  "expo": "^54.0.22",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-modal": "^13.0.1"
}
```

The entire implementation lives in `App.js`. There is no separate SDK, no installable package, and no pre-built components. The app is a reference implementation: read it, understand the API calls, then build your own UI.

> **Known bugs in the example app**: The app has two confirmed issues tracked in Linear. First, `googleConsentMode` is placed at the top level of the consent payload instead of inside `preferences`, which means Google Consent Mode signals are silently dropped by the API (MSK-208, medium). Second, only 4 of the 7 GCM v2 signals are sent; `functionality_storage`, `personalization_storage`, and `security_storage` are missing (MSK-209, low, blocked by MSK-208). Additionally, `accept` is hardcoded to `true` even for rejection flows.

---

## How the example app calls the API

The example app follows the same six-step flow described in [Integration Lifecycle](../getting-started/integration-lifecycle.md). Here is how each step maps to the code in `App.js`:

### Fetch configuration

On mount, the app calls `fetchConfiguration()` to get the `defaultConfigId`:

```javascript
const response = await fetch(
  `${apiBase}/configurations/${projectId}`,
  {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    }
  }
);
const data = await response.json();
// data.defaultConfigId is stored in state as configId
```

### Fetch vendors

Also on mount, `fetchVendors()` retrieves the vendor list and builds the consent UI:

```javascript
const response = await fetch(
  `${apiBase}/vendors/${projectId}`,
  {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    }
  }
);
const vendorData = await response.json();
// vendorData.vendors is an array; the app maps it to toggle switches
```

### Generate a user token

The app calls `fetchToken()` to get a 16-character token from the API:

```javascript
const response = await fetch(
  `${apiBase}/token`,
  {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    }
  }
);
const data = await response.json();
// data.token is a 16-char lowercase alphanumeric string
```

The token is stored in React state. In a production app, you would store it in secure storage (see [Recommended patterns](#store-tokens-securely) below).

### Submit consent

The `submitConsent()` function builds the payload and posts it:

```javascript
const consent = {
  accept: true,
  token: tokenToUse,
  preferences: {
    config: {
      language: 'en',
      identifier: currentConfigId
    },
    vendors: vendorPreferences
  }
};

const response = await fetch(
  `${apiBase}/consents/${projectId}/cookies/${currentConfigId}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
    body: JSON.stringify(consent)
  }
);
```

For the full payload schema (required and optional fields), see [Consent Model](../getting-started/consent-model.md).

### Read consent back

The `checkConsentStatus()` function retrieves stored consent. Note both query parameters are required:

```javascript
const response = await fetch(
  `${apiBase}/client/${projectId}/consents/${lastConsentToken}?identifier=${currentConfigId}&service=cookies`,
  {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    }
  }
);
```

See [Identifiers](../getting-started/identifiers.md#which-endpoint-needs-which-identifiers) for which parameters each endpoint requires.

---

## Recommended patterns for production

The example app is intentionally simple: everything in one file, tokens in React state, no error recovery. The patterns below are recommendations for production apps. They do not exist in the repo; implement them in your own codebase.

### Store tokens securely

The API token grants full access to your project. In production, store it in the device's secure storage, not in source code or plain AsyncStorage.

Using `react-native-keychain`:

```bash
npm install react-native-keychain
```

```javascript
import * as Keychain from 'react-native-keychain';

const SERVICE = 'AxeptioAPI';

// Store the API token
await Keychain.setInternetCredentials(SERVICE, 'api_token', yourApiToken);

// Retrieve it
const credentials = await Keychain.getInternetCredentials(SERVICE);
const apiToken = credentials ? credentials.password : null;

// Clear on logout
await Keychain.resetInternetCredentials(SERVICE);
```

Store the user token (from `GET /mobile/token`) the same way. The user token does not expire, so generate it once per user/device and reuse it.

### Handle the `accept` field correctly

The example app hardcodes `accept: true` for all submissions, even when the user rejects all vendors. In your implementation, set `accept` based on the user's actual choice:

```javascript
const consent = {
  accept: hasUserAcceptedAnyVendor,  // true if at least one vendor is accepted
  token: userToken,
  preferences: {
    vendors: vendorPreferences  // { "vendor_key": true/false, ... }
  }
};
```

Both `accept: true` and `accept: false` are valid. See [Consent Model: accept](../getting-started/consent-model.md#accept).

### Include Google Consent Mode signals

If you use Google products (Analytics, Ads, Tag Manager), include all 7 GCM v2 signals inside `preferences` (not at the top level):

```javascript
const consent = {
  accept: true,
  token: userToken,
  preferences: {
    vendors: { google_analytics: true, facebook_pixel: false },
    googleConsentMode: {
      version: 2,
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'denied'
    }
  }
};
```

The `googleConsentMode` object **must** be inside `preferences`. If placed at the top level of the payload, it is silently ignored by the API. See [Consent Model: Google Consent Mode v2](../getting-started/consent-model.md#google-consent-mode-v2).

### Handle errors and retries

The API can return several error codes. A minimal error handler:

```javascript
async function submitConsentSafely(apiBase, projectId, configId, consent, apiToken) {
  try {
    const response = await fetch(
      `${apiBase}/consents/${projectId}/cookies/${configId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(consent)
      }
    );

    if (response.ok) return await response.json();

    if (response.status === 401) {
      // Token invalid or expired; prompt for re-authentication
      throw new Error('AUTH_FAILED');
    }
    if (response.status === 429) {
      // Rate limited; retry after the delay
      const retryAfter = response.headers.get('Retry-After') || 60;
      throw new Error(`RATE_LIMITED:${retryAfter}`);
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    if (error.message === 'Network request failed') {
      // Device is offline; queue for later
      throw new Error('OFFLINE');
    }
    throw error;
  }
}
```

### Queue consent submissions offline

When the device has no network, store consent locally and replay when connectivity returns. A simple approach using AsyncStorage and NetInfo:

```bash
npm install @react-native-community/netinfo
```

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'axeptio_consent_queue';

// Add a consent to the queue
async function enqueueConsent(consent, projectId, configId) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ consent, projectId, configId, timestamp: Date.now(), retries: 0 });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Process the queue when online
async function processQueue(apiBase, apiToken) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;

  const queue = JSON.parse(raw);
  const failed = [];

  for (const item of queue) {
    try {
      await fetch(
        `${apiBase}/consents/${item.projectId}/cookies/${item.configId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          },
          body: JSON.stringify(item.consent)
        }
      );
    } catch {
      if (item.retries < 3) {
        failed.push({ ...item, retries: item.retries + 1 });
      }
      // Drop items after 3 retries
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
}

// Listen for reconnection
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processQueue(apiBase, apiToken);
  }
});
```

> **Note**: The `POST /mobile/consents/batch` endpoint listed in Swagger is not implemented. To submit multiple queued consents, call the single-consent endpoint for each one.

---

## What this repo is (and is not)

This repo provides an API and a reference implementation. It is not a packaged SDK. There is no `npm install @axeptio/headless-cmp` or equivalent. You integrate by making HTTP calls to the API endpoints and building your own UI.

If you want a pre-built consent UI instead of building your own, Axeptio offers native SDKs that use WebView rendering:
- iOS: `axeptio-ios-sdk`
- Android: `axeptio-android-sdk`
- Flutter: `flutter-sdk`

These are separate products from this headless repo. See [Multi-Platform Overview](./mobile-integration-reference.md) for guidance on choosing between them.

---

## Further reading

- [Integration Lifecycle](../getting-started/integration-lifecycle.md): the six-step API flow
- [Consent Model](../getting-started/consent-model.md): payload schema, required/optional fields, validation behavior
- [Identifiers](../getting-started/identifiers.md): projectId, configId, user token, Bearer token
- [API Reference](../api-reference/overview.md): full endpoint catalog, error codes, rate limits
- [Example App README](../../examples/react-native/README.md): running the demo, architecture overview