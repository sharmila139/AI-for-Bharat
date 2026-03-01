# Loading States and Error Handling Implementation Guide

## Overview

This document provides examples of how to use the LoadingState, ErrorBoundary, and ErrorState components throughout the RuralConnect AI mobile app.

## Components

### 1. LoadingState

Reusable loading spinner with optional message.

**Props**:
- `message?: string` - Optional loading message
- `size?: 'small' | 'large'` - Spinner size (default: 'large')
- `color?: string` - Spinner color (default: '#2196F3')
- `variant?: 'center' | 'inline'` - Display variant (default: 'center')
- `style?: ViewStyle` - Custom styles

### 2. ErrorBoundary

Catches JavaScript errors in component tree and displays fallback UI.

**Props**:
- `children: ReactNode` - Child components to wrap
- `fallback?: ReactNode` - Custom fallback UI (optional)
- `onError?: (error: Error, errorInfo: ErrorInfo) => void` - Error callback

### 3. ErrorState

Displays error messages with retry options.

**Props**:
- `type?: ErrorType` - Error type: 'network' | 'server' | 'unknown' | 'notFound' | 'unauthorized'
- `message?: string` - Custom error message (overrides default)
- `onRetry?: () => void` - Retry callback
- `retryLabel?: string` - Retry button label (default: 'Try Again')
- `style?: ViewStyle` - Custom styles

## Usage Examples

### Example 1: Screen with Loading and Error States

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LoadingState, ErrorState } from '../components';
import { fetchCropRecommendations } from '../services/agriculture';

const CropRecommendationsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const recommendations = await fetchCropRecommendations();
      setData(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Loading state
  if (loading) {
    return <LoadingState message="Loading crop recommendations..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        type="network"
        message={error}
        onRetry={loadData}
      />
    );
  }

  // Success state
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crop Recommendations</Text>
      {/* Render data */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
  },
});

export default CropRecommendationsScreen;
```

### Example 2: Inline Loading State

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LoadingState } from '../components';

const SyncButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await performSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      {syncing ? (
        <LoadingState
          variant="inline"
          size="small"
          message="Syncing..."
        />
      ) : (
        <TouchableOpacity onPress={handleSync} style={styles.button}>
          <Text style={styles.buttonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
```

### Example 3: Error Boundary Wrapper

```typescript
// App.tsx or navigation setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ErrorBoundary } from './components';
import RootNavigator from './navigation/RootNavigator';

const App: React.FC = () => {
  const handleError = (error: Error, errorInfo: any) => {
    // Log to error tracking service (e.g., Sentry)
    console.error('App Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default App;
```

### Example 4: Screen-Level Error Boundary

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../components';
import ComplexComponent from './ComplexComponent';

const HealthScreen: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load health module. Please try again later.
          </Text>
        </View>
      }
    >
      <ComplexComponent />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HealthScreen;
```

### Example 5: Different Error Types

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import { ErrorState } from '../components';

const ExampleScreen: React.FC = () => {
  const [errorType, setErrorType] = useState<'network' | 'server' | 'unauthorized'>('network');

  const handleRetry = () => {
    // Retry logic
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Network Error */}
      <ErrorState
        type="network"
        onRetry={handleRetry}
      />

      {/* Server Error */}
      <ErrorState
        type="server"
        message="Our servers are currently under maintenance. Please try again in a few minutes."
        onRetry={handleRetry}
      />

      {/* Unauthorized Error */}
      <ErrorState
        type="unauthorized"
        retryLabel="Login"
        onRetry={() => navigation.navigate('Login')}
      />

      {/* Not Found Error */}
      <ErrorState
        type="notFound"
        message="The crop you're looking for doesn't exist in our database."
      />

      {/* Custom Error */}
      <ErrorState
        type="unknown"
        message="Failed to upload soil photo. Please check your internet connection."
        onRetry={handleRetry}
      />
    </View>
  );
};
```

### Example 6: Combined Pattern (Recommended)

```typescript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { ErrorBoundary, LoadingState, ErrorState } from '../components';
import { fetchData } from '../services/api';

interface DataScreenProps {
  // props
}

const DataScreen: React.FC<DataScreenProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const result = await fetchData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState message="Loading data..." />;
    }

    if (error) {
      return (
        <ErrorState
          type="network"
          message={error}
          onRetry={() => loadData()}
        />
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Render your data here */}
      </ScrollView>
    );
  };

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </ErrorBoundary>
  );
};

export default DataScreen;
```

## Integration with Existing Screens

### Dashboard Screen

Already integrated with OfflineIndicator. Add ErrorBoundary:

```typescript
// In App.tsx or RootNavigator
<ErrorBoundary>
  <DashboardScreen />
</ErrorBoundary>
```

### Profile Screen

Add loading and error states:

```typescript
const ProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... existing code

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (error) {
    return <ErrorState type="network" onRetry={loadProfile} />;
  }

  // ... existing render
};
```

### Settings Screen

Wrap with ErrorBoundary:

```typescript
const SettingsScreen: React.FC = () => {
  return (
    <ErrorBoundary>
      {/* Existing settings content */}
    </ErrorBoundary>
  );
};
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap major sections of your app with ErrorBoundary:
- Root level (App.tsx)
- Screen level (each major screen)
- Complex component level

### 2. Provide Meaningful Loading Messages

```typescript
// Good
<LoadingState message="Analyzing soil health..." />

// Bad
<LoadingState message="Loading..." />
```

### 3. Handle Different Error Types

Use appropriate error types for better UX:
- `network`: Connection issues
- `server`: Backend problems
- `unauthorized`: Authentication required
- `notFound`: Resource doesn't exist
- `unknown`: Unexpected errors

### 4. Always Provide Retry Options

```typescript
<ErrorState
  type="network"
  onRetry={loadData}  // Always provide retry
/>
```

### 5. Log Errors for Debugging

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to analytics/error tracking
    console.error('Error:', error);
    // Send to Sentry, Firebase, etc.
  }}
>
  {children}
</ErrorBoundary>
```

### 6. Use Inline Loading for Small Actions

```typescript
// For buttons, small sections
<LoadingState variant="inline" size="small" message="Saving..." />

// For full screens
<LoadingState variant="center" size="large" message="Loading data..." />
```

## Testing

### Test Loading States

```typescript
import { render } from '@testing-library/react-native';
import { LoadingState } from '../components';

test('renders loading state with message', () => {
  const { getByText } = render(
    <LoadingState message="Loading..." />
  );
  expect(getByText('Loading...')).toBeTruthy();
});
```

### Test Error States

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../components';

test('calls onRetry when retry button pressed', () => {
  const onRetry = jest.fn();
  const { getByText } = render(
    <ErrorState type="network" onRetry={onRetry} />
  );
  
  fireEvent.press(getByText('Try Again'));
  expect(onRetry).toHaveBeenCalled();
});
```

### Test Error Boundaries

```typescript
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../components';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches errors and displays fallback', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(getByText(/Something went wrong/i)).toBeTruthy();
});
```

## Summary

These components provide a consistent, user-friendly way to handle loading and error states throughout the app:

- **LoadingState**: Shows progress during async operations
- **ErrorBoundary**: Catches and handles React errors gracefully
- **ErrorState**: Displays user-friendly error messages with retry options

Use them consistently across all screens for a polished, professional user experience.
