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
  const [showStats, setShowStats] = useState(false);
  const [startTime] = useState(Date.now());
  const navigate = useNavigate();

  const resetStateForTest = qs => {
    setQuestions(qs);
    setAllAnswers(Array(qs.length).fill(null));
    setSelectedAnswer(null);
    setShowStats(false);
  };

  useEffect(() => {
    const controller = new AbortController();
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

  const handleAnswer = (i) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(i);
    setAllAnswers(prev => { const copy = [...prev]; copy[current] = i; return copy; });
    
    document.activeElement?.blur?.();

    setTimeout(() => {
      setSelectedAnswer(null);
      if (current < questions.length - 1) {
        setCurrent(prev => prev + 1);
      } else {
        setShowStats(true);
      }
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

  if (showStats) {
    const correctCount = allAnswers.filter((ansIdx, qIdx) => {
      const selected = questions[qIdx]?.answers[ansIdx];
      return selected?.isCorrect;
    }).length;
    const percent = Math.round((correctCount / questions.length) * 100);
    const duration = Math.floor((Date.now() - startTime) / 1000); // durata in secondi

    // Salva la sessione nel database
    React.useEffect(() => {
      const saveSession = async () => {
        try {
          const sessionData = {
            thematicArea: area,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            wrongAnswers: questions.length - correctCount,
            score: percent,
            duration,
            questions: questions.map((q, idx) => {
              const userIdx = allAnswers[idx];
              const userAns = typeof userIdx === 'number' ? q.answers[userIdx] : null;
              const correctAns = q.answers.find(a => a.isCorrect);
              const correctIdx = q.answers.findIndex(a => a.isCorrect);
              return {
                questionId: q._id,
                questionText: q.question,
                userAnswerIndex: userIdx ?? -1,
                userAnswerText: userAns?.text || 'Nessuna risposta',
                correctAnswerIndex: correctIdx,
                correctAnswerText: correctAns?.text || '',
                isCorrect: userAns?.isCorrect || false,
                timeSpent: 0
              };
            })
          };

          await fetch(`${API_HOST}/statistics/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(sessionData)
          });
        } catch (err) {
          console.error('Errore nel salvare la sessione:', err);
        }
      };
      saveSession();
    }, []);
    
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
              <button className="modern-btn" onClick={() => navigate('/dashboard')}>
                Torna alla dashboard
              </button>
            </div>
          </div>
        </div>
        <div className="test-stats-box">
          <div><b>Domande totali:</b> {questions.length}</div>
          <div><b>Corrette:</b> {correctCount}</div>
          <div><b>Percentuale superamento:</b> {percent}%</div>
        </div>
        <div className="results-grid">
          <b>Domande sbagliate:</b>
          <div className="container">
            <div className="question-item">
              {questions.map((qq, idx) => {
                const userIdx = allAnswers[idx];
                const selected = typeof userIdx === 'number' ? qq.answers[userIdx] : null;
                const correct = qq.answers.find(a => a.isCorrect);
                const isCorrect = selected?.isCorrect;
                
                if (isCorrect) return null;
                
                return (
                  <div key={idx} className="question-box">
                    <div className="q-title">{idx + 1}. {qq.question}</div>
                    <div className="answer-given">Risposta data: <span className="wrong">{selected?.text || 'Nessuna'}</span></div>
                    <div className="answer-correct">Risposta corretta: <span className="correct">{correct?.text}</span></div>
                  </div>
                );
              })}
              {correctCount === questions.length && (
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
