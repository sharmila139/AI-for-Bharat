import React, { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import './AccessibilityToolbar.css';

export const AccessibilityToolbar: React.FC = () => {
  const {
    settings,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleTextToSpeech,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="accessibility-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle accessibility menu"
        title="Accessibility Options"
      >
        ♿
      </button>

      {isOpen && (
        <div className="accessibility-toolbar" role="dialog" aria-label="Accessibility Settings">
          <div className="accessibility-toolbar-header">
            <h3>Accessibility</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility menu"
            >
              ✕
            </button>
          </div>

          <div className="accessibility-toolbar-content">
            <div className="accessibility-section">
              <h4>Font Size</h4>
              <div className="button-group">
                <button
                  onClick={decreaseFontSize}
                  aria-label="Decrease font size"
                  disabled={settings.fontSize === 'small'}
                >
                  A-
                </button>
                <span className="current-value">{settings.fontSize}</span>
                <button
                  onClick={increaseFontSize}
                  aria-label="Increase font size"
                  disabled={settings.fontSize === 'extra-large'}
                >
                  A+
                </button>
              </div>
            </div>

            <div className="accessibility-section">
              <h4>Display</h4>
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={toggleHighContrast}
                  aria-label="Toggle high contrast mode"
                />
                <span>High Contrast Mode</span>
              </label>
            </div>

            <div className="accessibility-section">
              <h4>Audio</h4>
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={settings.textToSpeech}
                  onChange={toggleTextToSpeech}
                  aria-label="Toggle text to speech"
                />
                <span>Text-to-Speech</span>
              </label>
            </div>

            <div className="accessibility-info">
              <p>
                <strong>Keyboard Shortcuts:</strong>
              </p>
              <ul>
                <li><kbd>Alt</kbd> + <kbd>+</kbd> - Increase font size</li>
                <li><kbd>Alt</kbd> + <kbd>-</kbd> - Decrease font size</li>
                <li><kbd>Alt</kbd> + <kbd>C</kbd> - Toggle high contrast</li>
                <li><kbd>Alt</kbd> + <kbd>S</kbd> - Toggle text-to-speech</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
