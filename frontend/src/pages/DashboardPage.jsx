import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/DashboardPage.css';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import API_HOST from '../utils/apiHost';
import { useFetch, useAdaptiveFontSize } from '../utils/hooks';
import { makeConceptImageUrl, makeGradientDataUrl } from '../utils/imageUtils';

const DashboardPage = () => {
	const navigate = useNavigate();
	const { data, loading } = useFetch(`${API_HOST}/flash/areas/list`);

	const areas = useMemo(() => {
		if (!data) return null;
		const list = Array.isArray(data.areas) ? data.areas : [];
		return list.map((name, idx) => {
			const safeName = String(name || '').trim() || `area-${idx}`;
			return { name: safeName, img: makeConceptImageUrl(safeName, idx), fallback: makeGradientDataUrl(idx) };
		});
	}, [data]);

	useAdaptiveFontSize('.area-title', [areas]);

	if (loading || areas === null) {
		return (
			<div className="dashboard-page">
				<PageBackground />
				<Topbar />
				<div className="areas-grid" id="tests">
					<div>Caricamento aree...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<PageBackground />
			<Topbar />
			<div className="areas-grid">
				{areas.length === 0 && <div>Nessuna area disponibile con flashcards.</div>}
				{areas.map(area => (
					<div key={area.name} className="area-box">
						<img 
							className="area-bg" 
							src={area.img} 
							alt={area.name} 
							onError={(e) => { 
								e.currentTarget.onerror = null; 
								e.currentTarget.src = area.fallback; 
							}} 
						/>
						<div className="area-title">{area.name}</div>
						<div className="area-content">
							<button 
								className="area-play-btn-icon" 
								onClick={() => navigate(`/pretest/${area.name}`)} 
								aria-label={`Play ${area.name}`}
							>
								<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
									<defs>
										<linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="0%">
											<stop offset="0%" stopColor="#ffe066"/>
											<stop offset="100%" stopColor="#ffd60a"/>
										</linearGradient>
									</defs>
									<circle cx="14" cy="14" r="14" fill="url(#playGrad)"/>
									<polygon points="11,9 20,14 11,19" fill="#23272f"/>
								</svg>
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default DashboardPage;
