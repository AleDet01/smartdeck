import React from 'react';
import '../css/LEDEffect.css';

export default function LEDEffect({ variant = 'corner', color = 'blue' }) {
  const renderCornerLEDs = () => (
    <>
      <div className={`led-corner led-top-left led-${color}`}>
        <div className="led-dot"></div>
        <div className="led-line led-line-horizontal"></div>
        <div className="led-line led-line-vertical"></div>
      </div>
      <div className={`led-corner led-top-right led-${color}`}>
        <div className="led-dot"></div>
        <div className="led-line led-line-horizontal"></div>
        <div className="led-line led-line-vertical"></div>
      </div>
      <div className={`led-corner led-bottom-left led-${color}`}>
        <div className="led-dot"></div>
        <div className="led-line led-line-horizontal"></div>
        <div className="led-line led-line-vertical"></div>
      </div>
      <div className={`led-corner led-bottom-right led-${color}`}>
        <div className="led-dot"></div>
        <div className="led-line led-line-horizontal"></div>
        <div className="led-line led-line-vertical"></div>
      </div>
    </>
  );

  const renderFloatingLEDs = () => (
    <>
      <div className={`led-floating led-float-1 led-${color}`}></div>
      <div className={`led-floating led-float-2 led-${color}`}></div>
      <div className={`led-floating led-float-3 led-${color}`}></div>
      <div className={`led-floating led-float-4 led-${color}`}></div>
      <div className={`led-floating led-float-5 led-${color}`}></div>
    </>
  );

  const renderBorderTrace = () => (
    <div className={`led-border-container led-${color}`}>
      <svg className="led-border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`ledGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.8">
              <animate attributeName="stop-opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="currentColor" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          fill="none" 
          stroke={`url(#ledGrad-${color})`}
          strokeWidth="0.5"
          className="led-border-rect"
        />
      </svg>
      <div className="led-corner-glow led-corner-glow-tl"></div>
      <div className="led-corner-glow led-corner-glow-tr"></div>
      <div className="led-corner-glow led-corner-glow-bl"></div>
      <div className="led-corner-glow led-corner-glow-br"></div>
    </div>
  );

  return (
    <div className="led-effect-container">
      {variant === 'corner' && renderCornerLEDs()}
      {variant === 'floating' && renderFloatingLEDs()}
      {variant === 'border' && renderBorderTrace()}
      {variant === 'full' && (
        <>
          {renderCornerLEDs()}
          {renderFloatingLEDs()}
        </>
      )}
    </div>
  );
}
