import React from 'react';
import '../css/LoadingFallback.css';

const LoadingFallback = () => {
  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p>Caricamento...</p>
    </div>
  );
};

export default LoadingFallback;
