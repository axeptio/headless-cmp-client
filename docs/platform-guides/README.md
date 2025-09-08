# Mobile Integration Resources

This directory contains comprehensive resources for integrating Axeptio consent management into mobile applications.

## 📱 Mobile Integration Guide

**[MOBILE_INTEGRATION_GUIDE.md](./MOBILE_INTEGRATION_GUIDE.md)** - Complete implementation guide for mobile developers

### What's Included:

- **Getting Started**: Authentication setup and project configuration
- **Core API Integration**: Essential endpoints for consent management
- **Platform-Specific Implementation**:
  - iOS (Swift) - Complete code examples with API client, local storage, and offline queue
  - Android (Kotlin) - Retrofit setup, SharedPreferences, and WorkManager integration
  - React Native - Cross-platform implementation with hooks and context
  - Flutter - Native implementation patterns
- **Advanced Features**:
  - Google Consent Mode v2 integration
  - Offline capability with retry mechanisms
  - Geolocation-based compliance handling
- **Testing & Deployment**: Integration testing and production setup

## 🔗 API Documentation

### Enhanced CMP Implementation API

- **Swagger UI**: `/v1/swagger/api-doc-cmp-implementation/`
- **JSON Spec**: `swagger/all-cmp-implementation.swagger.json`

**Mobile-Specific Features:**

- **Mobile Integration Tag**: Dedicated section for mobile-specific endpoints
- **Platform Examples**: iOS, Android, React Native, and Flutter code samples
- **Mobile Endpoints**:
  - `GET /cmp/mobile/config` - Mobile-optimized project configuration
  - `POST /cmp/mobile/consent/batch` - Batch consent submission for offline sync
- **Enhanced Examples**: Mobile-specific request/response examples with platform metadata

### Key Mobile API Patterns

#### Project Configuration

```http
GET /v1/vault/project/{projectId}
```

Retrieve project configuration with consent categories and vendor settings.

#### Consent Collection

```http
POST /v1/app/consents/{clientId}/cookies/{configId}
```

Submit user consent preferences with mobile-specific metadata.

#### Batch Operations (Mobile-Optimized)

```http
POST /v1/cmp/mobile/consent/batch
```

Submit multiple consent records for offline synchronization.

## 🛠 Implementation Examples

### iOS Swift

- Complete `AxeptioAPIClient` with async/await
- `ConsentStorage` using UserDefaults
- Offline `ConsentQueue` with retry logic
- Background processing integration

### Android Kotlin

- Retrofit API client with OkHttp interceptors
- SharedPreferences-based storage
- WorkManager for background sync
- Comprehensive error handling

### React Native

- Cross-platform API client with network state handling
- React hooks for consent management (`useConsent`)
- Context provider pattern (`ConsentProvider`)
- Platform-specific storage abstraction

### Flutter

- Native implementation patterns
- Platform channel communication
- Cross-platform data models

## 📊 Features Supported

### ✅ Core Functionality

- Real-time consent collection
- User preference restoration
- Token-based authentication
- Cross-platform compatibility

### ✅ Advanced Features

- **Offline Capability**: Queue and sync consents when network is restored
- **Google Consent Mode v2**: Complete integration with analytics platforms
- **Geolocation Compliance**: GDPR, CCPA, and region-specific flows
- **Batch Operations**: Efficient mobile synchronization patterns

### ✅ Production Ready

- Comprehensive error handling
- Performance monitoring
- Security best practices
- Rate limiting compliance

## 🚀 Quick Start

1. **Review the Integration Guide**: Start with `MOBILE_INTEGRATION_GUIDE.md`
2. **Explore API Documentation**: Visit the CMP implementation Swagger UI
3. **Choose Your Platform**: Implement using provided code examples
4. **Test Integration**: Use provided testing patterns and validation
5. **Deploy**: Follow production configuration guidelines

## 📝 Documentation Structure

```
├── MOBILE_INTEGRATION_GUIDE.md          # Main implementation guide (1098 lines)
├── MOBILE_INTEGRATION_README.md         # This overview document
└── swagger/
    ├── all-cmp-implementation.swagger.json  # Enhanced API spec (143KB)
    └── cmp-implementation.swagger.json      # Mobile-specific additions
```

## 🎯 Target Audiences

- **Mobile App Developers**: Native iOS/Android developers implementing consent management
- **Cross-Platform Developers**: React Native and Flutter developers
- **CMP Implementers**: Customers building custom consent management solutions
- **Technical Integrators**: Teams implementing Axeptio API in mobile environments

## 🔒 Security & Compliance

- **Token Management**: Secure storage using Keychain (iOS) and EncryptedSharedPreferences (Android)
- **Network Security**: TLS 1.2+ encryption for all API communications
- **Data Privacy**: Minimal data collection with user consent
- **Compliance Support**: Built-in GDPR, CCPA, and regional regulation handling

## 📞 Support

For mobile integration support:

- **Technical Documentation**: Enhanced API documentation with mobile examples
- **Code Samples**: Complete implementation examples for all platforms
- **Integration Support**: cmp-support@axeptio.eu

This comprehensive mobile integration package enables native consent management implementation across all major mobile platforms while maintaining full compliance and optimal user experience.
