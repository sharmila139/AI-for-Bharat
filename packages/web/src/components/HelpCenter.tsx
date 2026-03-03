import { useState } from 'react';
import './HelpCenter.css';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpTopic {
  id: string;
  icon: string;
  title: string;
  description: string;
  content: string;
}

const helpTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    description: 'Learn the basics of RuralConnect AI',
    content: `Welcome to RuralConnect AI! Here's how to get started:

1. Explore Modules: Navigate through Agriculture, Health, Education, and Infrastructure modules using the top menu.

2. Use AI Assistant: Click the chat icon to ask questions about any topic.

3. Get Recommendations: Each module has interactive features - try clicking buttons to get AI-powered insights.

4. Change Language: Click the language selector to switch to your preferred language.

5. Stay Updated: Check notifications for important alerts and updates.`
  },
  {
    id: 'agriculture',
    icon: '🌾',
    title: 'Agriculture Module',
    description: 'Crop recommendations and farming advice',
    content: `The Agriculture module helps you make informed farming decisions:

Crop Recommendations:
- Enter your soil type, location, and season
- Get AI-powered crop suggestions
- View suitability scores and expected yields

Soil Analysis:
- Upload soil test results
- Get health scores and recommendations
- Learn about fertilizer needs

Weather Intelligence:
- Check weather forecasts
- Receive alerts for extreme conditions
- Plan farming activities accordingly`
  },
  {
    id: 'health',
    icon: '🏥',
    title: 'Health Module',
    description: 'First aid and natural remedies',
    content: `Access healthcare guidance and natural remedies:

Symptom Checker:
- Describe your symptoms
- Get AI analysis and severity assessment
- Receive first aid guidance
- Know when to seek medical help

Natural Remedies:
- Browse 300+ traditional remedies
- View preparation instructions
- Check efficacy ratings
- Learn about contraindications

Emergency Contacts:
- Ambulance: 108
- Health Helpline: 104
- Poison Control: 1066`
  },
  {
    id: 'education',
    icon: '📚',
    title: 'Education Module',
    description: 'Learning resources and progress tracking',
    content: `Enhance your skills with adaptive learning:

Learning Dashboard:
- Track progress across subjects
- View completion percentages
- Access personalized recommendations

Content Library:
- 5000+ educational videos
- Interactive games and quizzes
- Multi-language support
- Offline download available

Achievements:
- Earn badges for milestones
- Track daily streaks
- Compete on leaderboards`
  },
  {
    id: 'infrastructure',
    icon: '🏗️',
    title: 'Infrastructure Module',
    description: 'Report issues and track projects',
    content: `Engage with your community and local government:

Grievance Reporting:
- Report infrastructure issues
- Upload photos for evidence
- Get automatic categorization
- Track resolution status

Community Polls:
- Participate in local decisions
- Vote anonymously
- View real-time results

Project Tracking:
- Monitor development projects
- Check budget allocation
- View progress updates
- Access transparency documents`
  },
  {
    id: 'ai-assistant',
    icon: '🤖',
    title: 'AI Assistant',
    description: 'Your intelligent helper',
    content: `The AI Assistant can help you with:

Agriculture Questions:
- "What crops should I plant?"
- "How to improve soil health?"
- "When to harvest wheat?"

Health Queries:
- "I have a fever, what should I do?"
- "Natural remedy for cough?"
- "First aid for burns?"

General Help:
- "How to report a grievance?"
- "Where to find learning content?"
- "How to change language?"

Tips:
- Be specific in your questions
- Provide context when needed
- Use the suggestion buttons for quick queries`
  }
];

export default function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="help-overlay" onClick={onClose} />
      <div className="help-center">
        <div className="help-header">
          <div className="help-title">
            <span>❓</span>
            <span>Help & Tutorials</span>
          </div>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>

        <div className="help-content">
          {!selectedTopic ? (
            <div className="help-topics">
              <div className="help-intro">
                <h2>How can we help you?</h2>
                <p>Select a topic below to learn more</p>
              </div>
              <div className="help-topics-grid">
                {helpTopics.map((topic) => (
                  <button
                    key={topic.id}
                    className="help-topic-card"
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <div className="help-topic-icon">{topic.icon}</div>
                    <div className="help-topic-title">{topic.title}</div>
                    <div className="help-topic-description">{topic.description}</div>
                    <div className="help-topic-arrow">→</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="help-detail">
              <button 
                className="help-back"
                onClick={() => setSelectedTopic(null)}
              >
                ← Back to topics
              </button>
              <div className="help-detail-header">
                <span className="help-detail-icon">{selectedTopic.icon}</span>
                <h2>{selectedTopic.title}</h2>
              </div>
              <div className="help-detail-content">
                {selectedTopic.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="help-footer">
          <p>Still need help? Contact support at support@ruralconnect.ai</p>
        </div>
      </div>
    </>
  );
}
