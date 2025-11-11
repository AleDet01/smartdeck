import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_HOST from './apiHost';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minuti inattività
const WARNING_TIME = 5 * 60 * 1000; // Warning 5 minuti prima
const CHECK_INTERVAL = 60 * 1000; // Check ogni minuto

export const useSessionTimeout = (onWarning) => {
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const checkIntervalRef = useRef(null);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // Clear storage
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    navigate('/');
  }, [navigate]);

  const checkSession = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    // Show warning
    if (timeSinceActivity >= SESSION_TIMEOUT - WARNING_TIME && !warningShownRef.current) {
      warningShownRef.current = true;
      if (onWarning) {
        onWarning(Math.floor(WARNING_TIME / 1000 / 60)); // minutes remaining
      }
    }

    // Auto logout
    if (timeSinceActivity >= SESSION_TIMEOUT) {
      console.log('🔒 Sessione scaduta per inattività');
      logout();
    }
  }, [logout, onWarning]);

  useEffect(() => {
    // Events che indicano attività utente
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check periodico sessione
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [updateActivity, checkSession]);

  return { extendSession: updateActivity, logout };
};

// Hook per validare sessione attiva
export const useSessionValidation = () => {
  const navigate = useNavigate();

  const validateSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_HOST}/auth/me`, { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!res.ok || res.status === 401) {
        console.log('🔒 Sessione non valida, reindirizzamento...');
        localStorage.removeItem('token');
        sessionStorage.clear();
        navigate('/');
        return false;
      }

      const data = await res.json();
      return data?.authenticated === true;
    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }, [navigate]);

  return { validateSession };
};
