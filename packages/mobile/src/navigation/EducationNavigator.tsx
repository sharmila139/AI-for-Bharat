import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { EducationStackParamList } from './types';

// Import screens
import EducationHomeScreen from '../screens/education/EducationHomeScreen';
import StudentProfileScreen from '../screens/education/StudentProfileScreen';
import DiagnosticAssessmentScreen from '../screens/education/DiagnosticAssessmentScreen';
import ContentLibraryScreen from '../screens/education/ContentLibraryScreen';
import VideoPlayerScreen from '../screens/education/VideoPlayerScreen';
import QuizScreen from '../screens/education/QuizScreen';
import ProgressScreen from '../screens/education/ProgressScreen';

const Stack = createStackNavigator<EducationStackParamList>();

const EducationNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="EducationHome"
        component={EducationHomeScreen}
        options={{ title: 'Education & Skills' }}
      />
      <Stack.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{ title: 'Student Profile' }}
      />
      <Stack.Screen
        name="DiagnosticAssessment"
        component={DiagnosticAssessmentScreen}
        options={{ title: 'Diagnostic Assessment' }}
      />
      <Stack.Screen
        name="ContentLibrary"
        component={ContentLibraryScreen}
        options={{ title: 'Content Library' }}
      />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ title: 'Video Player', headerShown: false }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: 'Quiz' }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'My Progress' }}
      />
    </Stack.Navigator>
  );
};

export default EducationNavigator;
