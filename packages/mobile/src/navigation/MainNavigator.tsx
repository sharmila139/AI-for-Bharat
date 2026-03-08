import React from 'react';
import { Text, View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MainTabParamList } from './types';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AppSettingsScreen from '../screens/AppSettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';

// Import navigators
import AgricultureNavigator from './AgricultureNavigator';
import HealthNavigator from './HealthNavigator';
import EducationNavigator from './EducationNavigator';
import InfrastructureNavigator from './InfrastructureNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainTabParamList>();

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="AgricultureTab"
        component={AgricultureNavigator}
        options={{
          tabBarLabel: t('agriculture.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} label="🌾" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Agriculture Module',
          tabBarTestID: 'tab-agriculture',
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthNavigator}
        options={{
          tabBarLabel: t('health.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} label="🏥" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Health Module',
          tabBarTestID: 'tab-health',
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('common.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} label="🏠" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Home Dashboard',
          tabBarTestID: 'tab-home',
        }}
      />
      <Tab.Screen
        name="EducationTab"
        component={EducationNavigator}
        options={{
          tabBarLabel: t('education.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} label="📚" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Education Module',
          tabBarTestID: 'tab-education',
        }}
      />
      <Tab.Screen
        name="InfrastructureTab"
        component={InfrastructureNavigator}
        options={{
          tabBarLabel: t('infrastructure.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} label="🏛️" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Infrastructure and Civic Engagement Module',
          tabBarTestID: 'tab-infrastructure',
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator with Stack for Settings Screens
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      {/* Placeholder screens */}
      <Stack.Screen name="NotificationSettings" component={PlaceholderScreen} />
      <Stack.Screen name="AccessibilitySettings" component={PlaceholderScreen} />
      <Stack.Screen name="HelpSupport" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

// Enhanced icon component with focus state
const TabIcon: React.FC<{ 
  color: string; 
  label: string; 
  focused: boolean;
}> = ({ label, focused }) => {
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerFocused
    ]}>
      <Text 
        style={[
          styles.iconText,
          focused && styles.iconTextFocused
        ]}
        accessibilityRole="image"
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    transition: 'all 0.2s ease',
  },
  iconContainerFocused: {
    backgroundColor: '#E8F5E9',
    transform: [{ scale: 1.05 }],
  },
  iconText: {
    fontSize: 24,
  },
  iconTextFocused: {
    fontSize: 26,
  },
});

// Placeholder component for screens not yet implemented
const PlaceholderScreen: React.FC = () => {
  const { useNavigation } = require('@react-navigation/native');
  const navigation = useNavigation();
  
  return (
    <View style={placeholderStyles.container}>
      <View style={placeholderStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={placeholderStyles.backButton}
        >
          <Text style={placeholderStyles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>
      <View style={placeholderStyles.content}>
        <Text style={placeholderStyles.emoji}>🚧</Text>
        <Text style={placeholderStyles.title}>Coming Soon</Text>
        <Text style={placeholderStyles.description}>
          This feature is under development and will be available in a future update.
        </Text>
      </View>
    </View>
  );
};

const placeholderStyles = StyleSheet.create({
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

export default MainNavigator;
