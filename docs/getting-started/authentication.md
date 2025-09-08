# Authentication Guide

Comprehensive guide to secure authentication and token management for the Axeptio Headless CMP API.

## Overview

The Axeptio API uses **Bearer Token Authentication** with JWT (JSON Web Tokens) to secure all endpoints. This guide covers:

- Token types and lifecycle
- Secure token storage
- Authentication best practices
- Error handling and recovery

## Authentication Types

### API Tokens

**Usage**: Server-to-server authentication and mobile app integration
**Format**: `Bearer jwt_token_here`
**Scope**: Project-level access with configurable permissions
**Lifetime**: Configurable (default: 30 days)

### User Tokens

**Usage**: User-specific consent management
**Format**: String identifier for consent tracking
**Scope**: User-level consent data
**Lifetime**: Persistent until user deletion

## Getting Your API Token

### 1. Axeptio Dashboard

1. Log into [dashboard.axept.io](https://dashboard.axept.io)
2. Navigate to **Project Settings** → **API Access**
3. Click **Generate New Token**
4. Configure permissions and expiration
5. **Copy and store securely** (shown only once)

### 2. Token Permissions

Configure access levels for your token:

| Permission           | Description                   | Endpoints                                    |
| -------------------- | ----------------------------- | -------------------------------------------- |
| **Read Projects**    | Get project configuration     | `GET /vault/project/*`                       |
| **Manage Consents**  | Collect and retrieve consents | `POST /app/consents/*`, `GET /app/consent/*` |
| **Analytics Access** | View consent statistics       | `GET /stats/*`                               |
| **Admin Access**     | Full project management       | All endpoints                                |

## Secure Token Storage

### iOS (Swift) - Keychain

```swift
import Security

class SecureTokenStorage {
    private let service = "com.yourapp.axeptio"
    private let account = "api_token"

    func storeToken(_ token: String) -> Bool {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        // Delete any existing token
        SecItemDelete(query as CFDictionary)

        // Add new token
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        guard status == errSecSuccess,
              let data = dataTypeRef as? Data else {
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    func deleteToken() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
```

### Android (Kotlin) - EncryptedSharedPreferences

```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import android.content.Context

class SecureTokenStorage(private val context: Context) {
    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

    private val sharedPreferences = EncryptedSharedPreferences.create(
        "axeptio_secure_prefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun storeToken(token: String) {
        sharedPreferences.edit()
            .putString("api_token", token)
            .apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString("api_token", null)
    }

    fun deleteToken() {
        sharedPreferences.edit()
            .remove("api_token")
            .apply()
    }

    fun hasToken(): Boolean {
        return getToken() != null
    }
}
```

### React Native - Secure Storage

```javascript
import * as Keychain from "react-native-keychain";

class SecureTokenStorage {
  static SERVICE_NAME = "AxeptioAPI";

  static async storeToken(token) {
    try {
      await Keychain.setInternetCredentials(
        this.SERVICE_NAME,
        "api_token",
        token,
      );
      return true;
    } catch (error) {
      console.error("Failed to store token:", error);
      return false;
    }
  }

  static async getToken() {
    try {
      const credentials = await Keychain.getInternetCredentials(
        this.SERVICE_NAME,
      );
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error("Failed to retrieve token:", error);
      return null;
    }
  }

  static async deleteToken() {
    try {
      await Keychain.resetInternetCredentials(this.SERVICE_NAME);
      return true;
    } catch (error) {
      console.error("Failed to delete token:", error);
      return false;
    }
  }

  static async hasToken() {
    const token = await this.getToken();
    return token !== null;
  }
}
```

## API Client Implementation

### Base Client with Authentication

```javascript
class AxeptioAuthenticatedClient {
  constructor(baseURL = "https://api.axept.io/v1") {
    this.baseURL = baseURL;
    this.tokenStorage = new SecureTokenStorage();
  }

  async getAuthHeaders() {
    const token = await this.tokenStorage.getToken();
    if (!token) {
      throw new AuthenticationError("No API token available");
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "AxeptioHeadlessCMP/2.0.0",
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Handle authentication errors
      if (response.status === 401) {
        await this.handleAuthenticationError();
        throw new AuthenticationError("Authentication failed");
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          `Rate limited. Retry after ${retryAfter} seconds`,
        );
      }

      if (!response.ok) {
        throw new APIError(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof RateLimitError ||
        error instanceof APIError
      ) {
        throw error;
      }
      throw new NetworkError(`Network request failed: ${error.message}`);
    }
  }

  async handleAuthenticationError() {
    // Clear invalid token
    await this.tokenStorage.deleteToken();

    // Trigger token refresh flow
    // This should redirect to login or show auth required message
    this.onAuthenticationRequired?.();
  }
}
```

## Token Lifecycle Management

### Token Validation

```javascript
class TokenValidator {
  static validateTokenFormat(token) {
    // JWT tokens have three parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Decode header and payload (but don't verify signature - that's server-side)
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return header.typ === "JWT" && payload.exp && payload.iat;
    } catch {
      return false;
    }
  }

  static isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  static getTokenExpiration(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }
}
```

### Automatic Token Refresh

```javascript
class TokenManager {
  constructor(tokenStorage) {
    this.tokenStorage = tokenStorage;
    this.refreshThreshold = 5 * 60; // Refresh 5 minutes before expiry
  }

  async getValidToken() {
    const token = await this.tokenStorage.getToken();

    if (!token || !TokenValidator.validateTokenFormat(token)) {
      throw new AuthenticationError("Invalid or missing token");
    }

    if (this.shouldRefreshToken(token)) {
      return await this.refreshToken();
    }

    return token;
  }

  shouldRefreshToken(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;

      return expiresIn < this.refreshThreshold;
    } catch {
      return true;
    }
  }

  async refreshToken() {
    // Implement token refresh logic
    // This might involve calling a refresh endpoint or prompting user to re-authenticate
    throw new AuthenticationError(
      "Token refresh required - please re-authenticate",
    );
  }
}
```

## Error Handling

### Authentication Errors

```javascript
class AuthenticationError extends Error {
  constructor(message, code = "AUTH_FAILED") {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// Usage in API client
try {
  const result = await apiClient.makeRequest("/vault/project/123");
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication failure
    showLoginScreen();
  } else if (error instanceof RateLimitError) {
    // Handle rate limiting
    scheduleRetry(error.retryAfter);
  } else {
    // Handle other errors
    showErrorMessage(error.message);
  }
}
```

## Security Best Practices

### 1. Token Storage

- ✅ **Use secure storage** (Keychain/Keystore/Encrypted SharedPreferences)
- ✅ **Never log tokens** in console, analytics, or crash reports
- ✅ **Clear tokens on logout** or app uninstall
- ❌ **Never store in plain text** files or regular SharedPreferences

### 2. Network Security

- ✅ **Always use HTTPS** for API requests
- ✅ **Implement certificate pinning** for production apps
- ✅ **Validate SSL certificates**
- ❌ **Never disable SSL verification**

### 3. Token Transmission

- ✅ **Use Authorization header** with Bearer prefix
- ✅ **Include User-Agent** header for tracking
- ✅ **Set appropriate timeouts** (30 seconds recommended)
- ❌ **Never include tokens** in URL parameters or form data

### 4. Error Handling

- ✅ **Handle 401 errors** by clearing tokens and prompting re-auth
- ✅ **Implement exponential backoff** for 429 rate limit errors
- ✅ **Log errors appropriately** (without exposing tokens)
- ❌ **Never retry indefinitely** on authentication failures

## Testing Authentication

### Unit Tests

```javascript
describe("Authentication", () => {
  it("should store and retrieve tokens securely", async () => {
    const storage = new SecureTokenStorage();
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    const stored = await storage.storeToken(testToken);
    expect(stored).toBe(true);

    const retrieved = await storage.getToken();
    expect(retrieved).toBe(testToken);
  });

  it("should handle authentication failures", async () => {
    const client = new AxeptioAuthenticatedClient();

    // Mock 401 response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(client.makeRequest("/vault/project/test")).rejects.toThrow(
      AuthenticationError,
    );
  });
});
```

### Integration Tests

```javascript
describe("API Integration", () => {
  it("should authenticate with valid token", async () => {
    const client = new AxeptioAuthenticatedClient();
    await client.tokenStorage.storeToken(process.env.TEST_API_TOKEN);

    const result = await client.makeRequest("/vault/project/test_project_id");

    expect(result).toBeDefined();
    expect(result.id).toBe("test_project_id");
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: 401 Unauthorized
**Causes**: Expired token, invalid token format, incorrect project permissions
**Solution**: Check token validity, ensure proper Bearer format, verify project access

**Issue**: 429 Too Many Requests
**Causes**: Exceeded rate limits, too many concurrent requests
**Solution**: Implement exponential backoff, reduce request frequency, batch operations

**Issue**: Token storage fails
**Causes**: Device security settings, insufficient permissions, storage corruption
**Solution**: Handle storage errors gracefully, provide fallback authentication flow

**Issue**: Network timeouts
**Causes**: Poor connectivity, server issues, firewall restrictions
**Solution**: Implement retry logic, adjust timeout values, add offline support

## Production Checklist

- [ ] API tokens stored securely using platform keychain/keystore
- [ ] HTTPS enabled for all API requests
- [ ] Certificate pinning implemented for production
- [ ] Authentication errors handled gracefully
- [ ] Token refresh/expiration logic implemented
- [ ] Rate limiting respected with exponential backoff
- [ ] Sensitive data excluded from logs and analytics
- [ ] Network timeout and retry logic implemented
- [ ] Authentication flow tested on devices
- [ ] Edge cases handled (no network, expired tokens, etc.)

---

**Next Steps**: [Rate Limits & Tiers Guide](./rate-limits.md) | [API Reference](../api-reference/)
