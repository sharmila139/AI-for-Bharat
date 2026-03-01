import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AgricultureStackParamList } from './types';

// Import screens
import AgricultureHomeScreen from '../screens/agriculture/AgricultureHomeScreen';
import FarmProfileListScreen from '../screens/agriculture/FarmProfileListScreen';
import FarmProfileDetailScreen from '../screens/agriculture/FarmProfileDetailScreen';
import FarmProfileFormScreen from '../screens/agriculture/FarmProfileFormScreen';
import CropRecommendationInputScreen from '../screens/agriculture/CropRecommendationInputScreen';
import CropRecommendationResultsScreen from '../screens/agriculture/CropRecommendationResultsScreen';
import CropRecommendationScreen from '../screens/agriculture/CropRecommendationScreen';
import SoilAnalysisScreen from '../screens/agriculture/SoilAnalysisScreen';
import SoilHealthCardOCRScreen from '../screens/agriculture/SoilHealthCardOCRScreen';
import SoilHealthReportScreen from '../screens/agriculture/SoilHealthReportScreen';
import IrrigationScheduleScreen from '../screens/agriculture/IrrigationScheduleScreen';
import WeatherDashboardScreen from '../screens/agriculture/WeatherDashboardScreen';
import WeatherAlertsScreen from '../screens/agriculture/WeatherAlertsScreen';
import KnowledgeBaseSearchScreen from '../screens/agriculture/KnowledgeBaseSearchScreen';
import ArticleDetailScreen from '../screens/agriculture/ArticleDetailScreen';
import CropRotationPlanScreen from '../screens/agriculture/CropRotationPlanScreen';

const Stack = createStackNavigator<AgricultureStackParamList>();

const AgricultureNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AgricultureHome"
        component={AgricultureHomeScreen}
        options={{ title: 'Smart Agriculture' }}
      />
      <Stack.Screen
        name="FarmProfileList"
        component={FarmProfileListScreen}
        options={{ title: 'My Farms' }}
      />
      <Stack.Screen
        name="FarmProfileDetail"
        component={FarmProfileDetailScreen}
        options={{ title: 'Farm Details' }}
      />
      <Stack.Screen
        name="FarmProfileForm"
        component={FarmProfileFormScreen}
        options={({ route }) => ({
          title: route.params.mode === 'create' ? 'Create Farm Profile' : 'Edit Farm Profile',
        })}
      />
      <Stack.Screen
        name="CropRecommendationInput"
        component={CropRecommendationInputScreen}
        options={{ title: 'Crop Recommendation' }}
      />
      <Stack.Screen
        name="CropRecommendationResults"
        component={CropRecommendationResultsScreen}
        options={{ title: 'Crop Recommendations' }}
      />
      <Stack.Screen
        name="CropRecommendation"
        component={CropRecommendationScreen}
        options={{ title: 'Recommendations' }}
      />
      <Stack.Screen
        name="SoilAnalysis"
        component={SoilAnalysisScreen}
        options={{ title: 'Soil Analysis' }}
      />
      <Stack.Screen
        name="SoilHealthCardOCR"
        component={SoilHealthCardOCRScreen}
        options={{ title: 'Scan Soil Health Card' }}
      />
      <Stack.Screen
        name="SoilHealthReport"
        component={SoilHealthReportScreen}
        options={{ title: 'Soil Health Report' }}
      />
      <Stack.Screen
        name="IrrigationSchedule"
        component={IrrigationScheduleScreen}
        options={{ title: 'Irrigation Schedule' }}
      />
      <Stack.Screen
        name="WeatherDashboard"
        component={WeatherDashboardScreen}
        options={{ title: 'Weather Dashboard' }}
      />
      <Stack.Screen
        name="WeatherAlerts"
        component={WeatherAlertsScreen}
        options={{ title: 'Weather Alerts' }}
      />
      <Stack.Screen
        name="KnowledgeBaseSearch"
        component={KnowledgeBaseSearchScreen}
        options={{ title: 'Knowledge Base' }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ title: 'Article' }}
      />
      <Stack.Screen
        name="CropRotationPlan"
        component={CropRotationPlanScreen}
        options={{ title: 'Crop Rotation Plan' }}
      />
    </Stack.Navigator>
  );
};

export default AgricultureNavigator;
