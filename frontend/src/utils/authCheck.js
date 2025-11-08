import API_HOST from './apiHost';

// Interceptor per verificare se la sessione è scaduta
export const checkAuthOnError = (response) => {
  if (response.status === 401) {
    // Sessione scaduta, reindirizza al login
    window.location.href = '/#/';
    return true;
  }
  return false;
};

// Verifica lo stato di autenticazione
export const checkAuth = async () => {
  try {
    const res = await fetch(`${API_HOST}/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = '/#/';
        return false;
      }
    }
    const data = await res.json().catch(() => ({}));
    return !!(data && data.authenticated);
  } catch {
    return false;
  }
};
