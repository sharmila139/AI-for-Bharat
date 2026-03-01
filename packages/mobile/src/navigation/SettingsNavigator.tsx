import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import settings screens
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AppSettingsScreen from '../screens/AppSettingsScreen';
import AboutScreen from '../screens/AboutScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  AppSettings: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  AccessibilitySettings: undefined;
  About: undefined;
  HelpSupport: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      {/* Placeholder screens for future implementation */}
      <Stack.Screen 
        name="NotificationSettings" 
        component={PlaceholderScreen} 
        options={{ title: 'Notification Settings' }}
      />
      <Stack.Screen 
        name="LanguageSettings" 
        component={PlaceholderScreen}
        options={{ title: 'Language Settings' }}
      />
      <Stack.Screen 
        name="AccessibilitySettings" 
        component={PlaceholderScreen}
        options={{ title: 'Accessibility Settings' }}
      />
      <Stack.Screen 
        name="HelpSupport" 
        component={PlaceholderScreen}
        options={{ title: 'Help & Support' }}
      />
    </Stack.Navigator>
  );
};

// Placeholder component for screens not yet implemented
const PlaceholderScreen: React.FC = () => {
  const React = require('react');
  const { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } = require('react-native');
  const { useNavigation } = require('@react-navigation/native');
  
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.description}>
          This feature is under development and will be available in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = require('react-native').StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SettingsNavigator;
