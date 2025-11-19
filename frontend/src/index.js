import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n'; // Initialize i18n before App
import App from './App.jsx';
import { reportWebVitals } from './utils/reportWebVitals';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Traccia performance metrics (Core Web Vitals)
reportWebVitals();

// Register service worker per cache offline
serviceWorkerRegistration.unregister();


                                                                                                                              