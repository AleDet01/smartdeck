import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import '../css/StatisticsPage.css';
import API_HOST from '../utils/apiHost';

// Utility functions
const calculateImprovementTrend = (progressData) => {
	if (!progressData || progressData.length < 4) return 0;
	
	const recent = progressData.slice(-10);
	const midpoint = Math.floor(recent.length / 2);
	const firstHalf = recent.slice(0, midpoint);
	const secondHalf = recent.slice(midpoint);
	
	const firstAvg = firstHalf.reduce((sum, item) => sum + item.score, 0) / firstHalf.length;
	const secondAvg = secondHalf.reduce((sum, item) => sum + item.score, 0) / secondHalf.length;
	
	return secondAvg - firstAvg;
};

const calculateConsistency = (progressData) => {
	if (!progressData || progressData.length < 2) return 0;
	
	const scores = progressData.map(item => item.score);
	const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
	const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
	const stdDev = Math.sqrt(variance);
	
	const consistency = 100 - Math.min(100, (stdDev / mean) * 100);
	return Math.max(0, consistency);
};

const formatTotalTime = (seconds) => {
	if (!seconds || seconds === 0) return '0m';
	
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	
	if (hours > 0) {
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${mins}m`;
};

const getScoreGradient = (score) => {
	if (score >= 90) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
	if (score >= 70) return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
	if (score >= 50) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
	return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
};

const formatDuration = (seconds) => {
	if (!seconds) return '0s';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const getScoreColor = (score) => {
	if (score >= 80) return '#10b981';
	if (score >= 60) return '#3b82f6';
	if (score >= 40) return '#f59e0b';
	return '#ef4444';
};

const getScoreClass = (score) => {
	if (score >= 80) return 'excellent';
	if (score >= 60) return 'good';
	if (score >= 40) return 'fair';
	return 'poor';
};

// Componente semplice per grafico lineare
const SimpleLineChart = ({ data }) => {
	if (!data || data.length === 0) return null;

	const maxScore = 100;
	const minScore = 0;
	const height = 200;

	const points = data.map((item, idx) => {
		const x = (idx / (data.length - 1)) * 100;
		const y = height - ((item.score - minScore) / (maxScore - minScore)) * height;
		return `${x},${y}`;
	}).join(' ');

	return (
		<div className="simple-chart">
			<svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="chart-svg">
				<line x1="0" y1={height * 0.25} x2="100" y2={height * 0.25} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
				<line x1="0" y1={height * 0.5} x2="100" y2={height * 0.5} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
				<line x1="0" y1={height * 0.75} x2="100" y2={height * 0.75} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
				
				<polyline
					points={points}
					fill="none"
					stroke="url(#lineGradient)"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				
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

const StatisticsPage = () => {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedArea, setSelectedArea] = useState('all');
	const navigate = useNavigate();

	// Calcola metriche avanzate
	const advancedMetrics = useMemo(() => {
		if (!stats || stats.totalSessions === 0) return null;

		const accuracyRate = (stats.totalCorrect / stats.totalQuestions) * 100;
		const improvementTrend = calculateImprovementTrend(stats.progressOverTime);
		const consistency = calculateConsistency(stats.progressOverTime);
		const timePerQuestion = stats.averageDuration / (stats.totalQuestions / stats.totalSessions);
		
		return {
			accuracyRate,
			improvementTrend,
			consistency,
			timePerQuestion,
			totalStudyTime: formatTotalTime(stats.totalSessions * stats.averageDuration),
			questionsPerSession: (stats.totalQuestions / stats.totalSessions).toFixed(1)
		};
	}, [stats]);

	// Distribuzione score
	const scoreDistribution = useMemo(() => {
		if (!stats || !stats.sessions) return { excellent: 0, good: 0, fair: 0, poor: 0 };
		
		const dist = { excellent: 0, good: 0, fair: 0, poor: 0 };
		stats.sessions.forEach(s => {
			if (s.score >= 90) dist.excellent++;
			else if (s.score >= 70) dist.good++;
			else if (s.score >= 50) dist.fair++;
			else dist.poor++;
		});
		return dist;
	}, [stats]);

	// Aree da migliorare
	const areasToImprove = useMemo(() => {
		if (!stats || !stats.byArea) return [];
		return Object.entries(stats.byArea)
			.map(([name, data]) => ({ name, avgScore: data.averageScore, sessions: data.totalSessions }))
			.sort((a, b) => a.avgScore - b.avgScore)
			.slice(0, 3);
	}, [stats]);

	// Aree di eccellenza
	const topPerformingAreas = useMemo(() => {
		if (!stats || !stats.byArea) return [];
		return Object.entries(stats.byArea)
			.map(([name, data]) => ({ name, avgScore: data.averageScore, sessions: data.totalSessions }))
			.sort((a, b) => b.avgScore - a.avgScore)
			.slice(0, 3);
	}, [stats]);

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
					<div className="header-content">
						<h1>📊 Statistiche Dettagliate</h1>
						<p className="stats-subtitle">Analisi completa delle tue performance e progressi</p>
					</div>
					<div className="header-summary">
						<div className="summary-item">
							<span className="summary-value">{stats.totalSessions}</span>
							<span className="summary-label">Test Totali</span>
						</div>
						<div className="summary-divider"></div>
						<div className="summary-item">
							<span className="summary-value">{advancedMetrics?.totalStudyTime}</span>
							<span className="summary-label">Tempo Studio</span>
						</div>
						<div className="summary-divider"></div>
						<div className="summary-item">
							<span className="summary-value">{stats.averageScore.toFixed(1)}%</span>
							<span className="summary-label">Score Medio</span>
						</div>
					</div>
				</div>

				{/* Filtro per area */}
				{areas.length > 0 && (
					<div className="area-filter">
						<button 
							className={selectedArea === 'all' ? 'filter-btn active' : 'filter-btn'}
							onClick={() => setSelectedArea('all')}
						>
							📈 Panoramica
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

				{/* Metriche Avanzate */}
				{selectedArea === 'all' && advancedMetrics && (
					<div className="advanced-metrics-section">
						<h2 className="section-title">🎯 Metriche Chiave</h2>
						<div className="metrics-grid">
							<div className="metric-card accuracy">
								<div className="metric-header">
									<div className="metric-icon">🎯</div>
									<div className="metric-value">{advancedMetrics.accuracyRate.toFixed(1)}%</div>
								</div>
								<div className="metric-label">Tasso Accuratezza</div>
								<div className="metric-description">Risposte corrette totali</div>
								<div className="metric-bar">
									<div className="metric-bar-fill" style={{width: `${advancedMetrics.accuracyRate}%`, background: '#10b981'}}></div>
								</div>
							</div>

							<div className="metric-card consistency">
								<div className="metric-header">
									<div className="metric-icon">📈</div>
									<div className="metric-value">{advancedMetrics.consistency.toFixed(1)}%</div>
								</div>
								<div className="metric-label">Consistenza</div>
								<div className="metric-description">Stabilità performance</div>
								<div className="metric-bar">
									<div className="metric-bar-fill" style={{width: `${advancedMetrics.consistency}%`, background: '#3b82f6'}}></div>
								</div>
							</div>

							<div className="metric-card improvement">
								<div className="metric-header">
									<div className="metric-icon">{advancedMetrics.improvementTrend > 0 ? '📈' : advancedMetrics.improvementTrend < 0 ? '📉' : '➡️'}</div>
									<div className="metric-value" style={{color: advancedMetrics.improvementTrend > 0 ? '#10b981' : advancedMetrics.improvementTrend < 0 ? '#ef4444' : '#6b7280'}}>
										{advancedMetrics.improvementTrend > 0 ? '+' : ''}{advancedMetrics.improvementTrend.toFixed(1)}%
									</div>
								</div>
								<div className="metric-label">Trend Miglioramento</div>
								<div className="metric-description">Ultimi 10 test</div>
							</div>

							<div className="metric-card speed">
								<div className="metric-header">
									<div className="metric-icon">⚡</div>
									<div className="metric-value">{advancedMetrics.timePerQuestion.toFixed(1)}s</div>
								</div>
								<div className="metric-label">Tempo per Domanda</div>
								<div className="metric-description">Media risposta</div>
							</div>

							<div className="metric-card streak">
								<div className="metric-header">
									<div className="metric-icon">🔥</div>
									<div className="metric-value">{stats.currentStreak}</div>
								</div>
								<div className="metric-label">Streak Attuale</div>
								<div className="metric-description">Test con score ≥60%</div>
							</div>

							<div className="metric-card questions">
								<div className="metric-header">
									<div className="metric-icon">❓</div>
									<div className="metric-value">{advancedMetrics.questionsPerSession}</div>
								</div>
								<div className="metric-label">Domande/Test</div>
								<div className="metric-description">Media per sessione</div>
							</div>
						</div>
					</div>
				)}

				{/* Distribuzione Score */}
				{selectedArea === 'all' && (
					<div className="distribution-section">
						<h2 className="section-title">📊 Distribuzione Performance</h2>
						<div className="distribution-grid">
							<div className="dist-card excellent">
								<div className="dist-icon">🏆</div>
								<div className="dist-value">{scoreDistribution.excellent}</div>
								<div className="dist-label">Eccellente</div>
								<div className="dist-range">90-100%</div>
							</div>
							<div className="dist-card good">
								<div className="dist-icon">✅</div>
								<div className="dist-value">{scoreDistribution.good}</div>
								<div className="dist-label">Buono</div>
								<div className="dist-range">70-89%</div>
							</div>
							<div className="dist-card fair">
								<div className="dist-icon">📝</div>
								<div className="dist-value">{scoreDistribution.fair}</div>
								<div className="dist-label">Sufficiente</div>
								<div className="dist-range">50-69%</div>
							</div>
							<div className="dist-card poor">
								<div className="dist-icon">📉</div>
								<div className="dist-value">{scoreDistribution.poor}</div>
								<div className="dist-label">Da Migliorare</div>
								<div className="dist-range">&lt;50%</div>
							</div>
						</div>
					</div>
				)}

				{/* Aree Top & Bottom */}
				{selectedArea === 'all' && topPerformingAreas.length > 0 && (
					<div className="areas-comparison-section">
						<div className="areas-column">
							<h2 className="section-title">🌟 Aree di Eccellenza</h2>
							<div className="areas-list">
								{topPerformingAreas.map((area, idx) => (
									<div key={area.name} className="area-item top">
										<div className="area-rank">#{idx + 1}</div>
										<div className="area-info">
											<div className="area-name">{area.name}</div>
											<div className="area-stats">{area.sessions} test</div>
										</div>
										<div className="area-score excellent">{area.avgScore.toFixed(1)}%</div>
									</div>
								))}
							</div>
						</div>

						<div className="areas-column">
							<h2 className="section-title">🎯 Aree da Migliorare</h2>
							<div className="areas-list">
								{areasToImprove.map((area, idx) => (
									<div key={area.name} className="area-item bottom">
										<div className="area-rank">#{idx + 1}</div>
										<div className="area-info">
											<div className="area-name">{area.name}</div>
											<div className="area-stats">{area.sessions} test</div>
										</div>
										<div className="area-score needs-work">{area.avgScore.toFixed(1)}%</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* KPI Cards principali */}
				<div className="kpi-section">
					<h2 className="section-title">📊 Panoramica Performance</h2>
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

export default StatisticsPage;
