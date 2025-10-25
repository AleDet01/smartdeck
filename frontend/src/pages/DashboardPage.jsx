
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/DashboardPage.css'
import Topbar from '../components/Topbar';
import API_HOST from '../utils/apiHost';

const IMAGE_TOPICS = [
	'abstract', 'geometry', 'minimal', 'gradient', 'pattern', 'texture',
	'landscape', 'mountains', 'desert', 'forest', 'aerial', 'sea', 'ice', 'mist', 'dunes'
];

const makeConceptImageUrl = (name, idx) => {
	const topic = IMAGE_TOPICS[(name.length + idx) % IMAGE_TOPICS.length];
	return `https://source.unsplash.com/600x400/?${encodeURIComponent(topic)},minimal`;
};

const GRADIENTS = [
	['#dbeafe', '#bfdbfe'], // soft blue
	['#e2e8f0', '#cbd5e1'], // slate/gray
	['#fde68a', '#f59e0b'], // warm yellow
	['#e9d5ff', '#c4b5fd'], // purple tint
	['#ccfbf1', '#5eead4'], // teal
	['#fee2e2', '#fecaca'], // soft red
	['#dcfce7', '#86efac']  // green
];

const makeGradientDataUrl = (idx = 0) => {
	const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/></svg>`;
	return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

function DashboardPage() {
	const navigate = useNavigate();
	const [areas, setAreas] = useState(null);

	useEffect(() => {
		const controller = new AbortController();

		(async () => {
			try {
				const res = await fetch(`${API_HOST}/flash/areas/list`, { signal: controller.signal, credentials: 'include' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				const list = Array.isArray(data.areas) ? data.areas : (data && data.areas) || [];
								const mapped = list.map((name, idx) => {
					const safeName = String(name || '').trim() || `area-${idx}`;
									return { name: safeName, img: makeConceptImageUrl(safeName, idx), fallback: makeGradientDataUrl(idx) };
				});
				setAreas(mapped);
			} catch (err) {
				if (err.name === 'AbortError') return;
				console.error('Errore fetching thematic areas:', err);
				setAreas([]);
			}
		})();

		return () => controller.abort();
	}, []);

	useLayoutEffect(() => {
		if (!areas || areas.length === 0) return;
		const MIN_PX = 12, STEP_PX = 1;
		const adjustAll = () => {
			const nodes = Array.from(document.querySelectorAll('.area-title'));
			nodes.forEach(node => {
				node.style.fontSize = '';
				const containerWidth = node.clientWidth;
				const computed = window.getComputedStyle(node);
				let fontPx = parseFloat(computed.fontSize) || 16;
				const fits = () => node.scrollWidth <= containerWidth + 1;
				let safety = 100;
				while (!fits() && fontPx > MIN_PX && safety-- > 0) {
					fontPx = Math.max(MIN_PX, fontPx - STEP_PX);
					node.style.fontSize = fontPx + 'px';
				}
			});
		};
		let raf = requestAnimationFrame(() => setTimeout(adjustAll, 0));
		const onResize = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setTimeout(adjustAll, 0)); };
		window.addEventListener('resize', onResize);
		const retry = setTimeout(adjustAll, 250);
		return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); clearTimeout(retry); };
	}, [areas]);

	if (areas === null) {
		return (
			<div className="dashboard-page">
				<div className="page-bg-wrapper" aria-hidden="true">
					<img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
				</div>
				<Topbar />
				<div className="areas-grid" id="tests">
					<div>Caricamento aree...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<div className="page-bg-wrapper" aria-hidden="true">
				<img className="page-bg" src={process.env.PUBLIC_URL + '/sfondo_pages.jpg'} alt="" />
			</div>
			<Topbar />
			<div className="areas-grid">
				{areas.length === 0 && (
					<div>Nessuna area disponibile con flashcards.</div>
				)}
				{areas.map(area => (
					<div key={area.name} className="area-box">
							<img className="area-bg" src={area.img} alt={area.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = area.fallback; }} />
						<div className="area-title">{area.name}</div>
						<div className="area-content">
							<button className="area-play-btn-icon" onClick={() => navigate(`/pretest/${area.name}`)} aria-label={`Play ${area.name}`}>
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
}

export default DashboardPage;
