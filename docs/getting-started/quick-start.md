# 5-Minute Quick Start Guide

Get your first headless consent management integration running in minutes with this streamlined guide.

## Prerequisites

- Mobile development environment (Xcode, Android Studio, or cross-platform framework)
- Axeptio account with API access
- Basic knowledge of REST APIs

## Step 1: Get Your Credentials

1. **Log into Axeptio Dashboard**: Visit [dashboard.axept.io](https://dashboard.axept.io)
2. **Create or Select Project**: Choose your mobile app project
3. **Get API Credentials**:
   - **Project ID**: Found in project settings
   - **API Token**: Generated in API section
   - **Base URL**: `https://api.axept.io/v1/`

> ⚠️ **Security Note**: Store credentials securely using your platform's secure storage (Keychain/Keystore)

## Step 2: First API Call

Test your integration with a simple project configuration request:

### cURL Example

```bash
curl -X GET "https://api.axept.io/v1/vault/project/YOUR_PROJECT_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Response

```json
{
  "id": "your_project_id",
  "name": "My Mobile App",
  "cookies": [...],
  "configuration": {
    "websiteURL": "https://myapp.com",
    "privacyPolicyURL": "https://myapp.com/privacy"
  }
}
```

## Step 3: Platform-Specific Integration

Choose your mobile platform for a quick integration:

### iOS (Swift)

```swift
import Foundation

class AxeptioClient {
    private let baseURL = "https://api.axept.io/v1"
    private let apiToken = "YOUR_API_TOKEN"

    func getProjectConfig(projectId: String) async throws -> ProjectConfig {
        let url = URL(string: "\(baseURL)/vault/project/\(projectId)")!
        var request = URLRequest(url: url)
        request.addValue("Bearer \(apiToken)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(ProjectConfig.self, from: data)
    }
}

// Usage
let client = AxeptioClient()
let config = try await client.getProjectConfig(projectId: "YOUR_PROJECT_ID")
```

### Android (Kotlin)

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient

interface AxeptioAPI {
    @GET("vault/project/{projectId}")
    suspend fun getProjectConfig(
        @Path("projectId") projectId: String
    ): Response<ProjectConfig>
}

class AxeptioClient {
    private val api = Retrofit.Builder()
        .baseUrl("https://api.axept.io/v1/")
        .client(
            OkHttpClient.Builder()
                .addInterceptor { chain ->
                    val request = chain.request().newBuilder()
                        .addHeader("Authorization", "Bearer YOUR_API_TOKEN")
                        .build()
                    chain.proceed(request)
                }
                .build()
        )
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(AxeptioAPI::class.java)

    suspend fun getProjectConfig(projectId: String) =
        api.getProjectConfig(projectId)
}
```

### React Native (JavaScript)

```javascript
class AxeptioClient {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = "https://api.axept.io/v1";
  }

  async getProjectConfig(projectId) {
    const response = await fetch(`${this.baseURL}/vault/project/${projectId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }
}

// Usage
const client = new AxeptioClient("YOUR_API_TOKEN");
const config = await client.getProjectConfig("YOUR_PROJECT_ID");
```

## Step 4: Collect Your First Consent

Once you have project configuration, collect user consent:

### Basic Consent Collection

```javascript
// Example for all platforms (adapt syntax as needed)
const consentData = {
  accept: true,
  preferences: {
    vendors: {
      google_analytics: true,
      facebook_pixel: false,
      marketing_cookies: true,
    },
  },
  token: "unique_user_identifier",
};

// POST to: /v1/app/consents/{clientId}/cookies/{configId}
```

### Platform Examples

#### iOS Swift

```swift
func submitConsent(consent: ConsentRequest) async throws {
    let url = URL(string: "\(baseURL)/app/consents/\(projectId)/cookies/default")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("Bearer \(apiToken)", forHTTPHeaderField: "Authorization")
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(consent)

    let (_, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 201 else {
        throw ConsentError.submissionFailed
    }
}
```

#### Android Kotlin

```kotlin
@POST("app/consents/{clientId}/cookies/{configId}")
suspend fun submitConsent(
    @Path("clientId") clientId: String,
    @Path("configId") configId: String = "default",
    @Body consent: ConsentRequest
): Response<ConsentResponse>
```

## Step 5: Test Your Integration

### Development Checklist

- [ ] API credentials are working
- [ ] Project configuration loads successfully
- [ ] Consent submission returns success (201 status)
- [ ] Stored consent can be retrieved
- [ ] Error handling works for network failures

### Test with Sample Data

```json
{
  "accept": true,
  "preferences": {
    "vendors": {
      "analytics": true,
      "marketing": false,
      "functional": true
    }
  },
  "token": "test_user_123",
  "metadata": {
    "platform": "ios",
    "appVersion": "1.0.0",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## Next Steps

Congratulations! You have a basic integration running. Here's what to do next:

### 1. Complete Platform Integration

- **[iOS Complete Guide](../mobile-integration/ios-swift.md)** - Advanced iOS patterns
- **[Android Complete Guide](../mobile-integration/android-kotlin.md)** - Android best practices
- **[React Native Guide](../mobile-integration/react-native.md)** - Cross-platform patterns
- **[Flutter Guide](../mobile-integration/flutter.md)** - Native Dart implementation

### 2. Add Advanced Features

- **Offline Support** - Queue consents when offline
- **Google Consent Mode v2** - Analytics platform integration
- **Custom UI** - Build your consent interface
- **Analytics** - Track consent performance

### 3. Production Preparation

- **Security** - Implement secure token storage
- **Error Handling** - Robust error management
- **Testing** - Comprehensive test coverage
- **Monitoring** - Track API usage and errors

### 4. Compliance & Legal

- **GDPR Compliance** - European privacy regulation
- **CCPA Compliance** - California privacy law
- **Data Retention** - Configure retention policies
- **Audit Logs** - Enable consent tracking

## Common Issues & Solutions

### Issue: Authentication Failed (401)

**Solution**: Check your API token and ensure it's properly formatted with "Bearer " prefix.

### Issue: Project Not Found (404)

**Solution**: Verify your project ID is correct and the project exists in your account.

### Issue: Rate Limited (429)

**Solution**: Implement exponential backoff retry logic and respect rate limits.

### Issue: Network Timeout

**Solution**: Add proper timeout handling and offline queue functionality.

## Getting Help

### Quick Resources

- **[Complete Mobile Guide](../mobile-integration/mobile-integration-guide.md)** - Comprehensive implementation
- **[API Reference](../api-reference/)** - All endpoints and parameters
- **[Examples Repository](../examples/)** - Production-ready code samples

### Support Channels

- **Technical Support**: [cmp-support@axeptio.eu](mailto:cmp-support@axeptio.eu)
- **GitHub Issues**: [Report bugs or request features](https://github.com/axeptio/headless-cmp/issues)
- **Community**: [Join discussions](https://github.com/axeptio/headless-cmp/discussions)

---

**🎉 Great job!** You've successfully integrated Axeptio's headless CMP into your mobile app.

[Continue with Full Integration Guide →](../mobile-integration/mobile-integration-guide.md)
