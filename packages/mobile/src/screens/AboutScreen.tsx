import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', `Failed to open ${title}`);
    }
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* App Logo and Info */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🌾</Text>
          </View>
          <Text style={styles.appName}>RuralConnect AI</Text>
          <Text style={styles.tagline}>Empowering Rural India with AI</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              Version {APP_VERSION} (Build {BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT THE APP</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.aboutText}>
              RuralConnect AI is a comprehensive mobile application designed to empower rural communities through AI-driven insights across agriculture, healthcare, education, and infrastructure management.
            </Text>
            <Text style={styles.aboutText}>
              Our mission is to bridge the digital divide and provide accessible, intelligent solutions for rural India's unique challenges.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY FEATURES</Text>
          <View style={styles.sectionContent}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌾</Text>
              <Text style={styles.featureText}>Smart Agriculture</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏥</Text>
              <Text style={styles.featureText}>Primary Healthcare</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📚</Text>
              <Text style={styles.featureText}>Education & Learning</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏛️</Text>
              <Text style={styles.featureText}>Civic Engagement</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>Offline-First Design</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌐</Text>
              <Text style={styles.featureText}>Multi-Language Support</Text>
            </View>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleOpenLink('https://ruralconnect.app/terms', 'Terms of Service')}
            >
              <Text style={styles.linkText}>Terms of Service</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleOpenLink('https://ruralconnect.app/privacy', 'Privacy Policy')}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleOpenLink('https://ruralconnect.app/licenses', 'Open Source Licenses')}
            >
              <Text style={styles.linkText}>Open Source Licenses</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT & SUPPORT</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenLink('mailto:support@ruralconnect.app', 'Email')}
            >
              <Text style={styles.contactIcon}>📧</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@ruralconnect.app</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenLink('https://ruralconnect.app', 'Website')}
            >
              <Text style={styles.contactIcon}>🌐</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>ruralconnect.app</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenLink('https://github.com/ruralconnect/app', 'GitHub')}
            >
              <Text style={styles.contactIcon}>💻</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>GitHub</Text>
                <Text style={styles.contactValue}>github.com/ruralconnect</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CREDITS</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.creditsText}>
              Built with ❤️ for rural communities in India
            </Text>
            <Text style={styles.creditsText}>
              Powered by Amazon Bedrock, AWS, and React Native
            </Text>
            <Text style={styles.creditsText}>
              Special thanks to all contributors and supporters
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © 2026 RuralConnect AI. All rights reserved.
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  versionContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#666',
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
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#333',
  },
  creditsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  copyrightContainer: {
    padding: 32,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
});

export default AboutScreen;
