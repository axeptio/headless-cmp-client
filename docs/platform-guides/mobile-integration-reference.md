# Multi-Platform Overview

The Axeptio Headless CMP API is a standard REST API. It works with any HTTP client on any platform: iOS, Android, React Native, Flutter, or server-side. You build the consent UI; the API handles storage, retrieval, and compliance.

This page helps you choose the right integration approach and find the right resources for your platform.

---

## Choose your approach

| I want to... | Use this | What it gives you |
|--------------|----------|-------------------|
| Build my own consent UI with full control over design and behavior | **Headless CMP API** (this repo) | Raw API endpoints; you handle all UI, storage, and state management |
| Use a pre-built consent widget with minimal setup | **WebView SDKs** (see below) | WebView-rendered consent UI with built-in storage and analytics |

---

## Headless CMP API (this repo)

The headless API is platform-agnostic. The integration flow is the same regardless of language or framework:

1. Validate your token (`GET /mobile/auth/me`)
2. Fetch configuration (`GET /mobile/configurations/{projectId}`)
3. Fetch vendors (`GET /mobile/vendors/{projectId}`)
4. Generate a user token (`GET /mobile/token`)
5. Submit consent (`POST /mobile/consents/{projectId}/cookies/{configId}`)
6. Read consent back (`GET /mobile/client/{projectId}/consents/{token}?service=cookies&identifier={configId}`)

For the detailed walkthrough with cURL examples, see [Integration Lifecycle](../getting-started/integration-lifecycle.md).

The only platform-specific decisions are:
- **Secure storage**: where to store the API token and user token (iOS Keychain, Android Keystore, React Native Keychain, etc.)
- **Offline handling**: how to queue consent submissions when the device has no network
- **UI rendering**: how to display the vendor list and consent controls

### Reference implementation

This repo includes a working React Native (Expo) example at [`examples/react-native/`](../../examples/react-native/). The [React Native Guide](./react-native.md) walks through the example code and provides recommended production patterns for secure storage, error handling, and offline support.

The same API calls shown in the React Native guide apply to any platform. Translate the `fetch()` calls to your platform's HTTP client (URLSession on iOS, OkHttp/Retrofit on Android, http package in Flutter, etc.) and the integration is identical.

---

## WebView SDKs (pre-built UI)

If you prefer a ready-made consent widget instead of building custom UI, Axeptio offers mobile SDKs that render a consent interface via WebView:

| Platform | SDK |
|----------|-----|
| iOS | `axeptio-ios-sdk` |
| Android | `axeptio-android-sdk` |
| Flutter | `flutter-sdk` |

These SDKs handle the full consent flow internally (configuration, UI rendering, consent submission, storage). They are separate products from this headless repo. Contact [Axeptio support](https://www.axeptio.eu) for access and documentation.

> **Note**: The deprecated `@axeptio/react-native-sdk` package is no longer maintained. This headless repo is its designated successor for developers who want to build custom consent UI in React Native.

---

## Further reading

- [Get your credentials](../getting-started/credentials.md): how to obtain your API token and project ID
- [Integration Lifecycle](../getting-started/integration-lifecycle.md): the six-step API flow
- [API Reference](../api-reference/overview.md): full endpoint catalog
- [React Native Guide](./react-native.md): reference implementation walkthrough