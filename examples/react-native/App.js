import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Linking,
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment Configuration
const ENVIRONMENTS = {
  'local-dev': {
    name: 'Local Dev',
    url: 'http://localhost:3000/mobile'
  },
  'staging': {
    name: 'Staging',
    url: 'https://staging-api.axeptio.tech/mobile'
  },
  'production': {
    name: 'Production',
    url: 'https://headless-api.axeptio.tech/mobile'
  }
};

// Default Configuration
const DEFAULT_PROJECT_ID = '67fcdb2b52ab9a99a5865f4d';
const DEFAULT_ENVIRONMENT = 'staging';

// AsyncStorage Keys
const STORAGE_KEYS = {
  PROJECT_ID: '@axeptio_project_id',
  ENVIRONMENT: '@axeptio_environment'
};

// Mock vendors since project config is empty
const VENDORS = {
  google_analytics: { name: 'Google Analytics', description: 'Usage statistics and analytics' },
  facebook_pixel: { name: 'Facebook Pixel', description: 'Ad targeting and conversion tracking' },
  mixpanel: { name: 'Mixpanel', description: 'Product analytics and user behavior' }
};

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendors, setVendors] = useState({}); // Dynamic vendor preferences
  const [apiVendors, setApiVendors] = useState(VENDORS); // Fallback to hardcoded initially
  const [failedImages, setFailedImages] = useState(new Set()); // Track failed image loads
  const [consentStatus, setConsentStatus] = useState('Not Set');
  const [lastConsentId, setLastConsentId] = useState(null);
  const [lastConsentToken, setLastConsentToken] = useState(null); // Store last used token
  const [currentUserToken, setCurrentUserToken] = useState(null); // Persistent user token (fetched from API)
  const [configId, setConfigId] = useState(null);

  // Settings state
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [tempProjectId, setTempProjectId] = useState(DEFAULT_PROJECT_ID);
  const [tempEnvironment, setTempEnvironment] = useState(DEFAULT_ENVIRONMENT);

  // Derived values
  const apiBase = ENVIRONMENTS[environment]?.url || ENVIRONMENTS[DEFAULT_ENVIRONMENT].url;
  const apiToken = `project_${projectId}_test_token`;

  // Load settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const savedProjectId = await AsyncStorage.getItem(STORAGE_KEYS.PROJECT_ID);
      const savedEnvironment = await AsyncStorage.getItem(STORAGE_KEYS.ENVIRONMENT);

      if (savedProjectId) {
        setProjectId(savedProjectId);
        setTempProjectId(savedProjectId);
      }
      if (savedEnvironment && ENVIRONMENTS[savedEnvironment]) {
        setEnvironment(savedEnvironment);
        setTempEnvironment(savedEnvironment);
      }

      console.log('Settings loaded:', { projectId: savedProjectId || DEFAULT_PROJECT_ID, environment: savedEnvironment || DEFAULT_ENVIRONMENT });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Save settings to AsyncStorage
  const saveSettings = async (newProjectId, newEnvironment) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_ID, newProjectId);
      await AsyncStorage.setItem(STORAGE_KEYS.ENVIRONMENT, newEnvironment);
      console.log('Settings saved:', { projectId: newProjectId, environment: newEnvironment });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Fetch configuration, vendors, and token on mount or when settings change
  useEffect(() => {
    const initializeApp = async () => {
      await fetchConfiguration();
      await fetchVendors();

      // Fetch initial token from API
      try {
        const token = await fetchToken();
        setCurrentUserToken(token);
        console.log('App initialized with token:', token);
      } catch (error) {
        console.error('Failed to fetch initial token:', error);
        // App can still work, user can generate token manually
      }
    };

    // Only initialize if we have settings loaded
    if (projectId && environment) {
      initializeApp();
    }
  }, [projectId, environment]);

  // Toggle individual vendor
  const toggleVendor = (vendorKey) => {
    setVendors(prev => ({
      ...prev,
      [vendorKey]: !prev[vendorKey]
    }));
  };

  // Accept all vendors
  const acceptAll = () => {
    const allAccepted = Object.keys(apiVendors).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setVendors(allAccepted);
  };

  // Reject all vendors
  const rejectAll = () => {
    const allRejected = Object.keys(apiVendors).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), {});
    setVendors(allRejected);
  };


  // Submit consent to API
  const submitConsent = async (isAcceptAll) => {
    setLoading(true);

    // Ensure we have a configId
    let currentConfigId = configId;
    if (!currentConfigId) {
      currentConfigId = await fetchConfiguration();
      if (!currentConfigId) {
        Alert.alert('❌ Error', 'Could not fetch configuration. Please try again.');
        setLoading(false);
        return;
      }
    }

    // Ensure we have a valid token from API
    let tokenToUse = currentUserToken;
    if (!tokenToUse) {
      try {
        tokenToUse = await fetchToken();
        setCurrentUserToken(tokenToUse);
        console.log('Fetched token for consent submission:', tokenToUse);
      } catch (error) {
        Alert.alert('❌ Error', `Could not get user token:\n\n${error.message}`);
        setLoading(false);
        return;
      }
    }
    
    // Build vendor preferences dynamically
    const vendorPreferences = {};
    Object.keys(apiVendors).forEach(vendorKey => {
      const vendor = apiVendors[vendorKey];
      const formattedKey = `${vendor.id} (${vendor.name})`;
      vendorPreferences[formattedKey] = isAcceptAll || vendors[vendorKey] || false;
    });

    const consent = {
      accept: true,
      preferences: {
        config: {
          id: currentConfigId,
          language: 'en',
          identifier: currentConfigId
        },
        vendors: vendorPreferences
      },
      googleConsentMode: {
        version: 2,
        ad_storage: 'denied',
        ad_user_data: 'denied',
        analytics_storage: 'denied',
        ad_personalization: 'denied'
      },
      token: tokenToUse
    };

    // Store the token for later consent reading
    setLastConsentToken(tokenToUse);
    console.log('Using consent token:', tokenToUse);

    try {
      const response = await fetch(
        `${apiBase}/consents/${projectId}/cookies/${currentConfigId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          },
          body: JSON.stringify(consent)
        }
      );
      
      const responseData = await response.text();
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = { message: responseData };
      }

      if (response.ok || response.status === 201) {
        // Try to find the consent ID in various possible fields
        const consentId = parsedData.id ||
                         parsedData._id ||
                         parsedData.consentId ||
                         parsedData.uuid ||
                         parsedData.insertedId ||
                         'saved';

        setConsentStatus(isAcceptAll ? '✅ All Accepted' : '⚙️ Custom Preferences');
        setLastConsentId(consentId);
        Alert.alert(
          '✅ Success',
          `Consent saved successfully!\n\nStatus: ${response.status}\nID: ${consentId === 'saved' ? 'N/A' : consentId}\nToken: ${tokenToUse}`
        );
      } else {
        Alert.alert(
          '⚠️ API Response', 
          `Status: ${response.status}\n\n${JSON.stringify(parsedData, null, 2)}`
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to save consent:\n\n${error.message}`);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  // Fetch configuration to get configId
  const fetchConfiguration = async () => {
    try {
      const response = await fetch(
        `${apiBase}/configurations/${projectId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.defaultConfigId) {
          setConfigId(data.defaultConfigId);
          return data.defaultConfigId;
        }
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    }
    return null;
  };

  // Fetch vendors from API
  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const response = await fetch(
        `${apiBase}/vendors/${projectId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (response.ok) {
        const vendorData = await response.json();
        if (vendorData && vendorData.vendors && Array.isArray(vendorData.vendors)) {
          // Transform API response with simplified vendor data
          const vendorMap = {};
          const vendorPreferences = {};

          vendorData.vendors.forEach(vendor => {
            const vendorKey = `${vendor.id} (${vendor.title || vendor.name})`;
            vendorMap[vendorKey] = {
              id: vendor.id,
              name: vendor.title || vendor.name,
              description: vendor.description || 'No description available',
              image: vendor.image
            };
            vendorPreferences[vendorKey] = false; // Default to not accepted

          });

          setApiVendors(vendorMap);
          setVendors(vendorPreferences);
          console.log(`Successfully loaded ${vendorData.vendors.length} vendors from API`);
          setVendorsLoading(false);
          return vendorMap;
        }
      } else {
        console.warn(`Failed to fetch vendors: ${response.status} ${response.statusText}`);
        // Fallback to hardcoded vendors
        const hardcodedPreferences = Object.keys(VENDORS).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {});
        setVendors(hardcodedPreferences);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      // Fallback to hardcoded vendors on error
      const hardcodedPreferences = Object.keys(VENDORS).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {});
      setVendors(hardcodedPreferences);
    } finally {
      setVendorsLoading(false);
    }
    return null;
  };

  // Fetch a new user token from the API
  const fetchToken = async () => {
    try {
      const response = await fetch(
        `${apiBase}/token`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('Fetched new token from API:', data.token);
          return data.token;
        } else {
          throw new Error('Token not found in API response');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to fetch token:', error);
      throw error;
    }
  };

  // Generate a new user token using the API
  const generateNewToken = async () => {
    setLoading(true);
    try {
      const newToken = await fetchToken();
      setCurrentUserToken(newToken);
      setLastConsentToken(null); // Clear last consent token since we have a new user
      Alert.alert(
        '🔄 New Token Generated',
        `New user token: ${newToken}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        '❌ Token Generation Failed',
        `Could not generate new token:\n\n${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Check auth status
  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiBase}/auth/me`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          '✅ Auth Status',
          `Project: ${data.projectId}\nTier: ${data.tier}\nAuthorized: ${data.authorized}`,
          [{ text: 'OK' }]
        );
      } else {
        const errorText = await response.text();
        Alert.alert(
          '❌ Auth Failed',
          `Status: ${response.status}\n${errorText}`
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Could not check auth:\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check existing consent status
  const checkConsentStatus = async () => {
    if (!lastConsentToken) {
      Alert.alert(
        '📋 No Token Available',
        'No consent has been submitted yet. Please submit a consent first to check its status.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    // Ensure we have a configId for the query parameters
    let currentConfigId = configId;
    if (!currentConfigId) {
      currentConfigId = await fetchConfiguration();
      if (!currentConfigId) {
        Alert.alert('❌ Error', 'Could not fetch configuration. Please try again.');
        setLoading(false);
        return;
      }
    }
    console.log('=== CONSENT READ REQUEST ===');
    console.log('Reading consent with token:', lastConsentToken);
    console.log('Request URL:', `${apiBase}/client/${projectId}/consents/${lastConsentToken}?identifier=${currentConfigId}&service=cookies`);
    console.log('============================');

    try {
      // Use the correct API endpoint format: /mobile/client/{projectId}/consents/{token}?identifier={configId}&service=cookies
      const response = await fetch(
        `${apiBase}/client/${projectId}/consents/${lastConsentToken}?identifier=${currentConfigId}&service=cookies`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('=== CONSENT READ API RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Token used:', lastConsentToken);
        console.log('Response data:', JSON.stringify(data, null, 2));
        console.log('================================');

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          const vendorCount = Object.keys(data.preferences?.vendors || {}).length;
          const acceptedVendors = Object.values(data.preferences?.vendors || {}).filter(Boolean).length;

          const consentInfo = `Consent Found!\n\nAccepted: ${data.accept ? 'Yes' : 'No'}\nTotal Vendors: ${vendorCount}\nAccepted Vendors: ${acceptedVendors}\nToken: ${lastConsentToken}\nTimestamp: ${data.createdAt || data.timestamp || 'Unknown'}\nID: ${data.id || data._id || 'Unknown'}`;

          Alert.alert(
            '📋 Consent Status',
            consentInfo,
            [{ text: 'OK' }]
          );
        } else {
          console.log('❌ Empty or invalid response data');
          Alert.alert(
            '📋 No Consent Found',
            'No existing consent found for this token.',
            [{ text: 'OK' }]
          );
        }
      } else if (response.status === 404) {
        const errorText = await response.text();
        console.log('❌ 404 - No consent found for token:', lastConsentToken);
        console.log('404 Response body:', errorText);
        Alert.alert(
          '📋 No Consent Found',
          `No existing consent found for token: ${lastConsentToken}`,
          [{ text: 'OK' }]
        );
      } else {
        const errorText = await response.text();
        console.log('❌ API Error - Status:', response.status, 'Response:', errorText);
        Alert.alert(
          '❌ Error',
          `Status: ${response.status}\n${errorText}`
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', `Could not check consent status:\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open settings modal
  const openSettings = () => {
    setTempProjectId(projectId);
    setTempEnvironment(environment);
    setSettingsModalVisible(true);
  };

  // Save settings
  const handleSaveSettings = async () => {
    // Validate project ID
    if (!tempProjectId || tempProjectId.trim() === '') {
      Alert.alert('Validation Error', 'Project ID cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await saveSettings(tempProjectId, tempEnvironment);
      setProjectId(tempProjectId);
      setEnvironment(tempEnvironment);
      setSettingsModalVisible(false);

      // Reset app state when settings change
      setConfigId(null);
      setCurrentUserToken(null);
      setLastConsentToken(null);
      setLastConsentId(null);
      setConsentStatus('Not Set');

      Alert.alert('Settings Saved', 'App will reinitialize with new settings');
    } catch (error) {
      Alert.alert('Error', `Failed to save settings:\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel settings changes
  const handleCancelSettings = () => {
    setTempProjectId(projectId);
    setTempEnvironment(environment);
    setSettingsModalVisible(false);
  };

  // Reset to default settings
  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset to default settings (Staging environment)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setTempProjectId(DEFAULT_PROJECT_ID);
            setTempEnvironment(DEFAULT_ENVIRONMENT);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Axeptio React Native Demo</Text>
        <Text style={styles.subtitle}>Headless CMP Widget Example</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Consent Status:</Text>
        <Text style={styles.statusValue}>{consentStatus}</Text>
        {lastConsentId && (
          <Text style={styles.consentId}>ID: {lastConsentId}</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📡 API Configuration</Text>
        <Text style={styles.infoText}>Project ID: {projectId}</Text>
        <Text style={styles.infoText}>Config ID: {configId || 'Loading...'}</Text>
        <Text style={styles.infoText}>Environment: {ENVIRONMENTS[environment]?.name || 'Unknown'}</Text>
        <Text style={styles.infoText}>Collection: cookies</Text>
        <Text style={styles.infoText}>User Token: {currentUserToken || 'Loading...'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>⚙️ Manage Consent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={checkConsentStatus}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>📋 Check Consent Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={checkAuth}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>🔐 Check Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={generateNewToken}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>🔄 Generate New Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={openSettings}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#32C832" style={styles.loader} />
      )}

      <Modal 
        isVisible={modalVisible} 
        onBackdropPress={() => !loading && setModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🍪 Privacy Settings</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDesc}>
            We use cookies and similar technologies to improve your experience.
            Choose which services can process your data.
          </Text>

          <ScrollView
            style={styles.vendorList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.vendorListContent}
          >
            {vendorsLoading ? (
              <View style={styles.vendorLoading}>
                <ActivityIndicator size="large" color="#32C832" />
                <Text style={styles.loadingText}>Loading vendors...</Text>
              </View>
            ) : (
              Object.entries(apiVendors).map(([key, vendor]) => (
                <View key={key} style={styles.vendorItem}>
                  <View style={styles.vendorRow}>
                    {(vendor.image?.optimized?.small || vendor.image?.optimized?.medium || vendor.image?.fallbackUrl) && !failedImages.has(key) && (
                      <Image
                        source={{
                          uri: vendor.image?.optimized?.small ||
                               vendor.image?.optimized?.medium ||
                               vendor.image?.fallbackUrl
                        }}
                        style={styles.vendorLogo}
                        onError={() => {
                          // Mark this vendor's image as failed to avoid repeated attempts
                          setFailedImages(prev => new Set([...prev, key]));
                        }}
                      />
                    )}
                    {((vendor.image?.optimized?.small || vendor.image?.optimized?.medium || vendor.image?.fallbackUrl) && failedImages.has(key)) && (
                      <View style={[styles.vendorLogo, styles.vendorLogoPlaceholder]}>
                        <Text style={styles.vendorLogoText}>
                          {vendor.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.name}</Text>
                      <Text style={styles.vendorDesc}>{vendor.description}</Text>
                    </View>
                    <Switch
                      value={vendors[key] || false}
                      onValueChange={() => toggleVendor(key)}
                      trackColor={{ false: '#ddd', true: '#32C832' }}
                      thumbColor={vendors[key] ? '#fff' : '#f4f3f4'}
                      disabled={loading || vendorsLoading}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.quickActions}>
            <TouchableOpacity onPress={acceptAll} disabled={loading || vendorsLoading}>
              <Text style={styles.quickActionText}>✓ Accept All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={rejectAll} disabled={loading || vendorsLoading}>
              <Text style={styles.quickActionText}>✗ Reject All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => submitConsent(false)}
              disabled={loading || vendorsLoading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save My Choices</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={settingsModalVisible}
        onBackdropPress={() => !loading && handleCancelSettings()}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity
              onPress={handleCancelSettings}
              disabled={loading}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            <Text style={[styles.settingLabel, { marginTop: 8 }]}>Project ID</Text>
            <TextInput
              style={styles.textInput}
              value={tempProjectId}
              onChangeText={setTempProjectId}
              placeholder="Enter project ID"
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.settingLabel}>Environment</Text>
            <View style={styles.environmentSelector}>
              {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.environmentOption,
                    tempEnvironment === key && styles.environmentOptionSelected
                  ]}
                  onPress={() => setTempEnvironment(key)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.environmentOptionText,
                      tempEnvironment === key && styles.environmentOptionTextSelected
                    ]}
                  >
                    {env.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetSettings}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.settingsActions}>
            <TouchableOpacity
              style={[styles.settingsButton, styles.cancelButton]}
              onPress={handleCancelSettings}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsButton, styles.saveButton]}
              onPress={handleSaveSettings}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50'
  },
  consentId: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 3
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12
  },
  primaryButton: {
    backgroundColor: '#32C832',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  secondaryButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600'
  },
  loader: {
    marginTop: 20
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '85%',
    flex: 1,
    marginVertical: 50
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
    padding: 5
  },
  modalDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    paddingHorizontal: 20,
    paddingVertical: 15,
    lineHeight: 20
  },
  vendorList: {
    flex: 1,
    marginBottom: 10
  },
  vendorListContent: {
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  vendorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  vendorLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#f5f5f5'
  },
  vendorLogoPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  vendorLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666'
  },
  vendorInfo: {
    flex: 1,
    marginRight: 10
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2
  },
  vendorDesc: {
    fontSize: 12,
    color: '#95a5a6'
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  quickActionText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500'
  },
  modalButtons: {
    padding: 20,
    gap: 10
  },
  acceptButton: {
    backgroundColor: '#32C832',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#7f8c8d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  vendorLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d'
  },
  settingsContent: {
    maxHeight: 400,
    paddingHorizontal: 20
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 20
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 4
  },
  environmentSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8
  },
  environmentOption: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  environmentOptionSelected: {
    backgroundColor: '#32C832',
    borderColor: '#32C832'
  },
  environmentOptionText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600'
  },
  environmentOptionTextSelected: {
    color: 'white',
    fontWeight: '700'
  },
  resetButton: {
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    alignItems: 'center'
  },
  resetButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600'
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  settingsButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#d0d0d0'
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 15,
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: '#32C832'
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600'
  }
});