import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook per rilevare connessione online/offline
 * Mostra toast quando la connessione cambia
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connessione ripristinata! ✅', {
        id: 'online-status',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connessione persa. Lavoro offline... ⚠️', {
        id: 'online-status',
        duration: Infinity, // Resta fino a quando non torna online
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Wrapper fetch con retry automatico
 * Ritenta richiesta fallita fino a 3 volte con exponential backoff
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Se risposta ok, ritorna
      if (response.ok) {
        return response;
      }

      // Se 4xx (client error), non ritentare
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Se ultimo tentativo, lancia errore
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${response.status}`);
      }

      // Attendi prima di ritentare (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.warn(`Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms...`);
      await delay(waitTime);

    } catch (error) {
      // Errore di rete o timeout
      if (attempt === maxRetries) {
        console.error('Fetch failed after retries:', error);
        throw error;
      }

      // Attendi prima di ritentare
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`Network error, retry ${attempt + 1}/${maxRetries} after ${waitTime}ms...`);
      await delay(waitTime);
    }
  }
}

/**
 * Higher-order function per API calls con error handling
 * Mostra toast automatico per errori
 */
export function withErrorHandling(apiCall) {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Mostra toast basato sul tipo di errore
      if (!navigator.onLine) {
        toast.error('Connessione assente. Controlla la tua rete.');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Errore di connessione al server.');
      } else if (error.message.includes('401')) {
        toast.error('Sessione scaduta. Effettua nuovamente il login.');
        setTimeout(() => {
          window.location.href = '#/';
        }, 2000);
      } else if (error.message.includes('403')) {
        toast.error('Accesso negato.');
      } else if (error.message.includes('404')) {
        toast.error('Risorsa non trovata.');
      } else if (error.message.includes('500')) {
        toast.error('Errore del server. Riprova più tardi.');
      } else {
        toast.error('Errore imprevisto. Riprova.');
      }

      throw error; // Re-throw per gestione custom
    }
  };
}
