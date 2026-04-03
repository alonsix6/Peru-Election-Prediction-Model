import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '';

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

export function useElectionData() {
  const [data, setData] = useState({
    status: null, predictions: null, polymarket: null, polls: null,
    loading: true, error: null, lastUpdated: null
  });

  const refresh = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }));
    const [status, predictions, polymarket, polls] = await Promise.all([
      safeFetch(`${API}/api/status`),
      safeFetch(`${API}/api/predictions`),
      safeFetch(`${API}/api/polymarket`),
      safeFetch(`${API}/api/polls`),
    ]);
    const anyFailed = [status, predictions, polymarket, polls].some(d => d === null);
    setData({
      status, predictions, polymarket, polls,
      loading: false,
      error: anyFailed ? 'Algunos datos no están disponibles' : null,
      lastUpdated: new Date()
    });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...data, refresh };
}
