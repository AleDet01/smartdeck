/**
 * Google Analytics 4 Integration
 * Traccia eventi, page views, conversioni
 */

// Inizializza GA4 (da chiamare in index.html o index.js)
export function initGA4(measurementId) {
  if (!measurementId || process.env.NODE_ENV !== 'production') {
    console.log('[GA4] Skipped - Development mode or missing ID');
    return;
  }

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false, // Traccia manualmente con pageView()
  });

  console.log('[GA4] Initialized:', measurementId);
}

/**
 * Traccia page view
 */
export function pageView(path, title) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
}

/**
 * Traccia eventi custom
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/**
 * Eventi specifici SmartDeck
 */

export function trackRegistration(username) {
  trackEvent('sign_up', {
    method: 'email',
    username,
  });
}

export function trackLogin(username) {
  trackEvent('login', {
    method: 'email',
    username,
  });
}

export function trackTestStart(area, difficulty) {
  trackEvent('test_start', {
    event_category: 'engagement',
    test_area: area,
    difficulty,
  });
}

export function trackTestComplete(area, score, timeSpent) {
  trackEvent('test_complete', {
    event_category: 'engagement',
    test_area: area,
    score,
    time_spent: timeSpent,
    value: score, // Per conversioni
  });
}

export function trackAIRequest(model, tokensUsed) {
  trackEvent('ai_request', {
    event_category: 'ai_assistant',
    ai_model: model,
    tokens_used: tokensUsed,
  });
}

export function trackFlashcardCreate(area) {
  trackEvent('flashcard_create', {
    event_category: 'content_creation',
    flashcard_area: area,
  });
}

export function trackFlashcardDelete(flashcardId) {
  trackEvent('flashcard_delete', {
    event_category: 'content_management',
    flashcard_id: flashcardId,
  });
}

export function trackError(errorMessage, errorLocation) {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  });
}

/**
 * User properties (da settare dopo login)
 */
export function setUserProperties(userId, properties = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('set', 'user_properties', {
      user_id: userId,
      ...properties,
    });
  }
}

/**
 * Conversioni / Goals
 */
export function trackConversion(conversionName, value = 0) {
  trackEvent('conversion', {
    send_to: conversionName,
    value,
    currency: 'EUR',
  });
}
