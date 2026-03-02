import { useState } from 'react';

interface VoiceSearchResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceSearch = (): VoiceSearchResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = () => {
    // Mock implementation - in real app, use react-native-voice or similar
    setIsListening(true);
    setError(null);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
