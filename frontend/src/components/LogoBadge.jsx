import React from 'react';
import { useLocation } from 'react-router-dom';
import '../css/LogoBadge.css';

export default function LogoBadge() {
  // Always show, including on login; keep API in case of future hide rules
  const location = useLocation(); // eslint-disable-line no-unused-vars
  const src = (process.env.PUBLIC_URL || '') + '/logo.png';
  return (
    <div className="logo-badge" aria-hidden="true">
      <img src={src} alt="" className="logo-badge-img" />
    </div>
  );
}
