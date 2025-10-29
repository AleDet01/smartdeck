import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/PreTestPage.css';
import API_HOST from '../utils/apiHost';
import { useFetch } from '../utils/hooks';

const PreTestPage = () => {
  const { area } = useParams();
  const navigate = useNavigate();
  const [numQuestions, setNumQuestions] = useState(10);
  
  const { data } = useFetch(`${API_HOST}/flash/thematic/${area}`);
  const maxQuestions = data?.length || 20;

  const quickPicks = useMemo(() => {
    const base = [5, 10, 15, 20];
    const list = base.filter(n => n <= maxQuestions);
    return list.length === 0 ? [Math.min(5, maxQuestions)] : list;
  }, [maxQuestions]);

  const handleNumChange = (val) => {
    const clamped = Math.max(1, Math.min(val, maxQuestions));
    setNumQuestions(clamped);
  };

  return (
    <div className="pretest-page">
      <PageBackground />
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
            onChange={e => handleNumChange(Number(e.target.value) || 0)}
            className="modern-input"
          />
        </label>
        <button
          className="modern-btn cta"
          onClick={() => navigate(`/test/${encodeURIComponent(area)}/${numQuestions}`)}
          disabled={!maxQuestions || numQuestions < 1}
          type="button"
        >
          Inizia il test
        </button>
      </div>
    </div>
  );
};

export default PreTestPage;
