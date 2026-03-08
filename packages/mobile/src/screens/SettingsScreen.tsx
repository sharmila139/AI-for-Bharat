import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { logout } from '../services/auth/auth-service';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  color = '#333',
}) => {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <View style={styles.settingsTextContainer}>
          <Text style={[styles.settingsTitle, { color }]}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
};

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logout_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by RootNavigator
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert(t('common.error'), t('settings.logout_error'));
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
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="👤"
              title={t('settings.profile')}
              subtitle={t('settings.profile_subtitle')}
              onPress={() => navigation.navigate('Profile' as never)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="🔔"
              title={t('settings.notifications')}
              subtitle={t('settings.notifications_subtitle')}
              onPress={() => navigation.navigate('NotificationSettings' as never)}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app_settings')}</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="🌐"
              title={t('settings.language')}
              subtitle={t('settings.language_subtitle')}
              onPress={() => navigation.navigate('LanguageSettings' as never)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="♿"
              title={t('settings.accessibility')}
              subtitle={t('settings.accessibility_subtitle')}
              onPress={() => navigation.navigate('AccessibilitySettings' as never)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="📱"
              title={t('settings.app_settings')}
              subtitle={t('settings.app_settings_subtitle')}
              onPress={() => navigation.navigate('AppSettings' as never)}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="ℹ️"
              title={t('settings.about_app')}
              subtitle={t('settings.about_app_subtitle')}
              onPress={() => navigation.navigate('About' as never)}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="📞"
              title={t('settings.help_support')}
              subtitle={t('settings.help_support_subtitle')}
              onPress={() => navigation.navigate('HelpSupport' as never)}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('settings.footer')}
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
    width: 40,
  },
  backIcon: {
    fontSize: 32,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 56,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen;
