import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import AreaChart from '../components/AreaChart';
import StatsBox from '../components/StatsBox';
import '../css/DashboardPage.css';
import '../css/StatsPage.css';
import API_HOST from '../utils/apiHost';
import { useCurrentUser, useFetch } from '../utils/hooks';

const AreaStatsPage = () => {
  const { area } = useParams();
  const { user } = useCurrentUser();
  
  const statsUrl = user?.id ? `${API_HOST}/testresult/${encodeURIComponent(user.id)}/${encodeURIComponent(area)}` : null;
  const wrongUrl = user?.id ? `${API_HOST}/testresult/wrong/${encodeURIComponent(user.id)}/${encodeURIComponent(area)}?limit=50` : null;
  
  const { data: statsData, loading: loadingStats } = useFetch(statsUrl);
  const { data: wrongData } = useFetch(wrongUrl);

  const { summary, chartData } = useMemo(() => {
    const results = statsData?.results || [];
    const stats = statsData?.stats || {};
    
    return {
      summary: {
        attempts: stats.totalTests || 0,
        avg: Math.round((stats.avgScore || 0) * 100),
        best: results.length 
          ? Math.max(...results.map(r => Math.round((r.correctCount / r.numQuestions) * 100))) 
          : 0
      },
      chartData: results
        .map((r, idx) => ({ 
          label: `#${results.length - idx}`, 
          score: Math.round((r.correctCount / r.numQuestions) * 100) 
        }))
        .reverse()
    };
  }, [statsData]);

  const wrongAnswers = wrongData?.wrong || [];

  return (
    <div className="dashboard-page">
      <PageBackground />
      <Topbar />
      <div className="area-stats-wrapper">
        <h2 style={{ margin: '18px 24px' }}>Statistiche: {area}</h2>
        {loadingStats ? (
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
              <AreaChart data={chartData} dataKey="score" height={260} />
            </div>

            <div className="chart-card" style={{ margin: 24, maxHeight: 260, overflowY: 'auto' }}>
              <h3 style={{ margin: '8px 0' }}>Risposte sbagliate recenti</h3>
              {wrongAnswers.length === 0 ? (
                <div style={{ color: '#64748b' }}>Nessun errore registrato per questa area.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {wrongAnswers.map((w, i) => (
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
};

export default AreaStatsPage;
