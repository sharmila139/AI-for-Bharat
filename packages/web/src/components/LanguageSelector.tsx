import { useState } from 'react';
import './LanguageSelector.css';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

export default function LanguageSelector({ 
  currentLanguage = 'en', 
  onLanguageChange 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);

  const currentLangData = languages.find(l => l.code === selectedLang) || languages[0];

  const handleSelect = (code: string) => {
    setSelectedLang(code);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
    // Store in localStorage
    localStorage.setItem('preferredLanguage', code);
  };

  return (
    <div className="language-selector">
      <button 
        className="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="language-flag">{currentLangData.flag}</span>
        <span className="language-name">{currentLangData.nativeName}</span>
        <span className="language-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="language-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-dropdown">
            <div className="language-dropdown-header">
              <span>🌐</span>
              <span>Select Language</span>
            </div>
            <div className="language-list">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-item ${lang.code === selectedLang ? 'active' : ''}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <span className="language-item-flag">{lang.flag}</span>
                  <div className="language-item-text">
                    <div className="language-item-native">{lang.nativeName}</div>
                    <div className="language-item-english">{lang.name}</div>
                  </div>
                  {lang.code === selectedLang && (
                    <span className="language-item-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
