import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@ruralconnect_onboarding_completed';

/**
 * Check if the user has completed onboarding
 * @returns Promise<boolean> - true if onboarding is completed, false otherwise
 */
export const isOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 * @returns Promise<void>
 */
export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
    throw error;
  }
};

/**
 * Reset onboarding status (useful for testing)
 * @returns Promise<void>
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    throw error;
  }
};
