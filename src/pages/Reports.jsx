import React, { useState } from 'react';
import { Search, Loader, AlertCircle } from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    tob: '',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchKundliData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const apiKey = import.meta.env.VITE_VEDIC_ASTRO_API_KEY;

    try {
      if (!apiKey) {
        // Fallback to mock data if API key is not set
        console.warn("VITE_VEDIC_ASTRO_API_KEY is not set. Using mock data.");
        setTimeout(() => {
          setResult({
            isMock: true,
            ascendant: 'Leo',
            moonSign: 'Aries',
            sunSign: 'Sagittarius',
            planets: [
              { name: 'Sun', house: 5, sign: 'Sagittarius', degree: 14.5 },
              { name: 'Moon', house: 9, sign: 'Aries', degree: 22.1 },
              { name: 'Mars', house: 1, sign: 'Leo', degree: 5.3 },
              { name: 'Mercury', house: 4, sign: 'Scorpio', degree: 18.9 }
            ],
            prediction: "You have a strong fiery disposition. The placement of Mars in your ascendant gives you excellent leadership qualities, while your Moon in the 9th house indicates a spiritual journey and fortune from higher education."
          });
          setLoading(false);
        }, 1500);
        return;
      }

      // If API key exists, format data and make actual request
      // Note: This assumes parsing the input into lat/lon/tz which usually requires a geocoding step.
      // For demonstration, we assume a static location if a real geocoder isn't hooked up.
      
      const [year, month, day] = formData.dob.split('-');
      const [hour, minute] = formData.tob.split(':');

      const url = `https://api.vedicastroapi.com/v3-json/horoscope/planet-details?dob=${day}/${month}/${year}&tob=${hour}:${minute}&lat=28.6139&lon=77.2090&tz=5.5&api_key=${apiKey}&lang=en`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 200) {
        setResult({
          isMock: false,
          data: data.response
        });
      } else {
        throw new Error(data.msg || "Failed to fetch astrology data.");
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the report.');
    } finally {
      if (apiKey) setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <div className="container">
        <h1 className="section-title">Generate Basic Kundli</h1>
        <p className="reports-subtitle">
          Enter your birth details below to generate your personalized Janam Kundli and planetary positions report powered by Vedic Astro API.
        </p>

        <div className="reports-container">
          <div className="glass-card form-card">
            <form onSubmit={fetchKundliData} className="kundli-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Rahul Sharma" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Time of Birth</label>
                  <input type="time" name="tob" value={formData.tob} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Birth City</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="e.g. New Delhi, India" />
              </div>

              <button type="submit" className="btn-primary submit-btn" disabled={loading}>
                {loading ? <Loader className="spin" size={20} /> : <Search size={20} />}
                {loading ? 'Analyzing...' : 'Generate Report'}
              </button>
            </form>
          </div>

          <div className="results-container">
            {error && (
              <div className="error-message">
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="empty-state">
                <div className="glow-circle-small"></div>
                <h3>Your Destiny Awaits</h3>
                <p>Fill out the form to unlock your cosmic blueprint.</p>
              </div>
            )}

            {result && (
              <div className="glass-card result-card fade-in">
                {result.isMock && (
                  <div className="mock-badge">
                    Preview Mode (API Key not set)
                  </div>
                )}
                
                <h2 className="result-title">Kundli Overview for {formData.name || 'You'}</h2>
                
                {result.isMock ? (
                  <>
                    <div className="stats-grid-small">
                      <div className="stat-box">
                        <span>Ascendant (Lagna)</span>
                        <h4>{result.ascendant}</h4>
                      </div>
                      <div className="stat-box">
                        <span>Moon Sign (Rasi)</span>
                        <h4>{result.moonSign}</h4>
                      </div>
                      <div className="stat-box">
                        <span>Sun Sign</span>
                        <h4>{result.sunSign}</h4>
                      </div>
                    </div>

                    <h3 className="sub-title">Planetary Positions</h3>
                    <div className="planets-list">
                      {result.planets.map((p, i) => (
                        <div key={i} className="planet-item">
                          <span className="planet-name">{p.name}</span>
                          <span className="planet-house">House {p.house}</span>
                          <span className="planet-sign">{p.sign}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="sub-title">Basic Prediction</h3>
                    <p className="prediction-text">{result.prediction}</p>
                  </>
                ) : (
                  <div className="api-raw-data">
                    <p>API Data successfully fetched. (Implement specific UI mapping for actual API response fields here)</p>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
