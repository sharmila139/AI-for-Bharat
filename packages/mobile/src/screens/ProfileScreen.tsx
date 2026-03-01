import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserData, setUserData } from '../services/auth/auth-service';
import axios from 'axios';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'
  : 'https://api.ruralconnect.app';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    village: '',
    occupation: '',
    age: '',
    gender: '',
    language: '',
  });

  const [originalProfile, setOriginalProfile] = useState(profile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (userData) {
        const profileData = {
          name: userData.name || '',
          village: userData.village || '',
          occupation: userData.occupation || '',
          age: userData.age?.toString() || '',
          gender: userData.gender || '',
          language: userData.language || '',
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!profile.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }
    if (!profile.village.trim()) {
      Alert.alert('Validation Error', 'Village is required');
      return;
    }
    if (!profile.occupation.trim()) {
      Alert.alert('Validation Error', 'Occupation is required');
      return;
    }

    try {
      setSaving(true);
      
      // Get current user data
      const userData = await getUserData();
      if (!userData) {
        throw new Error('User data not found');
      }

      // Update profile via API
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile/${userData.id}`,
        {
          name: profile.name,
          village: profile.village,
          occupation: profile.occupation,
          age: profile.age ? parseInt(profile.age) : undefined,
          gender: profile.gender || undefined,
          language: profile.language || undefined,
        }
      );

      if (response.data.success && response.data.user) {
        // Update local storage
        await setUserData(response.data.user);
        setOriginalProfile(profile);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          style={styles.editButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.phoneNumber}>
            {/* Phone number would come from user data */}
          </Text>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Enter your name"
              editable={isEditing}
            />
          </View>

          {/* Village */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Village *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.village}
              onChangeText={(text) => setProfile({ ...profile, village: text })}
              placeholder="Enter your village"
              editable={isEditing}
            />
          </View>

          {/* Occupation */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Occupation *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.occupation}
              onChangeText={(text) => setProfile({ ...profile, occupation: text })}
              placeholder="Enter your occupation"
              editable={isEditing}
            />
          </View>

          {/* Age */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.age}
              onChangeText={(text) => setProfile({ ...profile, age: text.replace(/[^0-9]/g, '') })}
              placeholder="Enter your age"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          {/* Gender */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Gender</Text>
            {isEditing ? (
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      profile.gender === option && styles.genderOptionSelected,
                    ]}
                    onPress={() => setProfile({ ...profile, gender: option })}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        profile.gender === option && styles.genderOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile.gender}
                editable={false}
              />
            )}
          </View>

          {/* Language */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Preferred Language</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.language}
              onChangeText={(text) => setProfile({ ...profile, language: text })}
              placeholder="e.g., Hindi, English"
              editable={isEditing}
            />
          </View>

          {/* Cancel Button (only shown when editing) */}
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement account deletion
                      Alert.alert('Coming Soon', 'Account deletion will be available soon.');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 32,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  scrollView: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  genderOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dangerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
});

export default ProfileScreen;
