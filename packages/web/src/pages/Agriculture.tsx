import { useState } from 'react';
import { API_BASE_URL } from '../config';
import './Agriculture.css';

interface CropRecommendation {
  crop: string;
  suitability: number;
  season: string;
  expectedYield: string;
  waterRequirement: string;
  reasons: string[];
}

export default function Agriculture() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [error, setError] = useState('');

  const getCropRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/agriculture/crop-recommendations`);
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data.recommendations);
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Error connecting to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page agriculture-page">
      <div className="container">
        <h1 className="page-title">🌾 Smart Agriculture</h1>
        <p className="page-subtitle">
          AI-powered crop recommendations and agricultural intelligence
        </p>

        <div className="grid grid-3">
          <div className="feature-box">
            <div className="feature-box-icon">🌱</div>
            <h3>Crop Recommendations</h3>
            <p>Get personalized crop suggestions based on soil and climate</p>
          </div>
          <div className="feature-box">
            <div className="feature-box-icon">🌡️</div>
            <h3>Weather Intelligence</h3>
            <p>Real-time weather updates and alerts for your farm</p>
          </div>
          <div className="feature-box">
            <div className="feature-box-icon">💧</div>
            <h3>Soil Analysis</h3>
            <p>Comprehensive soil health assessment and recommendations</p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Get Crop Recommendations</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Click below to get AI-powered crop recommendations for your farm
          </p>
          <button
            className="button button-primary"
            onClick={getCropRecommendations}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Get Recommendations'}
          </button>

          {error && <div className="error" style={{ marginTop: '20px' }}>{error}</div>}

          {recommendations.length > 0 && (
            <div className="recommendations" style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '20px' }}>Recommended Crops</h3>
              <div className="grid grid-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-header">
                      <h4>{rec.crop}</h4>
                      <div className="suitability-badge">
                        {rec.suitability}% Suitable
                      </div>
                    </div>
                    <div className="recommendation-details">
                      <div className="detail-row">
                        <span className="detail-label">Season:</span>
                        <span className="detail-value">{rec.season}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Expected Yield:</span>
                        <span className="detail-value">{rec.expectedYield}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Water Need:</span>
                        <span className="detail-value">{rec.waterRequirement}</span>
                      </div>
                    </div>
                    <div className="recommendation-reasons">
                      <strong>Why this crop?</strong>
                      <ul>
                        {rec.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>Additional Features</h2>
          <div className="grid grid-2">
            <div className="info-card">
              <h3>📊 Market Intelligence</h3>
              <p>Real-time market prices and 3-year historical trends</p>
              <ul>
                <li>Live commodity prices</li>
                <li>Price trend analysis</li>
                <li>Best selling locations</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>🌾 Sustainable Practices</h3>
              <p>Knowledge base for organic and sustainable farming</p>
              <ul>
                <li>Crop rotation plans</li>
                <li>Organic fertilizers</li>
                <li>Pest management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
