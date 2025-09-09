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
  ActivityIndicator
} from 'react-native';
import Modal from 'react-native-modal';

// Axeptio Configuration
const PROJECT_ID = '67fcdb2b52ab9a99a5865f4d';
const API_BASE = 'https://staging-api.axeptio.tech/mobile';
const TEST_API_TOKEN = 'project_67fcdb2b52ab9a99a5865f4d_test_token'; // Authorized token for this project

// Mock vendors since project config is empty
const VENDORS = {
  google_analytics: { name: 'Google Analytics', description: 'Usage statistics and analytics' },
  facebook_pixel: { name: 'Facebook Pixel', description: 'Ad targeting and conversion tracking' },
  mixpanel: { name: 'Mixpanel', description: 'Product analytics and user behavior' }
};

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState({
    google_analytics: false,
    facebook_pixel: false,
    mixpanel: false
  });
  const [consentStatus, setConsentStatus] = useState('Not Set');
  const [lastConsentId, setLastConsentId] = useState(null);
  const [configId, setConfigId] = useState(null);

  // Fetch configuration on mount
  useEffect(() => {
    fetchConfiguration();
  }, []);

  // Toggle individual vendor
  const toggleVendor = (vendorKey) => {
    setVendors(prev => ({
      ...prev,
      [vendorKey]: !prev[vendorKey]
    }));
  };

  // Accept all vendors
  const acceptAll = () => {
    const allAccepted = Object.keys(VENDORS).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setVendors(allAccepted);
  };

  // Reject all vendors
  const rejectAll = () => {
    const allRejected = Object.keys(VENDORS).reduce((acc, key) => ({
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
    
    const consent = {
      accept: true,
      preferences: {
        vendors: {
          google_analytics: isAcceptAll || vendors.google_analytics,
          facebook_pixel: isAcceptAll || vendors.facebook_pixel,
          mixpanel: isAcceptAll || vendors.mixpanel
        }
      },
      token: `mobile_user_${Date.now()}`
    };

    try {
      const response = await fetch(
        `${API_BASE}/consents/${PROJECT_ID}/cookies/${currentConfigId}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${TEST_API_TOKEN}`
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
        setConsentStatus(isAcceptAll ? '✅ All Accepted' : '⚙️ Custom Preferences');
        setLastConsentId(parsedData.id || 'saved');
        Alert.alert(
          '✅ Success', 
          `Consent saved successfully!\n\nStatus: ${response.status}\nID: ${parsedData.id || 'N/A'}`
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
        `${API_BASE}/configurations/${PROJECT_ID}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${TEST_API_TOKEN}`
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

  // Check auth status
  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/auth/me`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${TEST_API_TOKEN}`
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
        <Text style={styles.infoText}>Project ID: {PROJECT_ID}</Text>
        <Text style={styles.infoText}>Environment: Staging</Text>
        <Text style={styles.infoText}>Collection: cookies</Text>
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
          onPress={checkAuth}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>🔐 Check Auth</Text>
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
          
          <ScrollView style={styles.vendorList} showsVerticalScrollIndicator={false}>
            {Object.entries(VENDORS).map(([key, vendor]) => (
              <View key={key} style={styles.vendorItem}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.vendorDesc}>{vendor.description}</Text>
                </View>
                <Switch
                  value={vendors[key]}
                  onValueChange={() => toggleVendor(key)}
                  trackColor={{ false: '#ddd', true: '#32C832' }}
                  thumbColor={vendors[key] ? '#fff' : '#f4f3f4'}
                  disabled={loading}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.quickActions}>
            <TouchableOpacity onPress={acceptAll} disabled={loading}>
              <Text style={styles.quickActionText}>✓ Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={rejectAll} disabled={loading}>
              <Text style={styles.quickActionText}>✗ Deselect All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={() => submitConsent(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Accept All</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => submitConsent(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Save My Choices</Text>
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
    maxHeight: '80%'
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
    maxHeight: 250,
    paddingHorizontal: 20
  },
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
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
  }
});