import { useState } from 'react';
import './Health.css';

export default function Health() {
  const [symptom, setSymptom] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSymptomCheck = () => {
    if (symptom.trim()) {
      setShowResults(true);
    }
  };

  const remedies = [
    {
      name: 'Ginger Tea',
      condition: 'Cold & Cough',
      efficacy: 92,
      preparation: 'Boil fresh ginger in water for 10 minutes',
      benefits: ['Reduces inflammation', 'Soothes throat', 'Boosts immunity'],
    },
    {
      name: 'Turmeric Milk',
      condition: 'Joint Pain',
      efficacy: 88,
      preparation: 'Mix turmeric powder in warm milk',
      benefits: ['Anti-inflammatory', 'Pain relief', 'Better sleep'],
    },
    {
      name: 'Tulsi Leaves',
      condition: 'Fever',
      efficacy: 85,
      preparation: 'Boil tulsi leaves in water and drink',
      benefits: ['Reduces fever', 'Antibacterial', 'Boosts immunity'],
    },
  ];

  return (
    <div className="page health-page">
      <div className="container">
        <h1 className="page-title">🏥 Primary Healthcare</h1>
        <p className="page-subtitle">
          AI-powered health assistance and natural remedies
        </p>

        <div className="grid grid-3">
          <div className="feature-box health-box">
            <div className="feature-box-icon">🩺</div>
            <h3>First Aid Assistant</h3>
            <p>Immediate guidance for common health emergencies</p>
          </div>
          <div className="feature-box health-box">
            <div className="feature-box-icon">🌿</div>
            <h3>Natural Remedies</h3>
            <p>Traditional medicine database with 300+ remedies</p>
          </div>
          <div className="feature-box health-box">
            <div className="feature-box-icon">🥗</div>
            <h3>Nutrition Tracking</h3>
            <p>Personalized meal plans and dietary guidance</p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Symptom Checker</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Describe your symptoms to get immediate first aid guidance
          </p>
          <textarea
            className="textarea"
            placeholder="Describe your symptoms (e.g., headache, fever, cough)..."
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            rows={4}
          />
          <button
            className="button button-primary"
            onClick={handleSymptomCheck}
            disabled={!symptom.trim()}
          >
            Check Symptoms
          </button>

          {showResults && (
            <div className="symptom-results">
              <div className="alert-box warning">
                <strong>⚠️ Important:</strong> This is for informational purposes only.
                For serious symptoms, please consult a healthcare professional immediately.
              </div>
              <h3>Recommended Actions</h3>
              <ul className="action-list">
                <li>✓ Rest and stay hydrated</li>
                <li>✓ Monitor your temperature</li>
                <li>✓ Try natural remedies below</li>
                <li>✓ Seek medical help if symptoms worsen</li>
              </ul>
            </div>
          )}
        </div>

        <div className="remedies-section">
          <h2>Natural Remedies Database</h2>
          <p className="section-description">
            Explore traditional remedies backed by community knowledge
          </p>
          <div className="grid grid-3">
            {remedies.map((remedy, index) => (
              <div key={index} className="remedy-card">
                <div className="remedy-header">
                  <h3>{remedy.name}</h3>
                  <div className="efficacy-badge">
                    {remedy.efficacy}% Effective
                  </div>
                </div>
                <div className="remedy-condition">
                  For: <strong>{remedy.condition}</strong>
                </div>
                <div className="remedy-preparation">
                  <strong>Preparation:</strong>
                  <p>{remedy.preparation}</p>
                </div>
                <div className="remedy-benefits">
                  <strong>Benefits:</strong>
                  <ul>
                    {remedy.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h2>Additional Health Services</h2>
          <div className="grid grid-2">
            <div className="info-card health-info">
              <h3>🍎 Nutrition Planning</h3>
              <p>Personalized meal plans based on your health profile</p>
              <ul>
                <li>Calorie tracking</li>
                <li>Local food recommendations</li>
                <li>Dietary restrictions support</li>
              </ul>
            </div>
            <div className="info-card health-info">
              <h3>📞 Emergency Contacts</h3>
              <p>Quick access to healthcare services</p>
              <ul>
                <li>Ambulance: 108</li>
                <li>Health Helpline: 104</li>
                <li>Poison Control: 1066</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
