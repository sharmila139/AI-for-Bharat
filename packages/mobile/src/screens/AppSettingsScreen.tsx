import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@ruralconnect:app_settings';

interface AppSettings {
  offlineMode: boolean;
  autoSync: boolean;
  downloadQuality: 'low' | 'medium' | 'high';
  cacheSize: string;
}

const AppSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    offlineMode: false,
    autoSync: true,
    downloadQuality: 'medium',
    cacheSize: '0 MB',
  });

  useEffect(() => {
    loadSettings();
    calculateCacheSize();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const calculateCacheSize = async () => {
    // TODO: Implement actual cache size calculation
    // This is a placeholder
    setSettings(prev => ({ ...prev, cacheSize: '0 MB' }));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data including offline content. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement cache clearing
              // Clear Realm database cached data
              // Clear AsyncStorage cached data (except auth and settings)
              Alert.alert('Success', 'Cache cleared successfully');
              calculateCacheSize();
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Offline Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OFFLINE MODE</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Offline Mode</Text>
                <Text style={styles.settingDescription}>
                  Prioritize offline functionality and reduce data usage
                </Text>
              </View>
              <Switch
                value={settings.offlineMode}
                onValueChange={(value) => saveSettings({ offlineMode: value })}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync data when connected to internet
                </Text>
              </View>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => saveSettings({ autoSync: value })}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Download Quality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOWNLOAD QUALITY</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionDescription}>
              Choose video quality for offline downloads
            </Text>
            
            {['low', 'medium', 'high'].map((quality) => (
              <TouchableOpacity
                key={quality}
                style={styles.radioRow}
                onPress={() => saveSettings({ downloadQuality: quality as any })}
              >
                <View style={styles.radioButton}>
                  {settings.downloadQuality === quality && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.radioInfo}>
                  <Text style={styles.radioTitle}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                  <Text style={styles.radioDescription}>
                    {quality === 'low' && '360p - Saves data and storage'}
                    {quality === 'medium' && '480p - Balanced quality'}
                    {quality === 'high' && '720p - Best quality'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STORAGE</Text>
          <View style={styles.sectionContent}>
            <View style={styles.storageRow}>
              <Text style={styles.settingTitle}>Cache Size</Text>
              <Text style={styles.storageValue}>{settings.cacheSize}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.clearCacheButton}
              onPress={handleClearCache}
            >
              <Text style={styles.clearCacheText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Usage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA USAGE</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Data Used</Text>
              <Text style={styles.infoValue}>0 MB</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data Saved (Offline)</Text>
              <Text style={styles.infoValue}>0 MB</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 Tip: Enable offline mode to reduce data usage and improve app performance in low connectivity areas.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 32,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  radioInfo: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 13,
    color: '#666',
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  storageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  clearCacheButton: {
    padding: 16,
    alignItems: 'center',
  },
  clearCacheText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoSection: {
    padding: 20,
    paddingTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default AppSettingsScreen;
