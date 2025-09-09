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
- Node.js 16+ and npm/yarn
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
The entire demo is contained in `App.js` (~350 lines) for simplicity:

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
// Submit consent
POST /mobile/consents/{projectId}/cookies/default

// Check consent status  
GET /mobile/consents/{projectId}?token=demo_user
```

## Features

### Vendor Management
The demo includes 3 mock vendors (since the project config is empty):
- **Google Analytics** - Usage statistics and analytics
- **Facebook Pixel** - Ad targeting and conversion tracking
- **Mixpanel** - Product analytics and user behavior

### User Actions
1. **Manage Consent** - Opens the privacy settings modal
2. **Check Status** - Retrieves current consent from API
3. **Accept All** - Grants consent for all vendors
4. **Save Preferences** - Saves custom vendor selections

### Visual Feedback
- Success alerts for saved consent
- API response details
- Current consent status display
- Loading indicators during API calls

## Configuration

The app uses these hardcoded values (see `App.js`):

```javascript
const PROJECT_ID = '67fcdb2b52ab9a99a5865f4d';
const API_BASE = 'https://staging-api.axeptio.tech/mobile';
```

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mobile/consents/{projectId}/cookies/default` | POST | Submit user consent |
| `/mobile/consents/{projectId}` | GET | Retrieve consent status |

### Consent Payload Structure

```json
{
  "accept": true,
  "preferences": {
    "vendors": {
      "google_analytics": true,
      "facebook_pixel": false,
      "mixpanel": true
    }
  },
  "token": "demo_user_1234567890",
  "metadata": {
    "platform": "react-native",
    "appVersion": "1.0.0",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## Customization

### Styling
All styles are in the `StyleSheet` at the bottom of `App.js`. Key colors:
- Primary Green: `#32C832` (Axeptio brand)
- Text: `#2c3e50` (dark) / `#7f8c8d` (muted)
- Background: `#f8f9fa` (light gray)

### Adding Vendors
Add new vendors to the `VENDORS` object:

```javascript
const VENDORS = {
  your_vendor_id: { 
    name: 'Vendor Name', 
    description: 'What this vendor does' 
  }
};
```

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

### API Response Monitoring
The app displays full API responses in alerts for debugging:
- HTTP status codes
- Response body (JSON)
- Error messages

## Production Considerations

This is a **demo implementation**. For production, consider:

1. **Authentication** - Add proper Bearer token authentication
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
  "expo": "~49.0.0",
  "react": "18.2.0",
  "react-native": "0.72.10",
  "react-native-modal": "^13.0.1"
}
```

### Security Note

This demo uses Expo SDK 49 which has known vulnerabilities in its dependencies (semver, send). These are internal to Expo and would require upgrading to Expo SDK 53+ to resolve, which involves breaking changes. For production use, consider upgrading to the latest Expo SDK.

