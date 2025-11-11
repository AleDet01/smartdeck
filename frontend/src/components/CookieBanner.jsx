import { memo, useState, useEffect } from 'react';
import '../css/CookieBanner.css';

const CookieBanner = memo(() => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      functional: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const consent = {
      necessary: true,
      functional: false,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner-overlay">
      <div className="cookie-banner">
        <div className="cookie-header">
          <h3>🍪 Utilizzo dei Cookie</h3>
        </div>
        
        <div className="cookie-content">
          <p>
            Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza su SmartDeck. 
            I cookie necessari sono essenziali per il funzionamento del sito (autenticazione, preferenze tema).
          </p>
          
          {showDetails && (
            <div className="cookie-details">
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input type="checkbox" checked disabled />
                  <strong>Cookie Necessari (Obbligatori)</strong>
                </div>
                <p className="cookie-description">
                  Cookie essenziali per autenticazione, gestione sessioni e funzionamento base del sito.
                  Non possono essere disabilitati.
                </p>
              </div>
              
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input type="checkbox" id="functional" disabled />
                  <strong>Cookie Funzionali</strong>
                </div>
                <p className="cookie-description">
                  Salvano le tue preferenze (tema chiaro/scuro). Attualmente non utilizzati.
                </p>
              </div>
              
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input type="checkbox" id="analytics" disabled />
                  <strong>Cookie Analitici</strong>
                </div>
                <p className="cookie-description">
                  Raccolgono statistiche anonime sull'utilizzo del sito. Non implementati.
                </p>
              </div>
              
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <input type="checkbox" id="advertising" disabled />
                  <strong>Cookie Pubblicitari</strong>
                </div>
                <p className="cookie-description">
                  Utilizzati per mostrare annunci personalizzati. Non attualmente implementati, 
                  potrebbero essere aggiunti in futuro. Richiederanno consenso esplicito.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="cookie-actions">
          <button className="cookie-btn cookie-btn-secondary" onClick={handleCustomize}>
            {showDetails ? 'Nascondi Dettagli' : 'Personalizza'}
          </button>
          <button className="cookie-btn cookie-btn-secondary" onClick={handleAcceptNecessary}>
            Solo Necessari
          </button>
          <button className="cookie-btn cookie-btn-primary" onClick={handleAcceptAll}>
            Accetta Tutti
          </button>
        </div>
        
        <div className="cookie-footer">
          <p>
            Continuando la navigazione accetti la nostra{' '}
            <a href="/#/privacy" className="cookie-link">Privacy Policy</a> e i{' '}
            <a href="/#/terms" className="cookie-link">Termini di Servizio</a>.
          </p>
        </div>
      </div>
    </div>
  );
});

CookieBanner.displayName = 'CookieBanner';

export default CookieBanner;
