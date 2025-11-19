import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import Topbar from '../components/Topbar';
import PageBackground from '../components/PageBackground';
import LEDEffect from '../components/LEDEffect';
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

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="custom-tooltip">
				<p className="tooltip-label">{`Test ${label}`}</p>
				<p className="tooltip-score" style={{ color: payload[0].stroke }}>
					{`Score: ${payload[0].value}%`}
				</p>
				{payload[0].payload.thematicArea && (
					<p className="tooltip-area">{payload[0].payload.thematicArea}</p>
				)}
			</div>
		);
	}
	return null;
};

const StatisticsPage = () => {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedArea, setSelectedArea] = useState('all');
	const navigate = useNavigate();
	const { t } = useTranslation();

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

	// Distribuzione score per PieChart
	const scoreDistributionData = useMemo(() => {
		if (!stats || !stats.sessions) return [];
		
		const dist = { excellent: 0, good: 0, fair: 0, poor: 0 };
		stats.sessions.forEach(s => {
			if (s.score >= 90) dist.excellent++;
			else if (s.score >= 70) dist.good++;
			else if (s.score >= 50) dist.fair++;
			else dist.poor++;
		});

		return [
			{ name: t('statistics.excellent'), value: dist.excellent, color: '#10b981' },
			{ name: t('statistics.good'), value: dist.good, color: '#3b82f6' },
			{ name: t('statistics.fair'), value: dist.fair, color: '#f59e0b' },
			{ name: t('statistics.poor'), value: dist.poor, color: '#ef4444' }
		].filter(item => item.value > 0);
	}, [stats, t]);

	// Dati per Radar Chart (Performance per Area)
	const radarData = useMemo(() => {
		if (!stats || !stats.byArea) return [];
		return Object.entries(stats.byArea).map(([area, data]) => ({
			subject: area,
			A: data.averageScore,
			fullMark: 100
		})).slice(0, 6); // Limit to top 6 areas to avoid clutter
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
					<div className="loading-text">{t('statistics.loading')}</div>
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
						<h1>{t('statistics.title')}</h1>
						<p className="stats-subtitle">{t('statistics.subtitle')}</p>
					</div>
					<div className="no-data">
						<p>{t('statistics.noDataMessage')}</p>
						<button className="modern-btn" onClick={() => navigate('/dashboard')}>
							{t('statistics.goToDashboard')}
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
			<LEDEffect variant="corner" color="green" />
			<Topbar />
			<div className="stats-container">
				<div className="stats-header">
					<div className="header-content">
						<h1>{t('statistics.pageTitle')}</h1>
						<p className="stats-subtitle">{t('statistics.pageSubtitle')}</p>
					</div>
					
					{/* Filtro per area */}
					{areas.length > 0 && (
						<div className="area-filter">
							<button 
								className={selectedArea === 'all' ? 'filter-btn active' : 'filter-btn'}
								onClick={() => setSelectedArea('all')}
							>
								{t('statistics.overallAnalysis')}
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
				</div>

				{/* Main Dashboard Grid */}
				<div className="dashboard-grid">
					
					{/* 1. Summary Cards Row */}
					<div className="summary-cards-row">
						<div className="summary-card">
							<div className="summary-icon">📊</div>
							<div className="summary-info">
								<span className="summary-value">{stats.totalSessions}</span>
								<span className="summary-label">{t('statistics.completedSessions')}</span>
							</div>
						</div>
						<div className="summary-card">
							<div className="summary-icon">⏱️</div>
							<div className="summary-info">
								<span className="summary-value">{advancedMetrics?.totalStudyTime}</span>
								<span className="summary-label">{t('statistics.totalStudyTime')}</span>
							</div>
						</div>
						<div className="summary-card">
							<div className="summary-icon">🎯</div>
							<div className="summary-info">
								<span className="summary-value">{stats.averageScore.toFixed(1)}%</span>
								<span className="summary-label">{t('statistics.averagePerformance')}</span>
							</div>
						</div>
						<div className="summary-card">
							<div className="summary-icon">📈</div>
							<div className="summary-info">
								<span className="summary-value">{(100 - advancedMetrics?.consistency).toFixed(1)}%</span>
								<span className="summary-label">{t('statistics.standardDeviation')}</span>
							</div>
						</div>
					</div>

					{/* 2. Charts Row (Progress & Radar) */}
					{selectedArea === 'all' && (
						<div className="charts-row">
							<div className="chart-card large">
								<h3 className="chart-title">{t('statistics.timeAnalysisTitle')}</h3>
								<div className="chart-wrapper">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={stats.progressOverTime}>
											<defs>
												<linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
													<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
											<XAxis dataKey="sessionNumber" stroke="#9ca3af" />
											<YAxis stroke="#9ca3af" domain={[0, 100]} />
											<Tooltip content={<CustomTooltip />} />
											<Area 
												type="monotone" 
												dataKey="score" 
												stroke="#3b82f6" 
												fillOpacity={1} 
												fill="url(#colorScore)" 
											/>
										</AreaChart>
									</ResponsiveContainer>
								</div>
							</div>
							
							<div className="chart-card medium">
								<h3 className="chart-title">{t('statistics.areaPerformanceTitle')}</h3>
								<div className="chart-wrapper">
									<ResponsiveContainer width="100%" height="100%">
										<RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
											<PolarGrid stroke="rgba(255,255,255,0.2)" />
											<PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
											<PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
											<Radar
												name="Performance"
												dataKey="A"
												stroke="#10b981"
												fill="#10b981"
												fillOpacity={0.6}
											/>
											<Tooltip />
										</RadarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					)}

					{/* 3. Distribution & KPI Row */}
					{selectedArea === 'all' && (
						<div className="mixed-row">
							<div className="chart-card medium">
								<h3 className="chart-title">{t('statistics.distributionTitle')}</h3>
								<div className="chart-wrapper">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={scoreDistributionData}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={80}
												paddingAngle={5}
												dataKey="value"
											>
												{scoreDistributionData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
											<Legend />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</div>

							<div className="kpi-grid-compact">
								<div className="kpi-box">
									<span className="kpi-box-label">{t('statistics.accuracyRate')}</span>
									<span className="kpi-box-value">{advancedMetrics?.accuracyRate.toFixed(1)}%</span>
									<div className="kpi-progress">
										<div className="kpi-progress-bar" style={{width: `${advancedMetrics?.accuracyRate}%`, background: '#10b981'}}></div>
									</div>
								</div>
								<div className="kpi-box">
									<span className="kpi-box-label">{t('statistics.consistencyIndex')}</span>
									<span className="kpi-box-value">{advancedMetrics?.consistency.toFixed(1)}%</span>
									<div className="kpi-progress">
										<div className="kpi-progress-bar" style={{width: `${advancedMetrics?.consistency}%`, background: '#3b82f6'}}></div>
									</div>
								</div>
								<div className="kpi-box">
									<span className="kpi-box-label">{t('statistics.improvementCoef')}</span>
									<span className="kpi-box-value" style={{color: advancedMetrics?.improvementTrend > 0 ? '#10b981' : '#ef4444'}}>
										{advancedMetrics?.improvementTrend > 0 ? '+' : ''}{advancedMetrics?.improvementTrend.toFixed(1)}%
									</span>
								</div>
								<div className="kpi-box">
									<span className="kpi-box-label">{t('statistics.currentStreak')}</span>
									<span className="kpi-box-value">{stats.currentStreak} 🔥</span>
								</div>
							</div>
						</div>
					)}

					{/* 4. Recent Sessions Table */}
					<div className="recent-sessions-section">
						<h2 className="section-title">{t('statistics.recentLogTitle')}</h2>
						<div className="sessions-table">
							<div className="table-header">
								<div className="th">{t('statistics.tableDate')}</div>
								<div className="th">{t('statistics.tableArea')}</div>
								<div className="th">{t('statistics.tableScore')}</div>
								<div className="th">{t('statistics.tableQuestions')}</div>
								<div className="th">{t('statistics.tableTime')}</div>
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
		</div>
	);
};

export default StatisticsPage;
