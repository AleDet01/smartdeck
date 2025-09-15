
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import Topbar from './components/Topbar';
import './css/CreateTestPage.css';
import './css/PreTestPage.css';
import './css/TestPage.css';

function CreateTestPage() {
  const [testName, setTestName] = useState('');
  const [image, setImage] = useState(null);
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([{ question: '', answers: ['', '', ''] }]);
  const [correctIndexes, setCorrectIndexes] = useState([0]);
  const [touched, setTouched] = useState(false);

  const handleNumQuestions = (n) => {
    setNumQuestions(n);
    setQuestions(qs => {
      const arr = [...qs];
      while (arr.length < n) arr.push({ question: '', answers: ['', '', ''] });
      return arr.slice(0, n);
    });
    setCorrectIndexes(ci => {
      const arr = [...ci];
      while (arr.length < n) arr.push(0);
      return arr.slice(0, n);
    });
  };
  const handleQuestionChange = (i, value) => {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, question: value } : q));
    setTouched(true);
  };
  const handleAnswerChange = (qi, ai, value) => {
    setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, answers: q.answers.map((a, j) => j === ai ? value : a) } : q));
    setTouched(true);
  };
  const handleMarkCorrect = (qi, ai) => {
    setCorrectIndexes(ci => {
      const arr = [...ci];
      arr[qi] = ai;
      return arr;
    });
  };
  const allFilled = testName && questions.every(q => q.question && q.answers.every(a => a));
  const handleImage = e => setImage(e.target.files[0]);
  const handleSubmit = e => {
    e.preventDefault();
    // Build payload for backend flashcards
    const payload = {
      thematicArea: testName,
      questions: questions.map((q, qi) => ({
        question: q.question,
        answers: q.answers.map((txt, idx) => ({ text: txt, isCorrect: (correctIndexes[qi] === idx) })),
        difficulty: 'media'
      }))
    };

    // Try to POST to backend to create new flashcards
    safeFetch(`${API_HOST}/flash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        // Refresh dashboard which now fetches areas from backend
        window.location.href = '/dashboard';
      })
      .catch(err => {
        console.error('Errore creazione flashcards:', err.message);
        // fallback to local persist so user doesn't lose content
        try {
          const stored = JSON.parse(localStorage.getItem('customTests') || '[]');
          const newTest = { id: `custom-${Date.now()}`, name: testName, questions };
          stored.unshift(newTest);
          localStorage.setItem('customTests', JSON.stringify(stored));
          window.location.href = '/dashboard';
        } catch (e) {
          alert('Errore salvataggio test');
        }
      });
  };
  return (
    <div className="create-test-page-outer">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="create-test-page">
        <h2>Crea un nuovo test</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nome del test" value={testName} onChange={e => setTestName(e.target.value)} className="modern-input" />
          <input type="file" accept="image/*" onChange={handleImage} />
          <input type="number" min={1} max={20} value={numQuestions} onChange={e => handleNumQuestions(Number(e.target.value))} className="modern-input" placeholder="Numero domande" />
          <div className="question-list">
            {questions.map((q, i) => (
              <div key={i} className="question-item">
                <input type="text" placeholder={`Domanda ${i+1}`} value={q.question} onChange={e => handleQuestionChange(i, e.target.value)} className="modern-input" />
                {q.answers.map((a, j) => (
                  <div key={j} className="answer-row">
                    <input type="text" placeholder={`Risposta ${j+1}`} value={a} onChange={e => handleAnswerChange(i, j, e.target.value)} className="modern-input" />
                    <label>
                      <input type="radio" name={`correct-${i}`} checked={correctIndexes[i]===j} onChange={() => handleMarkCorrect(i,j)} />
                      <span>Corretta</span>
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button className="modern-btn" type="submit" disabled={!allFilled}>Conferma</button>
        </form>
      </div>
    </div>
  );
}

function StatsPage() {
  const [areas, setAreas] = React.useState(null);
  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    safeFetch(`${API_HOST}/testresult/areas/list`)
      .then(data => {
        if (!mounted) return;
        const arr = data?.areas || data || [];
        setAreas(arr);
        if (arr.length) setSelected(arr[0]);
      })
      .catch(err => {
        if (!mounted) return;
        console.error('Failed to load areas:', err.message || err);
        setAreas([]);
      });
    return () => { mounted = false };
  }, []);

  return (
    <div className="stats-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="center-box">
        <h2>Statistiche</h2>
        <div className="card">
          <label>Seleziona area: </label>
          {areas === null && <span> Caricamento... </span>}
          {areas && areas.length === 0 && (
            <span> Nessuna area disponibile </span>
          )}
          {areas && areas.length > 0 && (
            <select value={selected || ''} onChange={e => setSelected(e.target.value)}>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          <button className="modern-btn" onClick={() => {
            setAreas(null);
            safeFetch(`${API_HOST}/testresult/areas/list`).then(d=>{
              const arr = d?.areas || d || [];
              setAreas(arr);
              if (arr.length) setSelected(arr[0]);
            }).catch(err=>{
              console.error('Reload areas failed', err); setAreas([]);
            });
          }}>Ricarica</button>
        </div>
      </div>
    </div>
  );
}

// Utility per host API
// Force localhost backend during development to avoid fetching the frontend dev server's index.html
const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:3000';

// Small helper to avoid trying to parse HTML (index.html) as JSON which causes "Unexpected token '<'"
async function safeFetch(url, opts) {
  const res = await fetch(url, opts);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (contentType.includes('application/json')) {
    return res.json();
  }
  // return raw text for debugging (likely HTML)
  const txt = await res.text();
  throw new Error(`Expected JSON but received: ${txt.slice(0,200)}`);
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function PreTestPage() {
  const { area } = useParams();
  const [numQuestions, setNumQuestions] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const navigate = useNavigate();
  useEffect(() => {
    safeFetch(`${API_HOST}/flash/thematic/${area}`)
      .then(data => setMaxQuestions(data.length || 20))
      .catch(err => {
        console.error('Failed to load flashcards for area:', err.message);
        setMaxQuestions(20);
      });
  }, [area]);
  return (
    <div className="pretest-page">
      <Topbar />
      <div className="pretest-card">
  <h2>Configura il test: <span className="accent">{area}</span></h2>
        <label>Numero domande:
          <input type="number" min={1} max={maxQuestions} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="modern-input" />
        </label>
        <button className="modern-btn" onClick={() => navigate(`/test/${area}/${numQuestions}`)}>Inizia il test</button>
      </div>
    </div>
  );
}


function TestPage() {
  const { area, num } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState([]);
  const [times, setTimes] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showStats, setShowStats] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(Date.now());
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    // If we have an active custom test in sessionStorage, use it
    try {
      const active = JSON.parse(sessionStorage.getItem('activeCustomTest') || 'null');
      if (active && active.name === area) {
        setQuestions(active.questions.slice(0, parseInt(num)));
        setStartTime(Date.now());
        setTimes([]);
        setSelected([]);
        setShowStats(false);
        setResult(null);
        timerRef.current = Date.now();
        // clear the active flag so subsequent navigations behave normally
        sessionStorage.removeItem('activeCustomTest');
        return;
      }
    } catch (err) {
      // ignore parse errors
    }

    safeFetch(`${API_HOST}/flash/thematic/${area}`)
      .then(data => {
        const shuffled = data.sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, parseInt(num)));
        setStartTime(Date.now());
        setTimes([]);
        setSelected([]);
        setShowStats(false);
        setResult(null);
        timerRef.current = Date.now();
      })
      .catch(err => {
        console.error('Failed to load flashcards for test:', err.message);
        setQuestions([]);
      });
  }, [area, num]);

  const computeAndSave = (selectedArr, timesArr) => {
    if (!questions.length) return;
    const answers = questions.map((qq, idx) => {
      const userIdx = selectedArr[idx];
      const userAnswer = qq.answers[userIdx]?.text || '';
      const correct = qq.answers.find(a => a.isCorrect);
      return {
        question: qq.question,
        userAnswer,
        correctAnswer: correct ? correct.text : '',
        isCorrect: !!(correct && correct.text === userAnswer),
        time: timesArr[idx] || 0
      };
    });
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalTime = timesArr.reduce((a, b) => a + b, 0);
    const payload = { userId, area, numQuestions: questions.length, answers, correctCount, totalTime };

    setShowStats(true);
    setResult(null);

    fetch(`${API_HOST}/testresult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => setResult({ ...payload, ...data }))
      .catch(() => setResult({ ...payload }));
  };

  const handleAnswer = (i) => {
    const now = Date.now();
    const newTimes = [...times];
    newTimes[current] = now - timerRef.current;
    setTimes(newTimes);
    const newSelected = [...selected];
    newSelected[current] = i;
    setSelected(newSelected);
    timerRef.current = now;
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }
    // ultima risposta: calcola e salva subito
    if (newSelected.length === questions.length && newSelected.every(s => typeof s !== 'undefined')) {
      computeAndSave(newSelected, newTimes);
    }
  };

  if (!questions.length) return <div>Caricamento domande...</div>;
  const q = questions[current];

  if (showStats && !result) return <div className="test-page"><h2>Calcolo risultati...</h2></div>;
  if (showStats && result) {
    const { answers, correctCount, totalTime } = result;
    const avgTime = (totalTime / answers.length / 1000).toFixed(2);
    const percent = Math.round((correctCount / answers.length) * 100);
    return (
    <div className="test-page">
          <div className="header">
            <h2>Risultato Test: <span className="header-accent">{area}</span></h2>
            <div className="go-tests">
              <button className="modern-btn" onClick={() => {
              navigate('/dashboard');
              setTimeout(() => {
                const el = document.getElementById('tests');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else window.location.hash = '#tests';
              }, 160);
            }}>Vai alla sezione test</button>
          </div>
          </div>
          <div className="test-stats-box">
          <div><b>Domande totali:</b> {answers.length}</div>
          <div><b>Corrette:</b> {correctCount}</div>
          <div><b>Tempo totale:</b> {(totalTime/1000).toFixed(2)}s</div>
          <div><b>Tempo medio per domanda:</b> {avgTime}s</div>
          <div><b>Percentuale superamento:</b> {percent}%</div>
        </div>
          <div className="results-grid">
            <b>Domande sbagliate:</b>
            <div className="container">
              <div className="question-item">
                {answers.filter(a=>!a.isCorrect).map((a,i)=>(
                  <div key={i} className="question-box">
                    <div className="q-title">{i+1}. {a.question}</div>
                    <div className="answer-given">Risposta data: <span className="wrong">{a.userAnswer}</span></div>
                    <div className="answer-correct">Risposta corretta: <span className="correct">{a.correctAnswer}</span></div>
                  </div>
                ))}
                {answers.filter(a=>!a.isCorrect).length===0 && (
                  <div className="all-correct">Tutte corrette!</div>
                )}
              </div>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="test-page">
      <h2 className="question-count">Domanda {current + 1} / {questions.length}</h2>
      <div className="flashcard">
        <div className="question">{q.question}</div>
        <div className="answers">
          {q.answers.map((a, i) => (
            <button
              key={i}
              className={selected[current] === i ? 'modern-btn selected' : 'modern-btn'}
              onClick={()=>!showStats && handleAnswer(i)}
              disabled={showStats}
            >
              {a.text}
            </button>
          ))}
        </div>
      </div>
      <div className="test-nav">
        <button className="modern-btn" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>Indietro</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
  <Route path="/crea-test" element={<RequireAuth><CreateTestPage /></RequireAuth>} />
  <Route path="/pretest/:area" element={<RequireAuth><PreTestPage /></RequireAuth>} />
  <Route path="/test/:area/:num" element={<RequireAuth><TestPage /></RequireAuth>} />
  <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
