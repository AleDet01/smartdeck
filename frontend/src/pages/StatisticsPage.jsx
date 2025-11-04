import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/StatisticsPage.css';
import API_HOST from '../utils/apiHost';

const StatisticsPage = () => {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedArea, setSelectedArea] = useState('all');
	const navigate = useNavigate();

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const res = await fetch(`${API_HOST}/statistics`, { credentials: 'include' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				setStats(data);
			} catch (err) {
				console.error('Errore nel caricamento delle statistiche:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	if (loading) {
		return (
			<div className="statistics-page">
				<PageBackground />
				<Topbar />
				<div className="stats-container">
					<div className="loading-text">Caricamento statistiche...</div>
				</div>
			</div>
		);
	}

	if (!stats || stats.totalSessions === 0) {
		return (
			<div className="statistics-page">
				<PageBackground />
				<Topbar />
				<div className="stats-container">
					<div className="stats-header">
						<h1>Statistiche</h1>
						<p className="stats-subtitle">Le tue performance nei test</p>
					</div>
					<div className="no-data">
						<p>Nessun test completato ancora. Inizia a fare test per vedere le tue statistiche!</p>
						<button className="modern-btn" onClick={() => navigate('/dashboard')}>
							Vai alla Dashboard
						</button>
					</div>
				</div>
			</div>
		);
	}

	const areas = Object.keys(stats.byArea || {});
	const displayStats = selectedArea === 'all' ? stats : stats.byArea[selectedArea];

	return (
		<div className="statistics-page">
			<PageBackground />
			<Topbar />
			<div className="stats-container">
				<div className="stats-header">
					<h1>Statistiche Dettagliate</h1>
					<p className="stats-subtitle">Monitora i tuoi progressi e performance</p>
				</div>

				{/* Filtro per area */}
				{areas.length > 0 && (
					<div className="area-filter">
						<button 
							className={selectedArea === 'all' ? 'filter-btn active' : 'filter-btn'}
							onClick={() => setSelectedArea('all')}
						>
							Tutte le Aree
						</button>
						{areas.map(area => (
							<button 
								key={area}
								className={selectedArea === area ? 'filter-btn active' : 'filter-btn'}
								onClick={() => setSelectedArea(area)}
							>
								{area}
							</button>
						))}
					</div>
				)}

				{/* KPI Cards principali */}
				<div className="kpi-grid">
					<div className="kpi-card">
						<div className="kpi-icon"></div>
						<div className="kpi-value">{selectedArea === 'all' ? stats.totalSessions : displayStats.totalSessions}</div>
						<div className="kpi-label">Test Completati</div>
					</div>
					<div className="kpi-card">
						<div className="kpi-icon"></div>
						<div className="kpi-value">{selectedArea === 'all' ? stats.totalQuestions : displayStats.totalQuestions}</div>
						<div className="kpi-label">Domande Totali</div>
					</div>
					<div className="kpi-card success">
						<div className="kpi-icon"></div>
						<div className="kpi-value">{selectedArea === 'all' ? stats.totalCorrect : displayStats.totalCorrect}</div>
						<div className="kpi-label">Risposte Corrette</div>
					</div>
					<div className="kpi-card danger">
						<div className="kpi-icon"></div>
						<div className="kpi-value">{selectedArea === 'all' ? stats.totalWrong : displayStats.totalWrong}</div>
						<div className="kpi-label">Risposte Sbagliate</div>
					</div>
				</div>

				{/* Score medio e tempo medio */}
				<div className="secondary-stats">
					<div className="stat-box">
						<div className="stat-icon">🏆</div>
						<div className="stat-content">
							<div className="stat-value">{selectedArea === 'all' ? stats.averageScore.toFixed(1) : displayStats.averageScore.toFixed(1)}%</div>
							<div className="stat-label">Score Medio</div>
						</div>
					</div>
					{selectedArea === 'all' && (
						<>
							<div className="stat-box">
								<div className="stat-icon">⏱️</div>
								<div className="stat-content">
									<div className="stat-value">{formatDuration(stats.averageDuration)}</div>
									<div className="stat-label">Tempo Medio</div>
								</div>
							</div>
							<div className="stat-box">
								<div className="stat-icon">🔥</div>
								<div className="stat-content">
									<div className="stat-value">{stats.currentStreak}</div>
									<div className="stat-label">Streak Attuale</div>
								</div>
							</div>
							<div className="stat-box">
								<div className="stat-icon">⭐</div>
								<div className="stat-content">
									<div className="stat-value">{stats.maxStreak}</div>
									<div className="stat-label">Miglior Streak</div>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Best & Worst Performance (solo per "all") */}
				{selectedArea === 'all' && stats.bestSession && (
					<div className="performance-section">
						<h2>Performance</h2>
						<div className="performance-grid">
							<div className="performance-card best">
								<h3>Miglior Test</h3>
								<div className="perf-detail">
									<span className="perf-area">{stats.bestSession.thematicArea}</span>
									<span className="perf-score">{stats.bestSession.score}%</span>
								</div>
								<div className="perf-date">{new Date(stats.bestSession.date).toLocaleDateString('it-IT')}</div>
							</div>
							<div className="performance-card worst">
								<h3>Test da Migliorare</h3>
								<div className="perf-detail">
									<span className="perf-area">{stats.worstSession.thematicArea}</span>
									<span className="perf-score">{stats.worstSession.score}%</span>
								</div>
								<div className="perf-date">{new Date(stats.worstSession.date).toLocaleDateString('it-IT')}</div>
							</div>
						</div>
					</div>
				)}

				{/* Grafico Progresso nel Tempo */}
				{selectedArea === 'all' && stats.progressOverTime && stats.progressOverTime.length > 0 && (
					<div className="chart-section">
						<h2>Progresso nel Tempo</h2>
						<div className="chart-container">
							<SimpleLineChart data={stats.progressOverTime} />
						</div>
					</div>
				)}

				{/* Performance per Area Tematica */}
				{selectedArea === 'all' && Object.keys(stats.byArea).length > 0 && (
					<div className="area-performance-section">
						<h2>Performance per Area Tematica</h2>
						<div className="area-bars">
							{Object.entries(stats.byArea).map(([areaName, areaData]) => (
								<div key={areaName} className="area-bar-item">
									<div className="area-bar-label">
										<span className="area-name">{areaName}</span>
										<span className="area-score">{areaData.averageScore.toFixed(1)}%</span>
									</div>
									<div className="area-bar-container">
										<div 
											className="area-bar-fill" 
											style={{ 
												width: `${areaData.averageScore}%`,
												backgroundColor: getScoreColor(areaData.averageScore)
											}}
										></div>
									</div>
									<div className="area-bar-stats">
										<span>{areaData.totalSessions} test</span>
										<span>Best: {areaData.bestScore}%</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Tabella Sessioni Recenti */}
				<div className="recent-sessions-section">
					<h2>Sessioni Recenti</h2>
					<div className="sessions-table">
						<div className="table-header">
							<div className="th">Data</div>
							<div className="th">Area</div>
							<div className="th">Score</div>
							<div className="th">Domande</div>
							<div className="th">Tempo</div>
						</div>
						<div className="table-body">
							{(selectedArea === 'all' ? stats.recentSessions : displayStats.sessions?.slice(0, 10) || []).map((session, idx) => (
								<div key={session.id || idx} className="table-row">
									<div className="td">{new Date(session.completedAt).toLocaleDateString('it-IT')}</div>
									<div className="td">{session.thematicArea}</div>
									<div className="td">
										<span className={`score-badge ${getScoreClass(session.score)}`}>
											{session.score}%
										</span>
									</div>
									<div className="td">{session.correctAnswers}/{session.totalQuestions}</div>
									<div className="td">{formatDuration(session.duration)}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Componente semplice per grafico lineare
const SimpleLineChart = ({ data }) => {
	if (!data || data.length === 0) return null;

	const maxScore = 100;
	const minScore = 0;
	const height = 200;
	const width = 100; // percentuale

	const points = data.map((item, idx) => {
		const x = (idx / (data.length - 1)) * 100;
		const y = height - ((item.score - minScore) / (maxScore - minScore)) * height;
		return `${x},${y}`;
	}).join(' ');

	return (
		<div className="simple-chart">
			<svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="chart-svg">
				{/* Linee di riferimento */}
				<line x1="0" y1={height * 0.25} x2="100" y2={height * 0.25} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
				<line x1="0" y1={height * 0.5} x2="100" y2={height * 0.5} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
				<line x1="0" y1={height * 0.75} x2="100" y2={height * 0.75} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
				
				{/* Linea del grafico */}
				<polyline
					points={points}
					fill="none"
					stroke="url(#lineGradient)"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				
				{/* Area sotto la linea */}
				<polygon
					points={`0,${height} ${points} 100,${height}`}
					fill="url(#areaGradient)"
					opacity="0.3"
				/>

				<defs>
					<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#ffd60a" />
						<stop offset="100%" stopColor="#3b82f6" />
					</linearGradient>
					<linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="transparent" />
					</linearGradient>
				</defs>
			</svg>
			<div className="chart-labels">
				<span>Sessione 1</span>
				<span>Sessione {data.length}</span>
			</div>
		</div>
	);
};

// Utility functions
const formatDuration = (seconds) => {
	if (!seconds) return '0s';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const getScoreColor = (score) => {
	if (score >= 80) return '#10b981'; // verde
	if (score >= 60) return '#3b82f6'; // blu
	if (score >= 40) return '#f59e0b'; // arancione
	return '#ef4444'; // rosso
};

const getScoreClass = (score) => {
	if (score >= 80) return 'excellent';
	if (score >= 60) return 'good';
	if (score >= 40) return 'fair';
	return 'poor';
};

export default StatisticsPage;
