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
        <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
          <h2 style={{ marginBottom: 8, color: '#1C1917' }}>Error en el dashboard</h2>
          <p style={{ color: '#78716C', fontSize: 14 }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              marginTop: 16, background: '#1D4ED8', color: '#FFFFFF', border: 'none',
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

function SimulationToast({ data, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 60000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const sorted = (data?.candidates || []).sort((a, b) => b.prob_win - a.prob_win).slice(0, 5);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      width: 'min(340px, 90vw)', background: '#FFFFFF',
      border: '1px solid #E5E0D8', borderLeft: '3px solid #1D4ED8',
      borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: '#1D4ED8' }} />
          <span style={{ color: '#1C1917', fontSize: 13, fontWeight: 600 }}>
            Tu simulaci&oacute;n — 10,000 escenarios
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A8A29E', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      {sorted.map(c => (
        <div key={c.candidate} style={{
          display: 'flex', justifyContent: 'space-between', padding: '4px 0',
          fontSize: 12, fontVariantNumeric: 'tabular-nums'
        }}>
          <span style={{ color: '#1C1917' }}>{c.candidate}</span>
          <span style={{ color: c.prob_win >= 10 ? '#059669' : '#A8A29E', fontWeight: 500 }}>
            {c.mean?.toFixed(1) || c.predicted_pct_mean?.toFixed(1)}% | P: {c.prob_win?.toFixed(1) || c.prob_win_overall?.toFixed(1)}%
          </span>
        </div>
      ))}
      <p style={{ color: '#A8A29E', fontSize: 10, margin: '10px 0 0', lineHeight: 1.4 }}>
        Los resultados del dashboard oficial se actualizan autom&aacute;ticamente cada 30 min.
      </p>
    </div>
  );
}

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Header status={status} predictions={predictions} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={24} style={{ color: '#1D4ED8', animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div style={{ color: '#78716C', fontSize: 14 }}>Conectando con el servidor de predicciones</div>
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '10px 16px', marginBottom: 16, color: '#DC2626', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{error}</span>
            <button onClick={refresh} style={{
              background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6,
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

        {lastUpdated && (
          <div style={{
            textAlign: 'center', padding: '24px 0 12px', color: '#A8A29E', fontSize: 11,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12
          }}>
            <span>
              &Uacute;ltima actualizaci&oacute;n: {lastUpdated.toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            </span>
            <button
              onClick={runSimulation}
              disabled={simLoading}
              style={{
                background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 6,
                color: '#1D4ED8', cursor: simLoading ? 'wait' : 'pointer',
                fontSize: 11, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 4, opacity: simLoading ? 0.6 : 1
              }}
            >
              {simLoading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
              Mi simulaci&oacute;n
            </button>
          </div>
        )}
      </main>

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
