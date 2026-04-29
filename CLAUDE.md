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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
