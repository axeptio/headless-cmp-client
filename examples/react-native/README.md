# Axeptio React Native Demo

A minimal demonstration of a custom consent widget using Axeptio's Headless CMP API.

## Overview

This example demonstrates how to build a custom consent management interface in React Native that integrates with Axeptio's headless API. It showcases:

- Custom consent modal UI
- Direct API integration with Axeptio staging environment  
- Vendor preference management with toggles
- Real-time consent submission
- Consent status checking

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android emulator

### Installation

```bash
# Clone the repository
cd examples/react-native

# Install dependencies
npm install
# or
yarn install

# Start the app
npm start
# or
expo start
```

### Running on Devices

```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android  

# Web Browser
npm run web
```

## Architecture

### Single File Implementation
The entire demo is contained in `App.js` for simplicity:

```
App.js
├── Configuration (API endpoints, Project ID)
├── State Management (React hooks)
├── UI Components (Modal, switches, buttons)
├── API Integration (fetch calls)
└── Styles (StyleSheet)
```

### Key Components

#### Consent Modal
- Privacy-focused UI with vendor list
- Individual toggle switches for each vendor
- Accept All / Save Preferences buttons
- Quick actions for select/deselect all

#### API Integration
```javascript
// Fetch configuration
GET /mobile/configurations/{projectId}

// Submit consent
POST /mobile/consents/{projectId}/cookies/{configId}

// Check consent status
GET /mobile/client/{projectId}/consents/{token}?identifier={configId}&service=cookies
```

## Features

### Vendor Management
Vendors are fetched live from `GET /mobile/vendors/{projectId}` and rendered with their logo, title
and description. Each toggle is keyed on the vendor's **`name` slug** from that response (e.g.
`googletagmanager`) — that is the key the consent store matches on, not the 24-hex `id` and not the
display title. If the vendor list cannot be loaded the modal says so rather than falling back to
placeholder vendors, because placeholder keys would produce a consent nothing can read.

### User Actions
1. **Manage Consent** - Opens the privacy settings modal
2. **Check Status** - Retrieves current consent from API
3. **Accept All** - Grants consent for all vendors
4. **Save Preferences** - Saves custom vendor selections
5. **Open Checkout (share consent)** - Opens the configurable Checkout URL in a Custom Tab with `?axeptio_token=` appended, so the Axeptio web widget on that page stays hidden

### Visual Feedback
- Success alerts for saved consent
- API response details
- Current consent status display
- Loading indicators during API calls

### Consent Sharing (WebView / Custom Tab)
Demonstrates propagating native consent into a web page (checkout, account area, etc.) so the Axeptio web widget does not prompt again. The app reuses the same user token for both the headless consent submission and the web URL, appending `?axeptio_token=<token>` before opening the page in a Chrome Custom Tab / `SFSafariViewController` via `expo-web-browser`.

Set the target page under **Settings → Checkout URL**. The mechanism, requirements, and caveats are documented in [WebView Consent Sharing](../../docs/platform-guides/webview-consent-sharing.md).

> **Note:** Cross-context sharing only resolves on the **Production** environment — the public web widget reads the same consent store that Production headless writes to. Submit a `cookies` consent first; a fresh token with no consent behind it will still show the widget.

## Configuration

Defaults live at the top of `App.js` and are all overridable at runtime under **Settings**
(persisted in `AsyncStorage`):

```javascript
const DEFAULT_PROJECT_ID  = '67fcdb2b52ab9a99a5865f4d';
const DEFAULT_ENVIRONMENT = 'staging';   // 'local-dev' | 'staging' | 'production'
const DEFAULT_CHECKOUT_URL = '';         // page to open in a Custom Tab
const APP_VERSION = '1.0.0';             // sent as headers['x-app-version']

const ENVIRONMENTS = {
  'local-dev':  { url: 'http://localhost:3000/mobile' },
  staging:      { url: 'https://staging-api.axeptio.tech/mobile' },
  production:   { url: 'https://headless-api.axeptio.tech/mobile' },
};
```

The demo authenticates with `Bearer project_<projectId>_test_token`, which the public demo project
accepts. A real project needs a real bearer token — see
[Credentials](../../docs/getting-started/credentials.md).

## API Endpoints Used

| Path (relative to API_BASE) | Method | Purpose |
|----------|--------|---------|
| `/configurations/{projectId}` | GET | Fetch project configuration and configId |
| `/vendors/{projectId}` | GET | Fetch vendor list |
| `/token` | GET | Generate a consent user token |
| `/consents/{projectId}/cookies/{configId}` | POST | Submit user consent |
| `/client/{projectId}/consents/{token}?identifier={configId}&service=cookies` | GET | Retrieve consent status |
| `/auth/me` | GET | Validate bearer token |

### Consent Payload Structure

This is exactly what the app sends:

```json
{
  "accept": true,
  "token": "flfvv6d974b9jxwd",
  "timestamp": "2025-06-01T12:05:00.000Z",
  "headers": {
    "x-mobile-platform": "react-native",
    "x-app-version": "1.0.0"
  },
  "preferences": {
    "config": {
      "language": "en",
      "identifier": "6859079473219bcbb8435079"
    },
    "vendors": {
      "googletagmanager": true,
      "google_firebase_analytics": false
    },
    "googleConsentMode": {
      "version": 2,
      "security_storage": "granted",
      "analytics_storage": "denied",
      "ad_storage": "granted",
      "ad_user_data": "granted",
      "ad_personalization": "granted",
      "functionality_storage": "granted",
      "personalization_storage": "denied"
    }
  }
}
```

Notes on the payload:
- `accept` reflects whether any vendor was accepted, not which button was pressed.
- `googleConsentMode` lives **inside** `preferences`; at the top level it is silently ignored.
- All seven Google Consent Mode v2 signals are sent, derived from the accepted vendors' `type`
  values (`buildGoogleConsentMode` in `App.js`). `security_storage` is always `granted`.

See [Consent Model](../../docs/getting-started/consent-model.md) for the full schema.

## Customization

### Styling
All styles are in the `StyleSheet` at the bottom of `App.js`. Key colors:
- Primary Green: `#32C832` (Axeptio brand)
- Text: `#2c3e50` (dark) / `#7f8c8d` (muted)
- Background: `#f8f9fa` (light gray)

### Adding Vendors
Vendors come from the project configuration, not from the app — add them in the Axeptio back-office
and they appear in the modal on next launch. To point the demo at your own project, change the
Project ID under **Settings**.

## Testing

### Manual Testing Checklist
- [ ] Modal opens and closes properly
- [ ] Vendor toggles work independently
- [ ] Select/Deselect all functions work
- [ ] Accept All submits correct payload
- [ ] Save Preferences submits current selections
- [ ] API responses show in alerts
- [ ] Check Status retrieves data
- [ ] Loading states display correctly
- [ ] Open Checkout appends `?axeptio_token=` and opens a Custom Tab
- [ ] With consent submitted (Production), the web widget stays hidden; with a fresh token it appears

### API Response Monitoring
The app displays full API responses in alerts for debugging:
- HTTP status codes
- Response body (JSON)
- Error messages

## Production Considerations

This is a **demo implementation**. For production, consider:

1. **Authentication** - Use a real Bearer token from a secure store (iOS Keychain / Android Keystore), not the demo `project_<id>_test_token` pattern
2. **Storage** - Implement AsyncStorage for persistent consent
3. **Offline Support** - Queue consent submissions when offline
4. **Error Handling** - More robust error recovery
5. **Analytics** - Track consent interactions
6. **Localization** - Multi-language support
7. **Accessibility** - Screen reader support
8. **Testing** - Unit and integration tests

## Dependencies

```json
{
  "@react-native-async-storage/async-storage": "2.2.0",
  "expo": "^54.0.22",
  "expo-status-bar": "~3.0.8",
  "expo-web-browser": "~15.0.11",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-modal": "^13.0.1"
}
```

