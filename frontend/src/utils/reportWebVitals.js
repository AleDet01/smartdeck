import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Traccia Core Web Vitals e invia a Analytics/Monitoring
 * https://web.dev/vitals/
 */
function sendToAnalytics({ name, delta, value, id }) {
  // Log in console (development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      delta: `${delta}ms`,
      value: `${value}ms`,
      id,
      rating: getRating(name, value)
    });
  }

  // Invia a Google Analytics 4 (se configurato)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  }

  // Invia a Sentry Performance (se configurato)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${name}`, {
      level: 'info',
      tags: {
        webVital: name,
        rating: getRating(name, value),
      },
      contexts: {
        webVitals: {
          name,
          value,
          delta,
          id,
        },
      },
    });
  }
}

/**
 * Valuta se il punteggio è good/needs-improvement/poor
 * Basato su: https://web.dev/vitals/#core-web-vitals
 */
function getRating(metric, value) {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Funzione da chiamare in index.js per iniziare il tracking
 */
export function reportWebVitals() {
  getCLS(sendToAnalytics);  // Cumulative Layout Shift
  getFID(sendToAnalytics);  // First Input Delay
  getFCP(sendToAnalytics);  // First Contentful Paint
  getLCP(sendToAnalytics);  // Largest Contentful Paint
  getTTFB(sendToAnalytics); // Time to First Byte
}

/**
 * Export singole metriche per uso custom
 */
export { getCLS, getFID, getFCP, getLCP, getTTFB };
