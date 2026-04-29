# React Native Integration Guide

Integrate Axeptio Headless CMP into a React Native or Expo application.

For a runnable demo, see [`examples/react-native/`](../../examples/react-native/).
For the full API spec, see [API Reference](../api-reference/overview.md).

---

## Prerequisites

- React Native 0.73+ or Expo SDK 50+
- Node.js 18+
- An Axeptio project with API credentials ([dashboard.axept.io](https://dashboard.axept.io))

### Required packages

```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install react-native-keychain   # for secure token storage
```

---

## TypeScript Types

```typescript
interface ConsentPreferences {
  vendors?: Record<string, boolean>;
  config?: {
    name?: string;
    language?: string;
    consentMode?: string;
    mobileContext?: {
      platform: string;
      offline: boolean;
      networkType?: string;
      syncBatch?: string;
    };
  };
  googleConsentMode?: GoogleConsentMode;
}

interface ConsentRequest {
  accept: boolean;
  token: string;
  preferences: ConsentPreferences;
  timestamp?: string;
  headers?: Record<string, string>;
  metadata?: {
    userAgent?: string;
    language?: string;
    timestamp?: string;
  };
}

interface ConsentResponse {
  token: string;
  accept: boolean;
  preferences: ConsentPreferences;
  createdAt: string;
}

interface GoogleConsentMode {
  version: 2;
  ad_storage: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

interface ProjectConfiguration {
  id: string;
  name: string;
  cookies: Array<{
    steps: unknown[];
    vendors: unknown[];
    language: string;
  }>;
  configuration: {
    websiteURL: string;
    privacyPolicyURL: string;
  };
}
```

---

## API Client

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://headless-api.axeptio.tech';

class AxeptioAPIClient {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'x-mobile-platform': 'react-native',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) throw new Error('NETWORK_OFFLINE');
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async generateToken(): Promise<string> {
    const { token } = await this.makeRequest<{ token: string }>('/mobile/token');
    return token;
  }

  async getConfiguration(projectId: string): Promise<ProjectConfiguration> {
    return this.makeRequest(`/mobile/configurations/${projectId}?platform=react-native`);
  }

  async submitConsent(projectId: string, configId: string, consent: ConsentRequest): Promise<ConsentResponse> {
    return this.makeRequest(`/mobile/consents/${projectId}/cookies/${configId}`, {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  }

  async getConsent(projectId: string, token: string): Promise<ConsentResponse> {
    return this.makeRequest(`/mobile/client/${projectId}/consents/${token}`);
  }
}
```

---

## ConsentProvider and useConsent Hook

Wrap your app in `ConsentProvider` and consume consent state anywhere via `useConsent`.

```typescript
import React, { useState, useEffect, useContext, createContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentContextType {
  isLoaded: boolean;
  hasConsent: boolean;
  consent: ConsentResponse | null;
  submitConsent: (preferences: ConsentPreferences) => Promise<boolean>;
  showConsentDialog: () => void;
}

const ConsentContext = createContext<ConsentContextType | null>(null);

export const ConsentProvider: React.FC<{
  projectId: string;
  configId?: string;
  apiToken: string;
  children: React.ReactNode;
}> = ({ projectId, configId = 'default', apiToken, children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [consent, setConsent] = useState<ConsentResponse | null>(null);
  const [apiClient] = useState(() => new AxeptioAPIClient(apiToken));

  useEffect(() => { loadExistingConsent(); }, []);

  const loadExistingConsent = async () => {
    try {
      const stored = await AsyncStorage.getItem(`consent_${projectId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        setHasConsent(true);
      }

      const userToken = await AsyncStorage.getItem(`consent_token_${projectId}`);
      if (userToken) {
        const apiConsent = await apiClient.getConsent(projectId, userToken);
        setConsent(apiConsent);
        setHasConsent(true);
        await AsyncStorage.setItem(`consent_${projectId}`, JSON.stringify(apiConsent));
      }
    } catch (error) {
      console.warn('Failed to load consent:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const submitConsent = async (preferences: ConsentPreferences): Promise<boolean> => {
    try {
      let token = await AsyncStorage.getItem(`consent_token_${projectId}`);
      if (!token) {
        token = await apiClient.generateToken();
        await AsyncStorage.setItem(`consent_token_${projectId}`, token);
      }

      const request: ConsentRequest = {
        accept: true,
        token,
        preferences,
        timestamp: new Date().toISOString(),
      };

      const response = await apiClient.submitConsent(projectId, configId, request);
      setConsent(response);
      setHasConsent(true);
      await AsyncStorage.setItem(`consent_${projectId}`, JSON.stringify(response));
      return true;
    } catch (error: any) {
      if (error.message === 'NETWORK_OFFLINE') {
        await ConsentQueue.enqueue(error._request, projectId);
        Alert.alert('Offline', 'Your consent will be saved when you reconnect.');
        return true;
      }
      Alert.alert('Error', 'Failed to save consent preferences.');
      return false;
    }
  };

  const showConsentDialog = () => {
    // Navigate to your consent screen or show a modal
  };

  return (
    <ConsentContext.Provider value={{ isLoaded, hasConsent, consent, submitConsent, showConsentDialog }}>
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used within ConsentProvider');
  return context;
};
```

### Usage

```typescript
// App.tsx
import { ConsentProvider } from './consent/ConsentProvider';

export default function App() {
  return (
    <ConsentProvider projectId="YOUR_PROJECT_ID" apiToken="YOUR_API_TOKEN">
      <MainNavigator />
    </ConsentProvider>
  );
}

// Any screen
import { useConsent } from './consent/ConsentProvider';

function HomeScreen() {
  const { isLoaded, hasConsent, submitConsent, showConsentDialog } = useConsent();

  useEffect(() => {
    if (isLoaded && !hasConsent) showConsentDialog();
  }, [isLoaded, hasConsent]);

  const handleAcceptAll = () =>
    submitConsent({ vendors: { google_analytics: true, facebook_pixel: true } });

  return (/* ... */);
}
```

---

## Offline Queue

Queue consent submissions when the device is offline and replay them on reconnect.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedConsent {
  id: string;
  consent: ConsentRequest;
  projectId: string;
  configId: string;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'axeptio_consent_queue';

export const ConsentQueue = {
  async enqueue(consent: ConsentRequest, projectId: string, configId = 'default'): Promise<void> {
    const queue = await ConsentQueue.getQueue();
    queue.push({
      id: Math.random().toString(36).slice(2),
      consent,
      projectId,
      configId,
      timestamp: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueue(): Promise<QueuedConsent[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async processQueue(apiClient: AxeptioAPIClient): Promise<void> {
    const queue = await ConsentQueue.getQueue();
    const failed: QueuedConsent[] = [];

    for (const item of queue) {
      try {
        await apiClient.submitConsent(item.projectId, item.configId, item.consent);
      } catch {
        if (item.retryCount < 3) {
          failed.push({ ...item, retryCount: item.retryCount + 1 });
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  },
};

// In your app startup — replay queue when online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    ConsentQueue.processQueue(apiClient);
  }
});
```

---

## Google Consent Mode v2

Map Axeptio vendor preferences to Google Consent Mode v2 signals.

```typescript
function buildGoogleConsentMode(preferences: ConsentPreferences, region = 'US'): GoogleConsentMode {
  const isEU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
    'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(region);

  const defaultDenied = isEU ? 'denied' : 'denied';
  const vendors = preferences.vendors ?? {};

  return {
    version: 2,
    ad_storage: vendors.google_ads ? 'granted' : defaultDenied,
    analytics_storage: vendors.google_analytics ? 'granted' : defaultDenied,
    ad_user_data: vendors.google_ads ? 'granted' : defaultDenied,
    ad_personalization: vendors.google_ads ? 'granted' : defaultDenied,
    functionality_storage: 'granted',
    personalization_storage: vendors.personalization ? 'granted' : defaultDenied,
    security_storage: 'granted',
  };
}

// Include in your consent submission:
const preferences: ConsentPreferences = {
  vendors: { google_analytics: true, google_ads: false },
  googleConsentMode: buildGoogleConsentMode(
    { vendors: { google_analytics: true, google_ads: false } },
    userRegion
  ),
};
```

---

## Error Handling

```typescript
async function safeSubmitConsent(preferences: ConsentPreferences): Promise<void> {
  try {
    await submitConsent(preferences);
  } catch (error: any) {
    switch (error.message) {
      case 'NETWORK_OFFLINE':
        // Already queued — nothing to do
        break;
      default:
        if (error.message.startsWith('HTTP 401')) {
          // Token invalid — re-authenticate
        } else if (error.message.startsWith('HTTP 429')) {
          // Rate limited — back off
          await new Promise(r => setTimeout(r, 60_000));
        } else {
          console.error('Consent submission failed:', error);
        }
    }
  }
}
```

---

## Secure Token Storage

Store your API token in the device keychain, not in plain AsyncStorage or constants:

```typescript
import * as Keychain from 'react-native-keychain';

const SERVICE = 'AxeptioAPI';

export const SecureStorage = {
  async storeToken(token: string): Promise<void> {
    await Keychain.setInternetCredentials(SERVICE, 'api_token', token);
  },
  async getToken(): Promise<string | null> {
    const creds = await Keychain.getInternetCredentials(SERVICE);
    return creds ? creds.password : null;
  },
  async deleteToken(): Promise<void> {
    await Keychain.resetInternetCredentials(SERVICE);
  },
};
```

---

## Further Reading

- [API Reference](../api-reference/overview.md) — full endpoint docs with request/response schemas
- [Authentication Guide](../getting-started/authentication.md) — token lifecycle, error handling
- [Mobile Integration Reference](./mobile-integration-reference.md) — iOS (Swift) and Android (Kotlin) patterns
- [Example App](../../examples/react-native/) — runnable Expo demo
