import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import '../css/PreTestPage.css';
import API_HOST from '../utils/apiHost';

export default function PreTestPage() {
  const { area } = useParams();
  const [numQuestions, setNumQuestions] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_HOST}/flash/thematic/${area}`, { credentials: 'include' })
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

  const quickPicks = useMemo(() => {
    const base = [5, 10, 15, 20];
    const list = base.filter(n => n <= (maxQuestions || 1));
    if (list.length === 0) return [Math.min(5, maxQuestions || 1)];
    return list;
  }, [maxQuestions]);

  return (
    <div className="pretest-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="pretest-card">
        <h2>Configura il test: <span className="accent">{area}</span></h2>
        <div className="quick-picks" aria-label="Selezione rapida numero domande">
          {quickPicks.map(n => (
            <button
              key={n}
              className={n === numQuestions ? 'chip active' : 'chip'}
              onClick={() => setNumQuestions(n)}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>
        <label>
          Numero domande (max {maxQuestions}):
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
          className="modern-btn cta"
          onClick={() => {
            const encoded = encodeURIComponent(area);
            navigate(`/test/${encoded}/${numQuestions}`);
          }}
          disabled={!maxQuestions || numQuestions < 1}
          type="button"
        >
          Inizia il test
        </button>
      </div>
    </div>
  );
}
