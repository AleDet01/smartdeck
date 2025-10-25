import React from 'react';
import API_HOST from '../utils/apiHost';
import '../css/LandingPage.css';

export default function LandingPage() {
  const startGoogle = () => {
    window.location.href = `${API_HOST}/auth/google`;
  };

  return (
    <div className="landing-container">
      <div className="landing-box">
        <div className="form-section" style={{ gap: 10 }}>
          <h2 className="section-title" style={{ userSelect: 'none' }}>Benvenuto</h2>
          <button className="modern-btn" type="button" onClick={startGoogle}>
            Accedi con Google
          </button>
        </div>
      </div>
    </div>
  );
}
