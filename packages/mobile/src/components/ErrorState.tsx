/**
 * ErrorState Component
 * Displays error messages with retry options
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

export type ErrorType = 'network' | 'server' | 'unknown' | 'notFound' | 'unauthorized';

interface ErrorStateProps {
  type?: ErrorType;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect to the internet. Please check your connection and try again.',
  server: 'Our servers are experiencing issues. Please try again in a few moments.',
  unknown: 'An unexpected error occurred. Please try again.',
  notFound: 'The requested information could not be found.',
  unauthorized: 'You need to be logged in to access this feature.',
};

const ERROR_ICONS: Record<ErrorType, string> = {
  network: '📡',
  server: '⚠️',
  unknown: '❌',
  notFound: '🔍',
  unauthorized: '🔒',
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'unknown',
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
}) => {
  const displayMessage = message || ERROR_MESSAGES[type];
  const icon = ERROR_ICONS[type];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
    maxWidth: 350,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorState;
