/**
 * Accessibility Context for Mobile App
 * Provides accessibility features throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import accessibilityService, { AccessibilitySettings } from '../services/accessibilityService';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  processVoiceCommand: (command: string) => Promise<any>;
  isScreenReaderEnabled: boolean;
  fontSizeMultiplier: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    accessibilityService.getSettings()
  );
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      accessibilityService.updateSettings(updated);
      return updated;
    });
  };

  useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      setIsScreenReaderEnabled(enabled);
      if (enabled) {
        updateSettings({ screenReader: true, textToSpeech: true });
      }
    });

    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      enabled => {
        setIsScreenReaderEnabled(enabled);
        if (enabled) {
          updateSettings({ screenReader: true, textToSpeech: true });
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const speak = (text: string) => {
    accessibilityService.speak(text);
  };

  const stopSpeaking = () => {
    accessibilityService.stopSpeaking();
  };

  const processVoiceCommand = async (command: string) => {
    return await accessibilityService.processVoiceCommand(command);
  };

  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        speak,
        stopSpeaking,
        processVoiceCommand,
        isScreenReaderEnabled,
        fontSizeMultiplier,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
