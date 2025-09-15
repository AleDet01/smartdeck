import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Topbar from '../components/Topbar';
import AreaChart from '../components/AreaChart';
import StatsBox from '../components/StatsBox';
import '../css/DashboardPage.css';
import '../css/StatsPage.css';

const mockData = () => {
  const labels = ['Ago', 'Set', 'Ott', 'Nov', 'Dic', 'Gen', 'Feb', 'Mar'];
  return labels.map(l => ({ label: l, score: Math.round(50 + Math.random() * 50) }));
};

export default function AreaStatsPage() {
  const { area } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ attempts: 0, avg: 0, best: 0 });

  useEffect(() => {
    const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:3000';
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_HOST}/flash/areas/${encodeURIComponent(area)}/stats`, { signal: controller.signal });
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();
        if (json && Array.isArray(json.series) && json.series.length) {
          setData(json.series);
          setSummary({ attempts: json.attempts || 0, avg: json.avg || 0, best: json.best || 0 });
        } else {
          const m = mockData(area);
          setData(m);
          setSummary({ attempts: 12, avg: Math.round(m.reduce((s, x) => s + x.score, 0) / m.length), best: Math.max(...m.map(x => x.score)) });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        const m = mockData(area);
        setData(m);
        setSummary({ attempts: 12, avg: Math.round(m.reduce((s, x) => s + x.score, 0) / m.length), best: Math.max(...m.map(x => x.score)) });
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
          </>
        )}
      </div>
    </div>
  );
}
