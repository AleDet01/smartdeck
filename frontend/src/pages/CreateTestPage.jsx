import { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/CreateTestPage.css';
import API_HOST from '../utils/apiHost';

const CreateTestPage = () => {
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

  const handleQuestionChange = (i, value) => 
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, question: value } : q));

  const handleAnswerChange = (qi, ai, value) => 
    setQuestions(qs => qs.map((q, idx) => 
      idx === qi ? { ...q, answers: q.answers.map((a, j) => j === ai ? value : a) } : q
    ));

  const handleMarkCorrect = (qi, ai) => 
    setCorrectIndexes(ci => { const arr = [...ci]; arr[qi] = ai; return arr; });

  const allFilled = useMemo(() => 
    testName && questions.every(q => q.question && q.answers.every(a => a)),
    [testName, questions]
  );

  const handleImage = e => setFileName(e.target.files?.[0]?.name || '');

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const payload = {
      thematicArea: testName,
      questions: questions.map((q, qi) => ({
        question: q.question,
        answers: q.answers.map((txt, idx) => ({ text: txt, isCorrect: correctIndexes[qi] === idx })),
        difficulty: 'media'
      }))
    };

    try {
      const res = await fetch(`${API_HOST}/flash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      window.location.href = '/#/dashboard';
    } catch (err) {
      setSubmitError(err.message || 'Errore durante la creazione del test.');
    }
  };

  return (
    <div className="create-test-page-outer">
      <PageBackground />
      <Topbar />
      <div className="create-test-page">
        <div className="ct-card">
          <div className="ct-header">
            <h2>Crea un nuovo test</h2>
            <p className="ct-sub">Imposta il nome, scegli quante domande e indica la risposta corretta per ciascuna.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Nome del test (es. Algebra 1)" 
              value={testName} 
              onChange={e => setTestName(e.target.value)} 
              className="modern-input" 
            />

            <div className="ct-row">
              <input 
                type="number" 
                min={1} 
                max={20} 
                value={numQuestions} 
                onChange={e => handleNumQuestions(Number(e.target.value))} 
                className="modern-input" 
                placeholder="Numero domande" 
              />
              <div className="ct-quick">
                {[5, 10, 15].map(n => (
                  <button key={n} type="button" className="chip-gold" onClick={() => handleNumQuestions(n)}>
                    {n}
                  </button>
                ))}
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
                  <input 
                    type="text" 
                    placeholder={`Domanda ${i+1}`} 
                    value={q.question} 
                    onChange={e => handleQuestionChange(i, e.target.value)} 
                    className="modern-input" 
                  />
                  {q.answers.map((a, j) => (
                    <div key={j} className="answer-row">
                      <input 
                        type="text" 
                        placeholder={`Risposta ${j+1}`} 
                        value={a} 
                        onChange={e => handleAnswerChange(i, j, e.target.value)} 
                        className="modern-input" 
                      />
                      <label className="correct-pill">
                        <input 
                          type="radio" 
                          name={`correct-${i}`} 
                          checked={correctIndexes[i] === j} 
                          onChange={() => handleMarkCorrect(i, j)} 
                        />
                        <span>Corretta</span>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {submitError && <div className="error" role="alert" style={{ marginTop: 8 }}>{submitError}</div>}
            <button className="modern-btn" type="submit" disabled={!allFilled}>
              Conferma
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTestPage;
