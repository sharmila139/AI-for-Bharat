import './Education.css';

export default function Education() {
  const subjects = [
    { name: 'Mathematics', icon: '🔢', topics: 45, progress: 65 },
    { name: 'Science', icon: '🔬', topics: 38, progress: 52 },
    { name: 'English', icon: '📖', topics: 42, progress: 78 },
    { name: 'Hindi', icon: '📝', topics: 35, progress: 88 },
  ];

  const features = [
    {
      icon: '🎯',
      title: 'Adaptive Learning',
      description: 'Content adjusts to your learning pace and style',
    },
    {
      icon: '🌐',
      title: 'Multi-Language',
      description: 'Available in 15+ Indian languages',
    },
    {
      icon: '📱',
      title: 'Offline Access',
      description: 'Download content for offline learning',
    },
    {
      icon: '🏆',
      title: 'Gamification',
      description: 'Earn badges and track your progress',
    },
  ];

  return (
    <div className="page education-page">
      <div className="container">
        <h1 className="page-title">📚 Education & Skill Development</h1>
        <p className="page-subtitle">
          Adaptive learning platform with personalized content
        </p>

        <div className="grid grid-4">
          {features.map((feature, index) => (
            <div key={index} className="feature-box education-box">
              <div className="feature-box-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="card-title">Your Learning Dashboard</h2>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            Track your progress across different subjects
          </p>
          <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <div key={index} className="subject-card">
                <div className="subject-icon">{subject.icon}</div>
                <h3>{subject.name}</h3>
                <div className="subject-stats">
                  <div className="stat">
                    <span className="stat-value">{subject.topics}</span>
                    <span className="stat-label">Topics</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{subject.progress}%</span>
                    <span className="stat-label">Complete</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <button className="button button-primary" style={{ marginTop: '16px', width: '100%' }}>
                  Continue Learning
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="content-library">
          <h2>Content Library</h2>
          <p className="section-description">
            Access thousands of educational videos and interactive content
          </p>
          <div className="grid grid-3">
            <div className="content-card">
              <div className="content-thumbnail">📹</div>
              <h3>Video Lessons</h3>
              <p>5000+ educational videos</p>
              <div className="content-meta">
                <span>Multiple qualities</span>
                <span>Offline download</span>
              </div>
            </div>
            <div className="content-card">
              <div className="content-thumbnail">🎮</div>
              <h3>Interactive Games</h3>
              <p>Learn through play</p>
              <div className="content-meta">
                <span>Engaging</span>
                <span>Educational</span>
              </div>
            </div>
            <div className="content-card">
              <div className="content-thumbnail">📝</div>
              <h3>Practice Tests</h3>
              <p>Test your knowledge</p>
              <div className="content-meta">
                <span>Instant feedback</span>
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h2>Learning Features</h2>
          <div className="grid grid-2">
            <div className="info-card education-info">
              <h3>🎓 Personalized Learning Path</h3>
              <p>AI adapts content based on your performance</p>
              <ul>
                <li>Diagnostic assessments</li>
                <li>Customized recommendations</li>
                <li>Progress tracking</li>
              </ul>
            </div>
            <div className="info-card education-info">
              <h3>🌟 Achievement System</h3>
              <p>Stay motivated with rewards and badges</p>
              <ul>
                <li>Daily streaks</li>
                <li>Milestone badges</li>
                <li>Leaderboards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
