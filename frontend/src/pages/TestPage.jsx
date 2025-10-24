import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import '../css/TestPage.css';
import API_HOST from '../utils/apiHost';

export default function TestPage() {
  const { area, num } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [allAnswers, setAllAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [times, setTimes] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(Date.now());
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  const resetStateForTest = qs => {
    setQuestions(qs);
    setTimes(Array(qs.length).fill(0));
    setAllAnswers(Array(qs.length).fill(null));
    setSelectedAnswer(null);
    setShowStats(false);
    setResult(null);
    timerRef.current = Date.now();
  };

  useEffect(() => {
    // Resolve logged-in user via cookie session
    (async () => {
      try {
        const me = await fetch(`${API_HOST}/auth/me`, { credentials: 'include' });
        if (me.ok) {
          const data = await me.json();
          setUserId(data && data.user && (data.user.id || data.user._id) ? (data.user.id || data.user._id) : null);
        } else {
          setUserId(null);
        }
      } catch (e) {
        setUserId(null);
      }
    })();

    const controller = new AbortController();

    try {
      const active = JSON.parse(sessionStorage.getItem('activeCustomTest') || 'null');
      if (active && active.name === area) {
        resetStateForTest(active.questions.slice(0, parseInt(num)));
        sessionStorage.removeItem('activeCustomTest');
        return;
      }
    } catch (err) { }

    (async () => {
      try {
        const res = await fetch(`${API_HOST}/flash/thematic/${area}`, { signal: controller.signal, credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, parseInt(num));
        resetStateForTest(selected);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load flashcards for test:', err.message);
        setQuestions([]);
      }
    })();

    return () => controller.abort();
  }, [area, num]);

  const computeAndSave = (answersArr, timesArr) => {
    if (!questions.length) return;
    const answersData = questions.map((qq, idx) => {
      const userIdx = answersArr[idx];
      const selected = typeof userIdx === 'number' ? qq.answers[userIdx] : null;
      const correct = qq.answers.find(a => a.isCorrect);
      return {
        question: qq.question,
        userAnswer: selected ? selected.text : '',
        correctAnswer: correct ? correct.text : '',

        isCorrect: !!(selected && selected.isCorrect) || (selected && correct && selected.text === correct.text),
        time: timesArr[idx] || 0
      };
    });
    const correctCount = answersData.filter(a => a.isCorrect).length;
    const totalTime = timesArr.reduce((a, b) => a + b, 0);
    const payload = { userId: userId || null, area, numQuestions: questions.length, answers: answersData, correctCount, totalTime, createdAt: new Date().toISOString() };

    setShowStats(true);
    setResult(null);

    fetch(`${API_HOST}/testresult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(data => setResult({ ...payload, ...data }))
      .catch(err => {
        console.error('Failed saving test result:', err.message);

        setResult({ ...payload, _error: err.message });
      });
  };

  const handleAnswer = (i) => {
    const now = Date.now();

    if (selectedAnswer !== null) return;
    const elapsed = now - timerRef.current;
    setTimes(prev => {
      const copy = [...prev];
      copy[current] = elapsed;
      return copy;
    });

    setSelectedAnswer(i);
    setAllAnswers(prev => {
      const copy = [...prev];
      copy[current] = i;
      return copy;
    });

    try {
      const active = document.activeElement;
      if (active && typeof active.blur === 'function') active.blur();
    } catch (err) { }

    // Do not reset timerRef yet; special handling for last question below

    setTimeout(() => {
      setSelectedAnswer(null);
      if (current < questions.length - 1) {
        setCurrent(prev => prev + 1);
        // start timing for the next question
        timerRef.current = Date.now();
        return;
      }

      // Final question: use the captured elapsed to avoid zeroing due to timer reset
      const finalAnswers = (allAnswers.slice(0));
      finalAnswers[current] = i;
      const finalTimes = (times.slice(0));
      finalTimes[current] = elapsed;
      computeAndSave(finalAnswers, finalTimes);
    }, 300);
  };

  if (!questions.length) return (
    <div className="test-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div style={{ padding: 24 }}>Caricamento domande...</div>
    </div>
  );

  const q = questions[current];

  if (showStats && !result) return (
    <div className="test-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <h2>Calcolo risultati...</h2>
    </div>
  );

  if (showStats && result) {
    const { answers, correctCount, totalTime } = result;
    const avgTime = (totalTime / answers.length / 1000).toFixed(2);
    const percent = Math.round((correctCount / answers.length) * 100);
    return (
      <div className="test-page">
        <div className="page-bg-wrapper" aria-hidden="true">
          <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
        </div>
        <Topbar />
        <div style={{ paddingTop: 88 }}>
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
        </div>
        <div className="test-stats-box">
          <div><b>Domande totali:</b> {answers.length}</div>
          <div><b>Corrette:</b> {correctCount}</div>
          <div><b>Tempo totale:</b> {(totalTime / 1000).toFixed(2)}s</div>
          <div><b>Tempo medio per domanda:</b> {avgTime}s</div>
          <div><b>Percentuale superamento:</b> {percent}%</div>
        </div>
        <div className="results-grid">
          <b>Domande sbagliate:</b>
          <div className="container">
            <div className="question-item">
              {answers.filter(a => !a.isCorrect).map((a, i) => (
                <div key={i} className="question-box">
                  <div className="q-title">{i + 1}. {a.question}</div>
                  <div className="answer-given">Risposta data: <span className="wrong">{a.userAnswer}</span></div>
                  <div className="answer-correct">Risposta corretta: <span className="correct">{a.correctAnswer}</span></div>
                </div>
              ))}
              {answers.filter(a => !a.isCorrect).length === 0 && (
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
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="test-content">
        <h2 className="question-count">Domanda {current + 1} / {questions.length}</h2>
        <div className="flashcard">
          <div className="question">{q.question}</div>
          <div className="answers">
            {q.answers.map((a, i) => (
              <button
                key={i}
                className={selectedAnswer === i ? 'modern-btn selected' : 'modern-btn'}
                onClick={() => !showStats && handleAnswer(i)}
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
    </div>
  );
}
