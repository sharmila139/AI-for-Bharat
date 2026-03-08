import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InfrastructureStackParamList } from './types';

// Import screens
import InfrastructureHomeScreen from '../screens/infrastructure/InfrastructureHomeScreen';
import GrievanceReportScreen from '../screens/infrastructure/GrievanceReportScreen';
import GrievanceListScreen from '../screens/infrastructure/GrievanceListScreen';
import GrievanceTrackingScreen from '../screens/infrastructure/GrievanceTrackingScreen';
import GrievanceDetailScreen from '../screens/infrastructure/GrievanceDetailScreen';
import CommunityPollsScreen from '../screens/infrastructure/CommunityPollsScreen';
import PollDetailScreen from '../screens/infrastructure/PollDetailScreen';
import ProjectProgressScreen from '../screens/infrastructure/ProjectProgressScreen';
import ProjectDetailScreen from '../screens/infrastructure/ProjectDetailScreen';

const Stack = createStackNavigator<InfrastructureStackParamList>();

const InfrastructureNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#9C27B0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="InfrastructureHome"
        component={InfrastructureHomeScreen}
        options={{ title: 'Infrastructure & Civic' }}
      />
      <Stack.Screen
        name="GrievanceReport"
        component={GrievanceReportScreen}
        options={{ title: 'Report Grievance' }}
      />
      <Stack.Screen
        name="GrievanceList"
        component={GrievanceListScreen}
        options={{ title: 'My Grievances' }}
      />
      <Stack.Screen
        name="GrievanceTracking"
        component={GrievanceTrackingScreen}
        options={{ title: 'Track Grievance' }}
      />
      <Stack.Screen
        name="GrievanceDetail"
        component={GrievanceDetailScreen}
        options={{ title: 'Grievance Details' }}
      />
      <Stack.Screen
        name="CommunityPolls"
        component={CommunityPollsScreen}
        options={{ title: 'Community Polls' }}
      />
      <Stack.Screen
        name="PollDetail"
        component={PollDetailScreen}
        options={{ title: 'Poll Details' }}
      />
      <Stack.Screen
        name="ProjectProgress"
        component={ProjectProgressScreen}
        options={{ title: 'Project Progress' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Project Details' }}
      />
    </Stack.Navigator>
  );
};

export default InfrastructureNavigator;
