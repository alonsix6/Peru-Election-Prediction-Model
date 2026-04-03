import { useState, useEffect, useCallback, Component } from 'react';
import { useElectionData } from './hooks/useElectionData';
import Header from './components/Header';
import TabNav from './components/TabNav';
import DashboardTab from './components/tabs/DashboardTab';
import PrimeraVueltaTab from './components/tabs/PrimeraVueltaTab';
import SegundaVueltaTab from './components/tabs/SegundaVueltaTab';
import MetodologiaTab from './components/tabs/MetodologiaTab';
import { Sparkles, X, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#FCA5A5' }}>
          <h2 style={{ marginBottom: 8 }}>Error en el dashboard</h2>
          <p style={{ color: '#94A3B8', fontSize: 14 }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              marginTop: 16, background: '#38BDF8', color: '#0F172A', border: 'none',
              borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Simulation Toast ───────────────────────────────────────
function SimulationToast({ data, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 60000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const sorted = (data?.candidates || []).sort((a, b) => b.prob_win - a.prob_win).slice(0, 5);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      width: 'min(340px, 90vw)', background: '#1E293B',
      border: '1px solid #334155', borderLeft: '3px solid #38BDF8',
      borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: '#38BDF8' }} />
          <span style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
            Tu simulación — 10,000 escenarios
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      {sorted.map(c => (
        <div key={c.candidate} style={{
          display: 'flex', justifyContent: 'space-between', padding: '4px 0',
          fontSize: 12, fontVariantNumeric: 'tabular-nums'
        }}>
          <span style={{ color: '#CBD5E1' }}>{c.candidate}</span>
          <span style={{ color: c.prob_win >= 10 ? '#22C55E' : '#94A3B8', fontWeight: 500 }}>
            {c.mean?.toFixed(1) || c.predicted_pct_mean?.toFixed(1)}% | P: {c.prob_win?.toFixed(1) || c.prob_win_overall?.toFixed(1)}%
          </span>
        </div>
      ))}
      <p style={{ color: '#64748B', fontSize: 10, margin: '10px 0 0', lineHeight: 1.4 }}>
        Los resultados del dashboard oficial se actualizan automáticamente cada 30 min.
      </p>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { status, predictions, polymarket, polls, loading, error, lastUpdated, refresh } = useElectionData();
  const [simData, setSimData] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    try {
      const res = await fetch(`${API}/api/run-model`);
      const data = await res.json();
      setSimData(data);
    } catch {
      setSimData(null);
    }
    setSimLoading(false);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      <Header status={status} predictions={predictions} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={24} style={{ color: '#38BDF8', animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div style={{ color: '#94A3B8', fontSize: 14 }}>Conectando con el servidor de predicciones</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: '#7F1D1D', border: '1px solid #EF4444', borderRadius: 8,
            padding: '10px 16px', marginBottom: 16, color: '#FCA5A5', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{error}</span>
            <button onClick={refresh} style={{
              background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6,
              padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500
            }}>Reintentar</button>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab predictions={predictions} polymarket={polymarket} polls={polls} status={status} />
            )}
            {activeTab === 'primera' && (
              <PrimeraVueltaTab predictions={predictions} polls={polls} />
            )}
            {activeTab === 'segunda' && (
              <SegundaVueltaTab predictions={predictions} />
            )}
            {activeTab === 'metodologia' && (
              <MetodologiaTab />
            )}
          </>
        )}

        {/* Footer */}
        {lastUpdated && (
          <div style={{
            textAlign: 'center', padding: '24px 0 12px', color: '#64748B', fontSize: 11,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12
          }}>
            <span>
              Última actualización: {lastUpdated.toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            </span>
            <button
              onClick={runSimulation}
              disabled={simLoading}
              style={{
                background: '#1E293B', border: '1px solid #334155', borderRadius: 6,
                color: '#38BDF8', cursor: simLoading ? 'wait' : 'pointer',
                fontSize: 11, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 4, opacity: simLoading ? 0.6 : 1
              }}
            >
              {simLoading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
              Mi simulación
            </button>
          </div>
        )}
      </main>

      {/* Simulation toast */}
      {simData && <SimulationToast data={simData} onClose={() => setSimData(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
