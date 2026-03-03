import { useState } from 'react';
import { API_BASE_URL } from '../config';
import './AIAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your RuralConnect AI assistant. I can help you with agriculture, health, education, and infrastructure queries. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Determine which module to route to based on keywords
      let endpoint = '/api/health/symptom-check';
      let body: any = { symptoms: input };

      if (input.toLowerCase().includes('crop') || input.toLowerCase().includes('farm') || input.toLowerCase().includes('soil')) {
        endpoint = '/api/agriculture/crop-recommendations';
        body = { query: input };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      let assistantContent = 'I apologize, but I couldn\'t process that request. Please try again.';
      
      if (data.success) {
        if (data.data.assessment) {
          const assessment = data.data.assessment;
          assistantContent = `Based on your symptoms, here's my assessment:\n\n` +
            `Severity: ${assessment.severity}\n\n` +
            `Possible conditions: ${assessment.possibleConditions?.join(', ')}\n\n` +
            `First aid steps:\n${assessment.firstAidSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}`;
        } else if (data.data.recommendations) {
          const recs = data.data.recommendations;
          assistantContent = `Here are my crop recommendations:\n\n` +
            recs.map((rec: any, i: number) => 
              `${i + 1}. ${rec.crop} (${rec.suitability}% suitable)\n` +
              `   Expected yield: ${rec.expectedYield}\n` +
              `   Reasons: ${rec.reasons?.join(', ')}`
            ).join('\n\n');
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant">
        <div className="ai-assistant-header">
          <div className="ai-assistant-title">
            <span className="ai-icon">🤖</span>
            <span>AI Assistant</span>
          </div>
          <button className="ai-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="ai-messages">
          {messages.map((message) => (
            <div key={message.id} className={`ai-message ${message.role}`}>
              <div className="ai-message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="ai-message-content">
                <div className="ai-message-text">{message.content}</div>
                <div className="ai-message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <div className="ai-message-avatar">🤖</div>
              <div className="ai-message-content">
                <div className="ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ai-input-area">
          <textarea
            className="ai-input"
            placeholder="Ask me anything about agriculture, health, education, or infrastructure..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
          />
          <button 
            className="ai-send-btn" 
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>

        <div className="ai-suggestions">
          <button onClick={() => setInput('What crops should I plant this season?')}>
            🌾 Crop advice
          </button>
          <button onClick={() => setInput('I have a fever and cough')}>
            🏥 Health check
          </button>
          <button onClick={() => setInput('Report broken street light')}>
            🏗️ Report issue
          </button>
        </div>
      </div>
    </div>
  );
}
