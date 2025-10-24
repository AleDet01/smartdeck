import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import '../css/DashboardPage.css';
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
    <div className="dashboard-page">
      <div className="page-bg-wrapper" aria-hidden="true">
        <img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
      </div>
      <Topbar />
      <div style={{ padding: 24 }}>
  <h2>Statistiche per area</h2>
        {areas === null && <div>Caricamento...</div>}
  {areas && areas.length === 0 && <div>Nessuna area con test effettuati.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {areas && areas.map(a => (
            <button key={a} style={{ padding: '12px 16px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' }} onClick={() => navigate(`/stats/${encodeURIComponent(a)}`)}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
