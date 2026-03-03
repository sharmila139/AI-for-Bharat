import { useState } from 'react';
import './FloatingActions.css';

interface FloatingActionsProps {
  onAIAssistantClick: () => void;
  onNotificationsClick: () => void;
  onHelpClick: () => void;
  unreadNotifications?: number;
}

export default function FloatingActions({
  onAIAssistantClick,
  onNotificationsClick,
  onHelpClick,
  unreadNotifications = 0
}: FloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: '🤖',
      label: 'AI Assistant',
      onClick: onAIAssistantClick,
      color: '#667eea'
    },
    {
      icon: '🔔',
      label: 'Notifications',
      onClick: onNotificationsClick,
      badge: unreadNotifications,
      color: '#ef4444'
    },
    {
      icon: '❓',
      label: 'Help',
      onClick: onHelpClick,
      color: '#10b981'
    }
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <div className="floating-actions">
      {isExpanded && (
        <>
          <div 
            className="floating-overlay" 
            onClick={() => setIsExpanded(false)} 
          />
          <div className="floating-menu">
            {actions.map((action, index) => (
              <button
                key={index}
                className="floating-action-btn"
                onClick={() => handleActionClick(action)}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  background: action.color 
                }}
              >
                <span className="floating-action-icon">{action.icon}</span>
                <span className="floating-action-label">{action.label}</span>
                {action.badge && action.badge > 0 && (
                  <span className="floating-action-badge">{action.badge}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
      
      <button
        className={`floating-main-btn ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="floating-main-icon">
          {isExpanded ? '✕' : '⚡'}
        </span>
      </button>
    </div>
  );
}
