import { useState } from 'react';
import { API_BASE_URL } from '../config';
import './Health.css';

interface SymptomAssessment {
  severity: string;
  possibleConditions: string[];
  firstAidSteps: string[];
  seekHelpIf: string;
  recommendedRemedies: string[];
}

export default function Health() {
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<SymptomAssessment | null>(null);
  const [error, setError] = useState('');

  const handleSymptomCheck = async () => {
    if (!symptom.trim()) return;
    
    setLoading(true);
    setError('');
    setAssessment(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/symptom-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptom })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.assessment) {
        setAssessment(data.data.assessment);
      } else {
        setError('Failed to analyze symptoms. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to API. Please check your connection.');
    } finally {
      setLoading(false);
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
            disabled={!symptom.trim() || loading}
          >
            {loading ? 'Analyzing...' : 'Check Symptoms'}
          </button>

          {error && (
            <div className="alert-box error" style={{ marginTop: '20px' }}>
              {error}
            </div>
          )}

          {assessment && (
            <div className="symptom-results">
              <div className="alert-box warning">
                <strong>⚠️ Important:</strong> This is for informational purposes only.
                For serious symptoms, please consult a healthcare professional immediately.
              </div>
              
              <div className="assessment-section">
                <h3>Severity: <span className={`severity-${assessment.severity.toLowerCase()}`}>{assessment.severity}</span></h3>
              </div>

              {assessment.possibleConditions && assessment.possibleConditions.length > 0 && (
                <div className="assessment-section">
                  <h3>Possible Conditions</h3>
                  <ul className="condition-list">
                    {assessment.possibleConditions.map((condition, i) => (
                      <li key={i}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {assessment.firstAidSteps && assessment.firstAidSteps.length > 0 && (
                <div className="assessment-section">
                  <h3>Recommended Actions</h3>
                  <ul className="action-list">
                    {assessment.firstAidSteps.map((step, i) => (
                      <li key={i}>✓ {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {assessment.seekHelpIf && (
                <div className="assessment-section">
                  <h3>Seek Medical Help If:</h3>
                  <p className="seek-help-text">{assessment.seekHelpIf}</p>
                </div>
              )}

              {assessment.recommendedRemedies && assessment.recommendedRemedies.length > 0 && (
                <div className="assessment-section">
                  <h3>Recommended Natural Remedies</h3>
                  <ul className="remedy-list">
                    {assessment.recommendedRemedies.map((remedy, i) => (
                      <li key={i}>{remedy}</li>
                    ))}
                  </ul>
                </div>
              )}
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
