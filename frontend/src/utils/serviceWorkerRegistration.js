/**
 * Service Worker registration
 * Cache assets per performance offline-first
 */

export function register() {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[ServiceWorker] Registered:', registration);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, notify user
                  console.log('[ServiceWorker] New content available, please refresh!');
                  
                  // Optional: show toast notification
                  if (window.showToast) {
                    window.showToast('Nuova versione disponibile! Ricarica la pagina.', 'info');
                  }
                } else {
                  console.log('[ServiceWorker] Content cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[ServiceWorker] Registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Unregister error:', error.message);
      });
  }
}
