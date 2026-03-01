import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HealthStackParamList } from './types';

// Import screens
import HealthHomeScreen from '../screens/health/HealthHomeScreen';
import SymptomInputScreen from '../screens/health/SymptomInputScreen';
import FirstAidInstructionsScreen from '../screens/health/FirstAidInstructionsScreen';
import RemedySearchScreen from '../screens/health/RemedySearchScreen';
import RemedyDetailScreen from '../screens/health/RemedyDetailScreen';
import NutritionTrackingScreen from '../screens/health/NutritionTrackingScreen';
import FirstAidScreen from '../screens/health/FirstAidScreen';
import EmergencyContactsScreen from '../screens/health/EmergencyContactsScreen';

const Stack = createStackNavigator<HealthStackParamList>();

const HealthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HealthHome"
        component={HealthHomeScreen}
        options={{ title: 'Primary Healthcare' }}
      />
      <Stack.Screen
        name="SymptomInput"
        component={SymptomInputScreen}
        options={{ title: 'Symptom Assessment' }}
      />
      <Stack.Screen
        name="FirstAidInstructions"
        component={FirstAidInstructionsScreen}
        options={{ title: 'First Aid Instructions' }}
      />
      <Stack.Screen
        name="FirstAid"
        component={FirstAidScreen}
        options={{ title: 'First Aid Assistant' }}
      />
      <Stack.Screen
        name="RemedySearch"
        component={RemedySearchScreen}
        options={{ title: 'Natural Remedies' }}
      />
      <Stack.Screen
        name="RemedyDetail"
        component={RemedyDetailScreen}
        options={{ title: 'Remedy Details' }}
      />
      <Stack.Screen
        name="NutritionTracking"
        component={NutritionTrackingScreen}
        options={{ title: 'Nutrition Tracking' }}
      />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ title: 'Emergency Contacts' }}
      />
    </Stack.Navigator>
  );
};

export default HealthNavigator;
