import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Topbar from '../components/Topbar';
import '../css/TestPage.css';
import API_HOST from '../utils/apiHost';

export default function TestPage() {
  const { area, num } = useParams();
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [allAnswers, setAllAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [startTime] = useState(Date.now());
  const [sessionSaved, setSessionSaved] = useState(false);
  const navigate = useNavigate();

  const resetStateForTest = qs => {
    setQuestions(qs);
    setAllAnswers(Array(qs.length).fill(null));
    setSelectedAnswer(null);
    setShowStats(false);
    setSessionSaved(false);
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

  // Salva la sessione quando il test è completato
  useEffect(() => {
    if (!showStats || sessionSaved || questions.length === 0) return;

    const saveSession = async () => {
      try {
        const correctCount = allAnswers.filter((ansIdx, qIdx) => {
          const selected = questions[qIdx]?.answers[ansIdx];
          return selected?.isCorrect;
        }).length;
        const percent = Math.round((correctCount / questions.length) * 100);
        const duration = Math.floor((Date.now() - startTime) / 1000);

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
        
        setSessionSaved(true);
      } catch (err) {
        console.error('Errore nel salvare la sessione:', err);
      }
    };

    saveSession();
  }, [showStats, sessionSaved, questions, allAnswers, area, startTime]);

  if (!questions.length) return (
    <div className="test-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" loading="lazy" />
      </div>
      <Topbar />
      <div style={{ padding: 24 }}>{t('test.loading')}</div>
    </div>
  );

  const q = questions[current];

  if (showStats) {
    const correctCount = allAnswers.filter((ansIdx, qIdx) => {
      const selected = questions[qIdx]?.answers[ansIdx];
      return selected?.isCorrect;
    }).length;
    const percent = Math.round((correctCount / questions.length) * 100);
    
    return (
      <div className="test-page">
        <div className="page-bg-wrapper" aria-hidden="true">
          <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" loading="lazy" />
        </div>
        <Topbar />
        <div style={{ paddingTop: 88 }}>
          <div className="header">
            <h2>{t('test.result')} <span className="header-accent">{area}</span></h2>
            <div className="go-tests">
              <button className="modern-btn" onClick={() => navigate('/dashboard')}>
                {t('test.backToDashboard')}
              </button>
            </div>
          </div>
        </div>
        <div className="test-stats-box">
          <div><b>{t('test.totalQuestions')}</b> {questions.length}</div>
          <div><b>{t('test.correct')}</b> {correctCount}</div>
          <div><b>{t('test.percentage')}</b> {percent}%</div>
        </div>
        <div className="results-grid">
          <b>{t('test.wrongQuestions')}</b>
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
                    <div className="answer-given">{t('test.yourAnswer')} <span className="wrong">{selected?.text || t('test.none')}</span></div>
                    <div className="answer-correct">{t('test.correctAnswer')} <span className="correct">{correct?.text}</span></div>
                  </div>
                );
              })}
              {correctCount === questions.length && (
                <div className="all-correct">{t('test.allCorrect')}</div>
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
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" loading="lazy" />
      </div>
      <Topbar />
      <div className="test-content">
        <h2 className="question-count">{t('test.question')} {current + 1} / {questions.length}</h2>
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
          <button className="modern-btn" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>{t('test.back')}</button>
        </div>
      </div>
    </div>
  );
}
