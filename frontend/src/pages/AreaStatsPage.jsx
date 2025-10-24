import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Topbar from '../components/Topbar';
import AreaChart from '../components/AreaChart';
import StatsBox from '../components/StatsBox';
import '../css/DashboardPage.css';
import '../css/StatsPage.css';
import API_HOST from '../utils/apiHost';

export default function AreaStatsPage() {
  const { area } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ attempts: 0, avg: 0, best: 0 });
  const [wrong, setWrong] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const meRes = await fetch(`${API_HOST}/auth/me`, { credentials: 'include', signal: controller.signal });
        const me = await meRes.json();
        if (!meRes.ok || !me || !me.authenticated || !me.user) {
          setData([]);
          setSummary({ attempts: 0, avg: 0, best: 0 });
          setWrong([]);
          return;
        }
        const statsRes = await fetch(`${API_HOST}/testresult/${encodeURIComponent(me.user.id)}/${encodeURIComponent(area)}`, { credentials: 'include', signal: controller.signal });
        if (statsRes.ok) {
          const json = await statsRes.json();
          const results = Array.isArray(json.results) ? json.results : [];
          if (json.stats) {
            setSummary({
              attempts: json.stats.totalTests || 0,
              avg: Math.round((json.stats.avgScore || 0) * 100),
              best: results.length ? Math.max(...results.map(r => Math.round((r.correctCount / r.numQuestions) * 100))) : 0
            });
            const series = results.map((r, idx) => ({ label: `#${results.length - idx}`, score: Math.round((r.correctCount / r.numQuestions) * 100) })).reverse();
            setData(series);
          } else {
            setSummary({ attempts: 0, avg: 0, best: 0 });
            setData([]);
          }
        } else {
          setSummary({ attempts: 0, avg: 0, best: 0 });
          setData([]);
        }
        // wrong answers
        const wrongRes = await fetch(`${API_HOST}/testresult/wrong/${encodeURIComponent(me.user.id)}/${encodeURIComponent(area)}?limit=50`, { credentials: 'include', signal: controller.signal });
        if (wrongRes.ok) {
          const w = await wrongRes.json();
          setWrong(Array.isArray(w.wrong) ? w.wrong : []);
        } else {
          setWrong([]);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setData([]);
        setSummary({ attempts: 0, avg: 0, best: 0 });
        setWrong([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [area]);

  return (
    <div className="dashboard-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="area-stats-wrapper">
        <h2 style={{ margin: '18px 24px' }}>Statistiche: {area}</h2>
        {loading ? (
          <div style={{ padding: 24 }}>Caricamento...</div>
        ) : (
          <>
            <div className="stats-row">
              <StatsBox title="Tentativi" value={summary.attempts} description="Numero totale di test" />
              <StatsBox title="Punteggio medio" value={`${summary.avg}%`} description="Media sui test" />
              <StatsBox title="Miglior punteggio" value={`${summary.best}%`} description="Record personale" />
            </div>

            <div className="chart-card" style={{ margin: 24 }}>
              <h3 style={{ margin: '8px 0' }}>Andamento punteggi</h3>
              <AreaChart data={data} dataKey="score" height={260} />
            </div>

            <div className="chart-card" style={{ margin: 24, maxHeight: 260, overflowY: 'auto' }}>
              <h3 style={{ margin: '8px 0' }}>Risposte sbagliate recenti</h3>
              {wrong.length === 0 ? (
                <div style={{ color: '#64748b' }}>Nessun errore registrato per questa area.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {wrong.map((w, i) => (
                    <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600 }}>{w.question}</div>
                      <div style={{ fontSize: 13, color: '#ef4444' }}>Tua risposta: {w.userAnswer}</div>
                      <div style={{ fontSize: 13, color: '#16a34a' }}>Corretta: {w.correctAnswer}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
