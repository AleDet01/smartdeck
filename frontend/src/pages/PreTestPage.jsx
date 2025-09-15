import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';

const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:3000';

export default function PreTestPage() {
  const { area } = useParams();
  const [numQuestions, setNumQuestions] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_HOST}/flash/thematic/${area}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setMaxQuestions(data.length || 20))
      .catch(err => {
        console.error('Failed to load flashcards for area:', err.message);
        setMaxQuestions(20);
      });
  }, [area]);

  return (
    <div className="pretest-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="pretest-card">
        <h2>Configura il test: <span className="accent">{area}</span></h2>
        <label>Numero domande (max disponibile: {maxQuestions}):
          <input
            type="number"
            min={1}
            max={maxQuestions}
            value={numQuestions}
            onChange={e => {
              const val = Number(e.target.value) || 0;
              const clamped = Math.max(1, Math.min(val, maxQuestions || 1));
              setNumQuestions(clamped);
            }}
            className="modern-input"
          />
        </label>
        <button
          className="modern-btn"
          onClick={() => {
            // ensure area is encoded when navigating
            const encoded = encodeURIComponent(area);
            navigate(`/test/${encoded}/${numQuestions}`);
          }}
          disabled={!maxQuestions || numQuestions < 1}
        >
          Inizia il test
        </button>
      </div>
    </div>
  );
}
