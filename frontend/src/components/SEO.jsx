import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Componente SEO per gestire meta tags dinamici
 * Usa React Helmet per modificare <head> per ogni pagina
 */
const SEO = ({ 
  title = 'SmartDeck - Studio Intelligente con AI',
  description = 'Piattaforma di studio intelligente con flashcard, test interattivi e assistente AI. Migliora il tuo apprendimento con SmartDeck.',
  keywords = 'flashcard, studio, apprendimento, AI, intelligenza artificiale, test, quiz, educazione',
  author = 'SmartDeck Team',
  image = '/og-image.jpg',
  url = window.location.href,
  type = 'website',
  twitterCard = 'summary_large_image'
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Italian" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="SmartDeck" />
      <meta property="og:locale" content="it_IT" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#667eea" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="SmartDeck" />
      
      {/* PWA */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/logo192.png" />
    </Helmet>
  );
};

export default SEO;
