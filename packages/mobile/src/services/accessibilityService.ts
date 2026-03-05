/**
 * Accessibility Service
 * Handles text-to-speech, voice commands, and accessibility features
 */

import apiClient from './api/client';

// For React Native, we'll use expo-speech for TTS
// import * as Speech from 'expo-speech';

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  textToSpeech: boolean;
  voiceCommands: boolean;
  screenReader: boolean;
}

export interface VoiceCommandResult {
  command: string;
  interpretation: {
    action: string;
    target: string;
    parameters: Record<string, any>;
    confidence: number;
  };
  model?: string;
  fallback?: boolean;
}

class AccessibilityService {
  private settings: AccessibilitySettings = {
    fontSize: 'medium',
    highContrast: false,
    textToSpeech: false,
    voiceCommands: false,
    screenReader: false,
  };

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update accessibility settings
   */
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(text: string, language: string = 'en'): Promise<void> {
    if (!this.settings.textToSpeech) return;

    try {
      // In a real implementation, use expo-speech:
      // await Speech.speak(text, {
      //   language,
      //   pitch: 1,
      //   rate: 0.9,
      // });

      // For now, just log
      console.log('[TTS]', text);

      // Call backend for metadata (optional)
      await apiClient.post('/api/accessibility/text-to-speech', {
        text,
        language,
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    try {
      // await Speech.stop();
      console.log('[TTS] Stopped');
    } catch (error) {
      console.error('Stop speaking error:', error);
    }
  }

  /**
   * Process voice command
   */
  async processVoiceCommand(
    command: string,
    context: Record<string, any> = {}
  ): Promise<VoiceCommandResult> {
    try {
      const response = await apiClient.post<VoiceCommandResult>(
        '/api/accessibility/voice-command',
        { command, context }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to process voice command');
    } catch (error: any) {
      console.error('Voice command error:', error);

      // Fallback to local processing
      return this.processVoiceCommandLocally(command);
    }
  }

  /**
   * Process voice command locally (fallback)
   */
  private processVoiceCommandLocally(command: string): VoiceCommandResult {
    const commandLower = command.toLowerCase();
    let action = 'unknown';
    let target = '';
    let confidence = 50;
    const parameters: Record<string, any> = {};

    if (commandLower.includes('open') || commandLower.includes('go to')) {
      action = 'navigate';
      if (commandLower.includes('health')) {
        target = 'health';
        confidence = 80;
      } else if (commandLower.includes('agriculture') || commandLower.includes('farm')) {
        target = 'agriculture';
        confidence = 80;
      } else if (commandLower.includes('education') || commandLower.includes('learn')) {
        target = 'education';
        confidence = 80;
      } else if (commandLower.includes('infrastructure') || commandLower.includes('grievance')) {
        target = 'infrastructure';
        confidence = 80;
      } else if (commandLower.includes('home')) {
        target = 'home';
        confidence = 90;
      }
    } else if (commandLower.includes('submit')) {
      action = 'submit';
      target = 'form';
      confidence = 60;
    } else if (commandLower.includes('search') || commandLower.includes('find')) {
      action = 'search';
      confidence = 65;
      // Extract search query
      const searchMatch = commandLower.match(/(?:search|find)\s+(?:for\s+)?(.+)/);
      if (searchMatch) {
        parameters.query = searchMatch[1];
        confidence = 75;
      }
    } else if (commandLower.includes('read') || commandLower.includes('tell me')) {
      action = 'read';
      confidence = 70;
    } else if (commandLower.includes('help')) {
      action = 'help';
      confidence = 90;
    } else if (commandLower.includes('back')) {
      action = 'navigate';
      target = 'back';
      confidence = 95;
    }

    return {
      command,
      interpretation: {
        action,
        target,
        parameters,
        confidence,
      },
      fallback: true,
    };
  }

  /**
   * Get accessibility capabilities from backend
   */
  async getCapabilities(): Promise<any> {
    try {
      const response = await apiClient.get('/api/accessibility/settings');

      if (response.success && response.data) {
        return response.data;
      }

      return this.getDefaultCapabilities();
    } catch (error) {
      console.error('Get capabilities error:', error);
      return this.getDefaultCapabilities();
    }
  }

  /**
   * Get default capabilities (offline fallback)
   */
  private getDefaultCapabilities() {
    return {
      features: {
        textToSpeech: {
          enabled: true,
          languages: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'],
        },
        voiceCommands: {
          enabled: true,
          supportedCommands: ['navigate', 'submit', 'search', 'read', 'help', 'back'],
        },
        screenReader: {
          enabled: true,
          compatible: true,
        },
        highContrast: {
          enabled: true,
        },
        fontSize: {
          enabled: true,
          sizes: ['small', 'medium', 'large', 'extra-large'],
        },
      },
    };
  }

  /**
   * Get font size multiplier
   */
  getFontSizeMultiplier(): number {
    switch (this.settings.fontSize) {
      case 'small':
        return 0.875;
      case 'medium':
        return 1;
      case 'large':
        return 1.125;
      case 'extra-large':
        return 1.25;
      default:
        return 1;
    }
  }

  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled(): boolean {
    // In React Native, use AccessibilityInfo
    // return AccessibilityInfo.isScreenReaderEnabled();
    return this.settings.screenReader;
  }
}

export default new AccessibilityService();
