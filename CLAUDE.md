# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Axeptio Headless CMP Client SDKs repository, containing client-side implementations for integrating Axeptio's consent management solution into mobile and web applications. The repository is in early development with documentation and example placeholders for iOS, Android, React Native, and Flutter platforms.

## Core Concepts

### Consent Management Platform (CMP)
Axeptio provides a headless consent management solution for GDPR/CCPA compliance. The system manages:
- User consent collection and storage
- Vendor preference management  
- Cookie consent tracking
- Compliance with privacy regulations

### API Architecture
The clients interact with the Axeptio API:
- Base URL: `https://api.axept.io/v1/` (Production)
- Staging API Docs: `https://staging-api.axeptio.tech/mobile/docs/`
- Main endpoints:
  - `POST /mobile/consents/{clientId}/{collection}/{configId}` - Submit consent
  - `GET /mobile/consents/{projectId}` - Retrieve consent status
  - `GET /vault/project/{projectId}` - Get project configuration

## Repository Structure

```
headless-cmp-client/
├── docs/
│   ├── getting-started/     # Quick start and setup guides
│   │   ├── quick-start.md   # 5-minute integration guide
│   │   └── authentication.md # API authentication setup
│   └── platform-guides/     # Platform-specific docs (placeholders)
│       ├── ios-swift.md
│       ├── android-kotlin.md
│       ├── react-native.md
│       └── flutter.md
├── examples/                # Example apps (placeholders)
│   ├── android/
│   ├── flutter/
│   ├── ios/
│   └── react-native/
└── sdks/                    # SDK source (empty - coming soon)
```

## Development Status

**Current State**: Documentation and structure only. No actual SDK implementations exist yet.

- Documentation: Quick start guide complete, platform guides are placeholders
- Examples: Directory structure only, no code
- SDKs: Empty directory, implementations coming soon

## Common Development Tasks

Since this is a documentation/planning repository, there are no build, test, or deployment commands currently. When SDKs are implemented, platform-specific commands will be:

### Future iOS Development
- Build: `swift build` 
- Test: `swift test`
- Package: Swift Package Manager integration

### Future Android Development  
- Build: `./gradlew build`
- Test: `./gradlew test`
- Package: Maven Central deployment

### Future React Native Development
- Install: `npm install`
- Test: `npm test`
- Package: npm registry

### Future Flutter Development
- Get dependencies: `flutter pub get`
- Test: `flutter test`
- Package: pub.dev deployment

## Key Implementation Requirements

When implementing SDKs, ensure:

1. **Secure Credential Storage**: Use platform-specific secure storage (iOS Keychain, Android Keystore, etc.)
2. **Offline Support**: Queue consent submissions when offline with retry logic
3. **Error Handling**: Comprehensive error management with proper status codes
4. **Background Processing**: Support for consent synchronization in background
5. **Privacy Compliance**: GDPR/CCPA compliant data handling

## API Integration Patterns

All SDKs should implement these core patterns:

1. **Authentication**: Bearer token in Authorization header
2. **Content Type**: application/json for all requests
3. **Error Codes**: 
   - 401: Authentication failed
   - 404: Project not found
   - 429: Rate limited
   - 500+: Server errors
4. **Retry Logic**: Exponential backoff for failed requests
5. **Consent Structure**:
   ```json
   {
     "accept": boolean,
     "preferences": {
       "vendors": {
         "vendor_id": boolean
       }
     },
     "token": "unique_user_id"
   }
   ```

## Related Resources

- Main API Repository: https://github.com/axeptio/headless-cmp
- Widget Client: https://github.com/axeptio/widget-client
- API Documentation: https://staging-api.axeptio.tech/mobile/docs/widget
- Support: cmp-support@axeptio.eu