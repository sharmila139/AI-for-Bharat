import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackNavigationProp, AuthStackParamList } from '../../navigation/types';
import { createProfile } from '../../services/auth/auth-service';

type ProfileSetupRouteProp = RouteProp<AuthStackParamList, 'ProfileSetup'>;

const OCCUPATIONS = [
  'Farmer',
  'Student',
  'Teacher',
  'Health Worker',
  'Shopkeeper',
  'Artisan',
  'Daily Wage Worker',
  'Other',
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'हिंदी (Hindi)', value: 'hi' },
  { label: 'தமிழ் (Tamil)', value: 'ta' },
  { label: 'తెలుగు (Telugu)', value: 'te' },
  { label: 'বাংলা (Bengali)', value: 'bn' },
  { label: 'मराठी (Marathi)', value: 'mr' },
];

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ProfileSetupRouteProp>();
  const { userId } = route.params;

  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [occupation, setOccupation] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showOccupations, setShowOccupations] = useState(false);
  const [showGenders, setShowGenders] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const handleComplete = async () => {
    // Validate required fields
    if (!name || !village || !occupation) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createProfile(userId, {
        name,
        village,
        occupation,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
        language,
      });

      if (response.success) {
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create profile. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to main app without completing profile
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Help us personalize your experience
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            editable={!loading}
          />

          <Text style={styles.label}>
            Village/Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Village/Town, District"
            value={village}
            onChangeText={(text) => {
              setVillage(text);
              setError('');
            }}
            editable={!loading}
          />

          <Text style={styles.label}>
            Occupation <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowOccupations(!showOccupations)}
            disabled={loading}
          >
            <Text style={occupation ? styles.inputText : styles.placeholder}>
              {occupation || 'Select occupation'}
            </Text>
          </TouchableOpacity>
          {showOccupations && (
            <View style={styles.dropdown}>
              {OCCUPATIONS.map((occ) => (
                <TouchableOpacity
                  key={occ}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setOccupation(occ);
                    setShowOccupations(false);
                    setError('');
                  }}
                >
                  <Text style={styles.dropdownItemText}>{occ}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Age (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            keyboardType="number-pad"
            maxLength={3}
            value={age}
            onChangeText={setAge}
            editable={!loading}
          />

          <Text style={styles.label}>Gender (Optional)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenders(!showGenders)}
            disabled={loading}
          >
            <Text style={gender ? styles.inputText : styles.placeholder}>
              {gender || 'Select gender'}
            </Text>
          </TouchableOpacity>
          {showGenders && (
            <View style={styles.dropdown}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setGender(g);
                    setShowGenders(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Language Preference</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowLanguages(!showLanguages)}
            disabled={loading}
          >
            <Text style={styles.inputText}>
              {LANGUAGES.find((l) => l.value === language)?.label || 'English'}
            </Text>
          </TouchableOpacity>
          {showLanguages && (
            <View style={styles.dropdown}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setLanguage(lang.value);
                    setShowLanguages(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              (!name || !village || !occupation || loading) && styles.buttonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!name || !village || !occupation || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: -16,
    marginBottom: 20,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default ProfileSetupScreen;
