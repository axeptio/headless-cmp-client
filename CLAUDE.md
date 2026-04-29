# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Axeptio Headless CMP Client repository — public documentation and React Native example for integrating Axeptio's consent management solution. React Native is the current implemented platform; iOS, Android, and Flutter are on the roadmap.

## Core Concepts

### Consent Management Platform (CMP)
Axeptio provides a headless consent management solution for GDPR/CCPA compliance. The system manages:
- User consent collection and storage
- Vendor preference management  
- Cookie consent tracking
- Compliance with privacy regulations

### API Architecture
The clients interact with the Axeptio mobile API:
- Base URL: `https://headless-api.axeptio.tech` (Production)
- Staging: `https://staging-api.axeptio.tech`
- Swagger UI: `https://headless-api.axeptio.tech/mobile/docs`
- Main endpoints:
  - `POST /mobile/consents/{clientId}/{collection}/{configId}` - Submit consent
  - `GET /mobile/client/{projectId}/consents/{token}` - Retrieve consent status
  - `GET /mobile/configurations/{projectId}` - Get project configuration
  - `GET /mobile/token` - Generate consent token
  - `GET /mobile/auth/me` - Validate bearer token

## Repository Structure

```
headless-cmp-client/
├── docs/
│   ├── api-reference/
│   │   └── overview.md          # Full endpoint catalog, rate limits, error codes
│   ├── getting-started/
│   │   ├── quick-start.md       # 5-minute integration guide
│   │   └── authentication.md    # Bearer tokens, secure storage, error handling
│   └── platform-guides/
│       ├── react-native.md      # useConsent hook, offline queue, Google Consent Mode
│       └── mobile-integration-reference.md  # Multi-platform reference (iOS/Android/RN)
└── examples/
    └── react-native/            # Working Expo demo with consent modal
```

## Development Status

**Current State**: React Native documentation and example are complete. Other platforms are on the roadmap.

- Documentation: Quick start, authentication, API reference, and React Native guide — all complete
- Examples: `examples/react-native/` — working Expo demo
- iOS, Android, Flutter: roadmap

## Common Development Tasks

### React Native Example

```bash
cd examples/react-native
npm install
npm start        # Expo dev server
```

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
