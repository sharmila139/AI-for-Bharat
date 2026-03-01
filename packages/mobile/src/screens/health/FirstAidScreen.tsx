import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FirstAidScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>First Aid Assistant</Text>
      <Text style={styles.subtitle}>AI-guided emergency first aid instructions</Text>
      <Text style={styles.placeholder}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
});

export default FirstAidScreen;
