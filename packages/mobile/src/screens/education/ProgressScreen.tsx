import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProgressScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Progress</Text>
      <Text style={styles.placeholder}>Progress tracking coming soon...</Text>
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
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProgressScreen;
