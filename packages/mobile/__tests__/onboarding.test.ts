import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
  resetOnboarding,
} from '../src/utils/onboarding';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Onboarding Utility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('isOnboardingCompleted', () => {
    it('should return false for new users', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await isOnboardingCompleted();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@ruralconnect_onboarding_completed'
      );
    });

    it('should return true when onboarding is completed', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const result = await isOnboardingCompleted();

      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@ruralconnect_onboarding_completed'
      );
    });

    it('should return false on storage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await isOnboardingCompleted();

      expect(result).toBe(false);
    });
  });

  describe('setOnboardingCompleted', () => {
    it('should store completion status', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await setOnboardingCompleted();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@ruralconnect_onboarding_completed',
        'true'
      );
    });

    it('should throw error on storage failure', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(setOnboardingCompleted()).rejects.toThrow('Storage error');
    });
  });

  describe('resetOnboarding', () => {
    it('should remove completion status', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await resetOnboarding();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@ruralconnect_onboarding_completed'
      );
    });

    it('should throw error on storage failure', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(error);

      await expect(resetOnboarding()).rejects.toThrow('Storage error');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete onboarding flow', async () => {
      // Initial state - not completed
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      let completed = await isOnboardingCompleted();
      expect(completed).toBe(false);

      // Complete onboarding
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      await setOnboardingCompleted();

      // Check status - should be completed
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      completed = await isOnboardingCompleted();
      expect(completed).toBe(true);

      // Reset onboarding
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      await resetOnboarding();

      // Check status - should be not completed again
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      completed = await isOnboardingCompleted();
      expect(completed).toBe(false);
    });
  });
});
