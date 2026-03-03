import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const features = [
    {
      icon: '🌱',
      title: 'Smart Agriculture',
      description: 'AI-powered crop recommendations, soil analysis, and weather intelligence',
      link: '/agriculture',
      color: '#10b981',
    },
    {
      icon: '🏥',
      title: 'Primary Healthcare',
      description: 'First aid assistance, natural remedies, and nutrition tracking',
      link: '/health',
      color: '#ef4444',
    },
    {
      icon: '📚',
      title: 'Education',
      description: 'Adaptive learning platform with multi-language content',
      link: '/education',
      color: '#3b82f6',
    },
    {
      icon: '🏗️',
      title: 'Infrastructure',
      description: 'Grievance reporting, community polls, and project tracking',
      link: '/infrastructure',
      color: '#f59e0b',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10K+', icon: '👥' },
    { label: 'Crops Analyzed', value: '50K+', icon: '🌾' },
    { label: 'Health Queries', value: '25K+', icon: '💊' },
    { label: 'Grievances Resolved', value: '5K+', icon: '✅' },
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Empowering Rural Communities with AI
            </h1>
            <p className="hero-subtitle">
              Comprehensive platform for agriculture, healthcare, education, and civic engagement
            </p>
            <div className="hero-buttons">
              <Link to="/agriculture" className="button button-primary button-large">
                Get Started
              </Link>
              <a href="#features" className="button button-secondary button-large">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Our Modules</h2>
          <p className="section-subtitle">
            Comprehensive solutions for rural development
          </p>
          <div className="features-grid">
            {features.map((feature) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="feature-card"
                style={{ borderTopColor: feature.color }}
              >
                <div className="feature-icon" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-link" style={{ color: feature.color }}>
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-subtitle">
              Join thousands of users already benefiting from RuralConnect AI
            </p>
            <Link to="/agriculture" className="button button-primary button-large">
              Start Exploring
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
