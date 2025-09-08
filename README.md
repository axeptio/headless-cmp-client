# Axeptio Headless CMP Client SDKs & Examples

Official client SDKs, implementation examples, and integration guides for the Axeptio Headless Consent Management Platform.

## Overview

This repository contains client-side implementations for integrating Axeptio's consent management solution into your mobile and web applications. It provides:

- 📱 **Native Mobile SDKs** - iOS, Android implementations
- 🌐 **Cross-Platform Solutions** - React Native, Flutter support
- 📚 **Integration Guides** - Step-by-step platform-specific documentation
- 🔧 **Working Examples** - Ready-to-run sample applications
- 🚀 **Quick Start Templates** - Boilerplate code to accelerate development

## Quick Start

### Prerequisites

- Axeptio account with API access
- Project ID from your Axeptio dashboard
- Development environment for your target platform

### Installation

Choose your platform:

#### iOS (Swift)
```swift
// Coming soon: Swift Package Manager
// For now, see docs/platform-guides/ios-swift.md
```

#### Android (Kotlin)
```gradle
// Coming soon: Maven Central
// For now, see docs/platform-guides/android-kotlin.md
```

#### React Native
```bash
# Coming soon: npm package
# For now, see docs/platform-guides/react-native.md
```

#### Flutter
```yaml
# Coming soon: pub.dev package
# For now, see docs/platform-guides/flutter.md
```

## Documentation

### Platform Guides

- [iOS Integration Guide](./docs/platform-guides/ios-swift.md)
- [Android Integration Guide](./docs/platform-guides/android-kotlin.md)
- [React Native Guide](./docs/platform-guides/react-native.md)
- [Flutter Guide](./docs/platform-guides/flutter.md)

### Getting Started

- [Quick Start Guide](./docs/getting-started/quick-start.md) - 5-minute integration
- [Authentication](./docs/getting-started/authentication.md) - API authentication setup

### API Reference

For complete API documentation, see the [Headless CMP API Repository](https://github.com/axeptio/headless-cmp).

- [Widget API Documentation](https://staging-api.axeptio.tech/mobile/docs/widget)
- [Full API Documentation](https://staging-api.axeptio.tech/mobile/docs)

## Examples

Each platform has a complete example application:

```
examples/
├── ios/          # Swift/SwiftUI example app
├── android/      # Kotlin/Jetpack Compose example
├── react-native/ # Cross-platform React Native app
└── flutter/      # Cross-platform Flutter app
```

To run an example:

1. Navigate to the example directory
2. Follow the platform-specific README
3. Configure your Project ID
4. Run the application

## Project Structure

```
headless-cmp-client/
├── docs/
│   ├── getting-started/     # Quick start and setup guides
│   └── platform-guides/     # Platform-specific integration docs
├── examples/                # Working example applications
│   ├── android/
│   ├── flutter/
│   ├── ios/
│   └── react-native/
└── sdks/                    # SDK source code (coming soon)
    ├── android/
    ├── ios/
    └── react-native/
```

## Core Features

### Consent Collection
- Present consent banners and popups
- Capture user preferences
- Handle granular consent choices
- Support for multiple consent types (cookies, processing, contracts)

### Consent Retrieval
- Check current consent status
- Retrieve consent history
- Verify consent validity
- Handle consent expiration

### Platform Features
- **iOS**: Native SwiftUI components, Keychain storage
- **Android**: Jetpack Compose UI, encrypted SharedPreferences
- **React Native**: Cross-platform components, AsyncStorage
- **Flutter**: Material/Cupertino widgets, secure storage

## API Endpoints

The client SDKs interact with these primary endpoints:

- `POST /mobile/consents/{clientId}/{collection}/{configId}` - Submit consent
- `GET /mobile/consents/{projectId}` - Retrieve consent status
- `GET /mobile/consents/{projectId}/{language}/{collection}/{configId}` - Get specific consent

For detailed API documentation, visit the [API Swagger UI](https://staging-api.axeptio.tech/mobile/docs/widget).

## Development

### Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/axeptio/headless-cmp-client.git
cd headless-cmp-client

# Navigate to your platform SDK
cd sdks/[platform]

# Follow platform-specific build instructions
```

### Testing

Each SDK includes unit and integration tests:

```bash
# iOS
cd sdks/ios && swift test

# Android
cd sdks/android && ./gradlew test

# React Native
cd sdks/react-native && npm test

# Flutter
cd sdks/flutter && flutter test
```

## Support

- **Documentation**: [Platform Guides](./docs/platform-guides/)
- **API Reference**: [Headless CMP API](https://github.com/axeptio/headless-cmp)
- **Issues**: [GitHub Issues](https://github.com/axeptio/headless-cmp-client/issues)
- **Contact**: cmp-support@axeptio.eu

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Related Repositories

- [headless-cmp](https://github.com/axeptio/headless-cmp) - API infrastructure and documentation
- [widget-client](https://github.com/axeptio/widget-client) - Web widget implementation

---

_Building privacy-first mobile applications with Axeptio_