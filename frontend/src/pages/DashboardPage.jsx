import { useState, useMemo, useEffect } from 'react';
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

	// Inizia dalla card centrale
	const [currentIndex, setCurrentIndex] = useState(0);

	// Aggiorna quando le aree vengono caricate
	useEffect(() => {
		if (areas && areas.length > 0) {
			setCurrentIndex(Math.floor(areas.length / 2));
		}
	}, [areas]);

	useAdaptiveFontSize('.area-title', [areas]);

	const handlePrev = () => {
		setCurrentIndex(prev => Math.max(0, prev - 1));
	};

	const handleNext = () => {
		setCurrentIndex(prev => Math.min((areas?.length || 0) - 1, prev + 1));
	};

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
			
			{areas && areas.length === 0 ? (
				<div className="empty-state">Nessuna area disponibile con flashcards.</div>
			) : (
				<>
					{/* Menu selezione rapida */}
					<div className="quick-select-menu">
						<div className="quick-select-scroll">
							{areas && areas.map((area, idx) => (
								<button
									key={idx}
									className={`quick-select-item ${idx === currentIndex ? 'active' : ''}`}
									onClick={() => setCurrentIndex(idx)}
									title={area.name}
								>
									{area.name}
								</button>
							))}
						</div>
					</div>

					<div className="carousel-container">
						<button 
							className="carousel-nav carousel-prev" 
							onClick={handlePrev}
							disabled={currentIndex === 0}
							aria-label="Precedente"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>

					<div className="carousel-track">
						{areas && areas.map((area, idx) => {
							const offset = idx - currentIndex;
							const isActive = offset === 0;
							const isVisible = Math.abs(offset) <= 2;
							
							return (
								<div 
									key={area.name} 
									className={`carousel-card ${isActive ? 'active' : ''}`}
									style={{
										transform: `translateX(${offset * 110}%) scale(${isActive ? 1 : 0.85})`,
										opacity: isVisible ? (isActive ? 1 : 0.4) : 0,
										pointerEvents: isActive ? 'auto' : 'none',
										filter: isActive ? 'blur(0)' : 'blur(2px)',
										zIndex: isActive ? 10 : 1
									}}
								>
									<img 
										className="card-bg" 
										src={area.img} 
										alt={area.name} 
										onError={(e) => { 
											e.currentTarget.onerror = null; 
											e.currentTarget.src = area.fallback; 
										}} 
									/>
									<div className="card-content">
										<h3 className="area-title">{area.name}</h3>
										<button 
											className="play-btn" 
											onClick={() => navigate(`/pretest/${area.name}`)} 
											aria-label={`Inizia ${area.name}`}
										>
											<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
												<path d="M6 4l10 6-10 6V4z" fill="currentColor"/>
											</svg>
										</button>
									</div>
								</div>
							);
						})}
					</div>

					<button 
						className="carousel-nav carousel-next" 
						onClick={handleNext}
						disabled={currentIndex === (areas?.length || 0) - 1}
						aria-label="Successivo"
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>

					<div className="carousel-indicators">
						{areas && areas.map((_, idx) => (
							<button
								key={idx}
								className={`indicator ${idx === currentIndex ? 'active' : ''}`}
								onClick={() => setCurrentIndex(idx)}
								aria-label={`Vai a ${idx + 1}`}
							/>
						))}
					</div>
				</div>
				</>
			)}
		</div>
	);
};

export default DashboardPage;
