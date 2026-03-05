import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  theme: 'default' | 'high-contrast' | 'dark' | 'light';
  textToSpeech: boolean;
  screenReader: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleHighContrast: () => void;
  toggleTextToSpeech: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const FONT_SIZES = ['small', 'medium', 'large', 'extra-large'] as const;

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }
    return {
      fontSize: 'medium',
      highContrast: false,
      theme: 'default',
      textToSpeech: false,
      screenReader: false,
    };
  });

  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // Apply settings to document
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-high-contrast', settings.highContrast.toString());
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const speak = (text: string) => {
    if (!settings.textToSpeech || !speechSynthesis) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setCurrentUtterance(null);
    }
  };

  const increaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(settings.fontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      updateSettings({ fontSize: FONT_SIZES[currentIndex + 1] });
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSettings({ fontSize: FONT_SIZES[currentIndex - 1] });
    }
  };

  const toggleHighContrast = () => {
    const newValue = !settings.highContrast;
    updateSettings({
      highContrast: newValue,
      theme: newValue ? 'high-contrast' : 'default'
    });
  };

  const toggleTextToSpeech = () => {
    const newValue = !settings.textToSpeech;
    updateSettings({ textToSpeech: newValue });
    if (!newValue) {
      stopSpeaking();
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        speak,
        stopSpeaking,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        toggleTextToSpeech,
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
