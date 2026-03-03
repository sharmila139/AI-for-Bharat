import { useState } from 'react';
import './Infrastructure.css';

export default function Infrastructure() {
  const [grievanceText, setGrievanceText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (grievanceText.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setGrievanceText('');
      }, 3000);
    }
  };

  const grievances = [
    {
      id: 'GRV-2024-001',
      category: 'Road Repair',
      status: 'In Progress',
      date: '2024-03-01',
      location: 'Main Street',
    },
    {
      id: 'GRV-2024-002',
      category: 'Water Supply',
      status: 'Resolved',
      date: '2024-02-28',
      location: 'Village Center',
    },
    {
      id: 'GRV-2024-003',
      category: 'Street Light',
      status: 'Pending',
      date: '2024-03-02',
      location: 'School Road',
    },
  ];

  const projects = [
    {
      name: 'Community Center Construction',
      progress: 75,
      budget: '₹50 Lakhs',
      deadline: 'June 2024',
    },
    {
      name: 'Road Widening Project',
      progress: 45,
      budget: '₹1.2 Crores',
      deadline: 'August 2024',
    },
    {
      name: 'Water Pipeline Installation',
      progress: 90,
      budget: '₹80 Lakhs',
      deadline: 'April 2024',
    },
  ];

  return (
    <div className="page infrastructure-page">
      <div className="container">
        <h1 className="page-title">🏗️ Infrastructure & Civic Engagement</h1>
        <p className="page-subtitle">
          Report issues, participate in polls, and track development projects
        </p>

        <div className="grid grid-3">
          <div className="feature-box infrastructure-box">
            <div className="feature-box-icon">📸</div>
            <h3>Visual Reporting</h3>
            <p>Report issues with photos and GPS location</p>
          </div>
          <div className="feature-box infrastructure-box">
            <div className="feature-box-icon">🗳️</div>
            <h3>Community Polls</h3>
            <p>Voice your opinion on local decisions</p>
          </div>
          <div className="feature-box infrastructure-box">
            <div className="feature-box-icon">📊</div>
            <h3>Project Tracking</h3>
            <p>Monitor infrastructure development progress</p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Report a Grievance</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Describe the issue you want to report to local authorities
          </p>
          <textarea
            className="textarea"
            placeholder="Describe the issue (e.g., broken street light, water supply problem)..."
            value={grievanceText}
            onChange={(e) => setGrievanceText(e.target.value)}
            rows={4}
          />
          <button
            className="button button-primary"
            onClick={handleSubmit}
            disabled={!grievanceText.trim()}
          >
            Submit Grievance
          </button>

          {submitted && (
            <div className="success" style={{ marginTop: '20px' }}>
              ✅ Grievance submitted successfully! Ticket ID: GRV-2024-{Math.floor(Math.random() * 1000)}
            </div>
          )}
        </div>

        <div className="grievances-section">
          <h2>Recent Grievances</h2>
          <p className="section-description">
            Track the status of reported issues in your community
          </p>
          <div className="grievances-list">
            {grievances.map((grievance) => (
              <div key={grievance.id} className="grievance-item">
                <div className="grievance-header">
                  <div>
                    <h3>{grievance.category}</h3>
                    <p className="grievance-id">{grievance.id}</p>
                  </div>
                  <span className={`status-badge status-${grievance.status.toLowerCase().replace(' ', '-')}`}>
                    {grievance.status}
                  </span>
                </div>
                <div className="grievance-details">
                  <span>📍 {grievance.location}</span>
                  <span>📅 {grievance.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="projects-section">
          <h2>Development Projects</h2>
          <p className="section-description">
            Monitor ongoing infrastructure projects in your area
          </p>
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div key={index} className="project-card">
                <h3>{project.name}</h3>
                <div className="project-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span className="progress-value">{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill project-progress-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="project-details">
                  <div className="project-detail">
                    <span className="detail-label">Budget:</span>
                    <span className="detail-value">{project.budget}</span>
                  </div>
                  <div className="project-detail">
                    <span className="detail-label">Deadline:</span>
                    <span className="detail-value">{project.deadline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h2>Civic Engagement Features</h2>
          <div className="grid grid-2">
            <div className="info-card infrastructure-info">
              <h3>🗳️ Community Polls</h3>
              <p>Participate in local decision-making</p>
              <ul>
                <li>Anonymous voting</li>
                <li>Real-time results</li>
                <li>Demographic insights</li>
              </ul>
            </div>
            <div className="info-card infrastructure-info">
              <h3>📈 Transparency Dashboard</h3>
              <p>Track government projects and budgets</p>
              <ul>
                <li>Budget allocation</li>
                <li>Timeline tracking</li>
                <li>Quality reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
