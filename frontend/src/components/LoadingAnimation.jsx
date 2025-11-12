import React from 'react';
import '../css/LoadingAnimation.css';

export default function LoadingAnimation({ message = 'Caricamento...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="led-flashcard">
          {/* Card outline with LED effect */}
          <svg className="card-svg" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
            {/* Define gradient for glow effect */}
            <defs>
              <linearGradient id="ledGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#5AC8FA" stopOpacity="1" />
                <stop offset="100%" stopColor="#007AFF" stopOpacity="0.2" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Card outline path - LED traces this */}
            <path 
              className="card-outline"
              d="M 20 20 
                 L 280 20 
                 L 280 180 
                 L 20 180 
                 Z
                 M 40 60 L 260 60
                 M 40 100 L 200 100
                 M 40 140 L 220 140"
              fill="none"
              stroke="url(#ledGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {/* Moving LED dot */}
            <circle className="led-dot" r="5" fill="#5AC8FA" filter="url(#glow)">
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path="M 20 20 
                      L 280 20 
                      L 280 180 
                      L 20 180 
                      Z
                      M 40 60 L 260 60
                      M 40 100 L 200 100
                      M 40 140 L 220 140"
              />
            </circle>
          </svg>
          
          {/* Pulsing icon in center */}
          <div className="card-icon">📚</div>
        </div>
        
        <p className="loading-message">{message}</p>
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}
