import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

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
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 RuralConnect AI - Empowering Rural Communities</p>
          <p className="footer-subtitle">Powered by AWS Lambda + API Gateway</p>
        </div>
      </footer>
    </div>
  );
}
