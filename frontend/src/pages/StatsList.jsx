import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import '../css/StatsPage.css';
import API_HOST from '../utils/apiHost';

export default function StatsList() {
  const [areas, setAreas] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meRes = await fetch(`${API_HOST}/auth/me`, { credentials: 'include' });
        const me = await meRes.json();
        if (!meRes.ok || !me || !me.authenticated || !me.user) {
          if (mounted) setAreas([]);
          return;
        }
        const res = await fetch(`${API_HOST}/testresult/areas/list?userId=${encodeURIComponent(me.user.id)}`, { credentials: 'include' });
        const json = await res.json();
        if (mounted) setAreas(Array.isArray(json.areas) ? json.areas : []);
      } catch {
        if (mounted) setAreas([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="stats-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div className="stats-container">
        <div className="stats-header">
          <h2 className="stats-title">Statistiche</h2>
          <p className="stats-subtitle">Scegli un'area per vedere i tuoi risultati e l'andamento nel tempo.</p>
        </div>
        {areas === null && (
          <div className="stats-empty">Caricamento…</div>
        )}
        {areas && areas.length === 0 && (
          <div className="stats-empty">Nessuna area con test effettuati. Completa un test dalla dashboard per iniziare.</div>
        )}
        <div className="stats-areas-grid">
          {areas && areas.map(a => (
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
}
