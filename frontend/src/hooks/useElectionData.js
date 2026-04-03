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

/**
 * Normaliza candidatos de /api/predictions (DB format) al formato
 * que usan los componentes.
 */
function normalizePredictions(data) {
  if (!data?.candidates) return data;
  return {
    ...data,
    candidates: data.candidates.map(c => ({
      candidate: c.candidate,
      mean: c.mean ?? c.predicted_pct_mean ?? 0,
      p10: c.p10 ?? c.predicted_pct_p10 ?? 0,
      p90: c.p90 ?? c.predicted_pct_p90 ?? 0,
      prob_runoff: c.prob_runoff ?? c.prob_first_round ?? 0,
      prob_win: c.prob_win ?? c.prob_win_overall ?? 0,
      polls_pct: c.polls_pct ?? null,
      polymarket_pct: c.polymarket_pct ?? null,
      posterior_pct: c.posterior_pct ?? null,
    })),
    runoff_scenarios: data.runoff_scenarios || [],
    risk_scenarios: data.risk_scenarios || null,
  };
}

export function useElectionData() {
  const [data, setData] = useState({
    status: null, predictions: null, polymarket: null, polls: null,
    loading: true, error: null, lastUpdated: null
  });

  const refresh = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // /api/predictions ahora sirve todo desde DB (incluyendo runoff_scenarios)
      // No necesita llamar /api/run-model — el servidor se actualiza solo cada 30 min
      const [status, predictions, polymarket, polls] = await Promise.all([
        safeFetch(`${API}/api/status`),
        safeFetch(`${API}/api/predictions`),
        safeFetch(`${API}/api/polymarket`),
        safeFetch(`${API}/api/polls`),
      ]);

      const normalized = normalizePredictions(predictions);
      const anyFailed = [status, normalized, polymarket, polls].some(d => d === null);

      setData({
        status,
        predictions: normalized,
        polymarket,
        polls,
        loading: false,
        error: anyFailed ? 'Algunos datos no están disponibles' : null,
        lastUpdated: new Date()
      });
    } catch (err) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error de conexión: ' + (err.message || 'desconocido')
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...data, refresh };
}
