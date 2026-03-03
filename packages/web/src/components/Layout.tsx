import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import AIAssistant from './AIAssistant';
import NotificationCenter from './NotificationCenter';
import HelpCenter from './HelpCenter';
import FloatingActions from './FloatingActions';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/agriculture', label: 'Agriculture', icon: '🌾' },
    { path: '/health', label: 'Health', icon: '🏥' },
    { path: '/education', label: 'Education', icon: '📚' },
    { path: '/infrastructure', label: 'Infrastructure', icon: '🏗️' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🌾</span>
            <span className="logo-text">RuralConnect AI</span>
          </Link>
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 RuralConnect AI - Empowering Rural Communities</p>
          <p className="footer-subtitle">Powered by AWS Lambda + API Gateway + Bedrock AI</p>
        </div>
      </footer>

      {/* Cross-Module Components */}
      <AIAssistant 
        isOpen={showAIAssistant} 
        onClose={() => setShowAIAssistant(false)} 
      />
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      <HelpCenter 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      <FloatingActions
        onAIAssistantClick={() => setShowAIAssistant(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        onHelpClick={() => setShowHelp(true)}
        unreadNotifications={2}
      />
    </div>
  );
}
