import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/StatsPage.css';
import API_HOST from '../utils/apiHost';
import { useCurrentUser, useFetch } from '../utils/hooks';

const StatsList = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data, loading } = useFetch(
    user?.id ? `${API_HOST}/testresult/areas/list?userId=${encodeURIComponent(user.id)}` : null
  );

  const areas = data?.areas || [];

  return (
    <div className="stats-page">
      <PageBackground />
      <Topbar />
      <div className="stats-container">
        <div className="stats-header">
          <h2 className="stats-title">Statistiche</h2>
          <p className="stats-subtitle">Scegli un'area per vedere i tuoi risultati e l'andamento nel tempo.</p>
        </div>
        {loading && <div className="stats-empty">Caricamento…</div>}
        {!loading && areas.length === 0 && (
          <div className="stats-empty">Nessuna area con test effettuati. Completa un test dalla dashboard per iniziare.</div>
        )}
        <div className="stats-areas-grid">
          {areas.map(a => (
            <button
              key={a}
              className="stat-chip"
              onClick={() => navigate(`/stats/${encodeURIComponent(a)}`)}
            >
              <span className="chip-label">{a}</span>
              <span className="chip-arrow" aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsList;
