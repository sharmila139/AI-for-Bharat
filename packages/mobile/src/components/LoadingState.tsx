/**
 * LoadingState Component
 * Reusable loading spinner with optional message
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  variant?: 'center' | 'inline';
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  color = '#2196F3',
  variant = 'center',
  style,
}) => {
  const containerStyle = variant === 'center' ? styles.centerContainer : styles.inlineContainer;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, variant === 'inline' && styles.inlineMessage]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inlineMessage: {
    marginTop: 0,
    marginLeft: 10,
    fontSize: 14,
  },
});

export default LoadingState;
