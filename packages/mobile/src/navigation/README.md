# Navigation Structure

This directory contains the complete navigation setup for RuralConnect AI mobile app using React Navigation.

## Architecture

```
RootNavigator (Stack)
├── Auth Stack (for login/signup)
│   ├── PhoneInput
│   ├── OTPVerification
│   └── ProfileSetup
└── Main Navigator (Bottom Tabs)
    ├── Agriculture Tab (Stack)
    │   ├── AgricultureHome
    │   ├── CropRecommendation
    │   ├── SoilAnalysis
    │   ├── SoilHealthCardOCR
    │   ├── WeatherDashboard
    │   ├── KnowledgeBaseSearch
    │   └── ArticleDetail
    ├── Health Tab (Stack)
    │   ├── HealthHome
    │   ├── FirstAid
    │   ├── RemedySearch
    │   ├── RemedyDetail
    │   └── NutritionTracking
    ├── Education Tab (Stack)
    │   ├── EducationHome
    │   ├── ContentLibrary
    │   ├── VideoPlayer
    │   ├── Quiz
    │   └── Progress
    └── Infrastructure Tab (Stack)
        ├── InfrastructureHome
        ├── GrievanceReport
        ├── GrievanceTracking
        ├── GrievanceDetail
        ├── CommunityPolls
        ├── PollDetail
        ├── ProjectProgress
        └── ProjectDetail
```

## Files

- **types.ts** - TypeScript type definitions for all navigators and deep linking configuration
- **RootNavigator.tsx** - Root stack navigator that handles auth flow
- **AuthNavigator.tsx** - Authentication flow (phone, OTP, profile setup)
- **MainNavigator.tsx** - Bottom tab navigator for 4 main modules
- **AgricultureNavigator.tsx** - Stack navigator for agriculture module
- **HealthNavigator.tsx** - Stack navigator for health module
- **EducationNavigator.tsx** - Stack navigator for education module
- **InfrastructureNavigator.tsx** - Stack navigator for infrastructure module

## Type-Safe Navigation

All navigation is fully type-safe using TypeScript. Example usage:

```typescript
import { useNavigation } from '@react-navigation/native';
import { AgricultureStackNavigationProp } from '../navigation/types';

const MyComponent = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  
  // Type-safe navigation with autocomplete
  navigation.navigate('ArticleDetail', { articleId: '123' });
};
```

## Deep Linking

Deep linking is configured to support URLs like:
- `ruralconnect://agriculture/crop-recommendation`
- `https://ruralconnect.app/health/remedy/123`
- `ruralconnect://infrastructure/grievance/456`

## Next Steps

1. Install react-native-vector-icons for proper tab icons
2. Implement authentication state management (Redux/Context)
3. Add loading states and error boundaries
4. Implement proper deep linking handlers
5. Add navigation analytics tracking
