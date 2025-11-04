import { useEffect, useState } from 'react';
import API_HOST from './apiHost';

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    
    (async () => {
      try {
        const res = await fetch(url, { 
          ...options, 
          signal: controller.signal,
          credentials: options.credentials || 'include'
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
};


export const useCurrentUser = () => {
  const { data, loading } = useFetch(`${API_HOST}/auth/me`);
  return {
    user: data?.user || null,
    authenticated: data?.authenticated || false,
    loading
  };
};

export const useAdaptiveFontSize = (selector, deps = []) => {
  useEffect(() => {
    if (deps.some(d => !d)) return;

    const MIN_PX = 12, STEP_PX = 1;
    
    const adjustAll = () => {
      const nodes = Array.from(document.querySelectorAll(selector));
      nodes.forEach(node => {
        node.style.fontSize = '';
        const containerWidth = node.clientWidth;
        let fontPx = parseFloat(window.getComputedStyle(node).fontSize) || 16;
        
        const fits = () => node.scrollWidth <= containerWidth + 1;
        let safety = 100;
        
        while (!fits() && fontPx > MIN_PX && safety-- > 0) {
          fontPx = Math.max(MIN_PX, fontPx - STEP_PX);
          node.style.fontSize = fontPx + 'px';
        }
      });
    };

    let raf = requestAnimationFrame(() => setTimeout(adjustAll, 0));
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTimeout(adjustAll, 0));
    };

    window.addEventListener('resize', onResize);
    const retry = setTimeout(adjustAll, 250);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      clearTimeout(retry);
    };
  }, deps);
};
