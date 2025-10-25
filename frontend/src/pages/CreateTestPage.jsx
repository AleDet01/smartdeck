import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import '../css/CreateTestPage.css';

const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:3000';

export default function CreateTestPage() {
  const [testName, setTestName] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([{ question: '', answers: ['', '', ''] }]);
  const [correctIndexes, setCorrectIndexes] = useState([0]);
  const [fileName, setFileName] = useState('');

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
  const handleQuestionChange = (i, value) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, question: value } : q));
  const handleAnswerChange = (qi, ai, value) => setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, answers: q.answers.map((a, j) => j === ai ? value : a) } : q));
  const handleMarkCorrect = (qi, ai) => setCorrectIndexes(ci => { const arr = [...ci]; arr[qi] = ai; return arr; });
  const allFilled = testName && questions.every(q => q.question && q.answers.every(a => a));
  const handleImage = e => {
    const f = e.target.files && e.target.files[0];
    setFileName(f ? f.name : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      thematicArea: testName,
      questions: questions.map((q, qi) => ({ question: q.question, answers: q.answers.map((txt, idx) => ({ text: txt, isCorrect: (correctIndexes[qi] === idx) })), difficulty: 'media' }))
    };
    fetch(`${API_HOST}/flash`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      .then(() => window.location.href = '/#/dashboard')
      .catch(() => {
        try {
          const stored = JSON.parse(localStorage.getItem('customTests') || '[]');
          const newTest = { id: `custom-${Date.now()}`, name: testName, questions };
          stored.unshift(newTest);
          localStorage.setItem('customTests', JSON.stringify(stored));
          window.location.href = '/#/dashboard';
        } catch (e) { alert('Errore salvataggio test'); }
      });
  };

  return (
    <div className="create-test-page-outer">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="create-test-page">
        <div className="ct-card">
          <div className="ct-header">
            <h2>Crea un nuovo test</h2>
            <p className="ct-sub">Imposta il nome, scegli quante domande e indica la risposta corretta per ciascuna.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Nome del test (es. Algebra 1)" value={testName} onChange={e => setTestName(e.target.value)} className="modern-input" />

            <div className="ct-row">
              <input type="number" min={1} max={20} value={numQuestions} onChange={e => handleNumQuestions(Number(e.target.value))} className="modern-input" placeholder="Numero domande" />
              <div className="ct-quick">
                <button type="button" className="chip-gold" onClick={() => handleNumQuestions(5)}>5</button>
                <button type="button" className="chip-gold" onClick={() => handleNumQuestions(10)}>10</button>
                <button type="button" className="chip-gold" onClick={() => handleNumQuestions(15)}>15</button>
              </div>
            </div>

            <div className="ct-file">
              <input id="cover-image" type="file" accept="image/*" onChange={handleImage} />
              <label htmlFor="cover-image" className="file-btn">Scegli immagine (opzionale)</label>
              <span className="file-name">{fileName || 'Nessun file'}</span>
            </div>

            <div className="question-list">
              {questions.map((q, i) => (
                <div key={i} className="question-item">
                  <input type="text" placeholder={`Domanda ${i+1}`} value={q.question} onChange={e => handleQuestionChange(i, e.target.value)} className="modern-input" />
                  {q.answers.map((a, j) => (
                    <div key={j} className="answer-row">
                      <input type="text" placeholder={`Risposta ${j+1}`} value={a} onChange={e => handleAnswerChange(i, j, e.target.value)} className="modern-input" />
                      <label className="correct-pill">
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
    </div>
  );
}
