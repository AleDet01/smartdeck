import { lazy } from 'react';

// Lazy load pages pesanti
export const AIAssistantPage = lazy(() => import('../pages/AIAssistantPage'));
export const StatisticsPage = lazy(() => import('../pages/StatisticsPage'));
export const TestPage = lazy(() => import('../pages/TestPage'));
export const CreateTestPage = lazy(() => import('../pages/CreateTestPage'));
export const PreTestPage = lazy(() => import('../pages/PreTestPage'));
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const LandingPage = lazy(() => import('../pages/LandingPage'));
