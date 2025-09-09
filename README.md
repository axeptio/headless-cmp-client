# Axeptio Headless CMP Client SDKs

Official client SDKs and implementation examples for the Axeptio Headless Consent Management Platform.

## Overview

This repository contains client-side implementations for integrating Axeptio's consent management solution into mobile and web applications.

## Status

- **React Native**: Implemented with working example
- **iOS**: Coming soon
- **Android**: Coming soon  
- **Flutter**: Coming soon

## Quick Start

### Prerequisites

- Axeptio account with API access
- Project ID from your Axeptio dashboard
- Development environment for your target platform

### React Native Example

```bash
cd examples/react-native
npm install
npm start
```

See the [React Native example](./examples/react-native/) for a complete working implementation.

## Documentation

### API Reference

- [Widget API Documentation](https://staging-api.axeptio.tech/mobile/docs/widget)

### Platform Guides

- [React Native Guide](./docs/platform-guides/react-native.md)
- iOS Integration Guide (coming soon)
- Android Integration Guide (coming soon)
- Flutter Guide (coming soon)

## Project Structure

```
headless-cmp-client/
├── docs/
│   ├── getting-started/     # Quick start and setup guides
│   └── platform-guides/     # Platform-specific integration docs
├── examples/                # Working example applications
│   ├── android/            # Coming soon
│   ├── flutter/            # Coming soon
│   ├── ios/                # Coming soon
│   └── react-native/       # Working implementation
└── sdks/                    # SDK source code (coming soon)
```

## Core Features

### Consent Collection
- Present consent interfaces
- Capture user preferences
- Handle granular consent choices
- Support for multiple consent types (cookies, processing, contracts)

### Consent Retrieval
- Check current consent status
- Retrieve consent history
- Verify consent validity
- Handle consent expiration

## API Endpoints

The client SDKs interact with these primary endpoints:

- `POST /mobile/consents/{clientId}/{collection}/{configId}` - Submit consent
- `GET /mobile/consents/{projectId}` - Retrieve consent status
- `GET /mobile/configurations/{projectId}` - Get project configuration

## Development

### Contributing

We welcome contributions. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/axeptio/headless-cmp-client.git
cd headless-cmp-client

# For React Native example
cd examples/react-native
npm install
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.