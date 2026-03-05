import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components';
// import { AccessibilityProvider } from './src/contexts/AccessibilityContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const handleError = (error: Error, errorInfo: any) => {
    // Log to error tracking service (e.g., Sentry, Firebase Crashlytics)
    console.error('App Error:', error, errorInfo);
    // TODO: Send to error tracking service
  };

  return (
    <ErrorBoundary onError={handleError}>
      {/* <AccessibilityProvider> */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1a1a1a' : '#ffffff'}
              />
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      {/* </AccessibilityProvider> */}
    </ErrorBoundary>
  );
}

export default App;
