import { useState } from 'react';
import { useElectionData } from './hooks/useElectionData';
import Header from './components/Header';
import TabNav from './components/TabNav';
import DashboardTab from './components/tabs/DashboardTab';
import PrimeraVueltaTab from './components/tabs/PrimeraVueltaTab';
import SegundaVueltaTab from './components/tabs/SegundaVueltaTab';
import MetodologiaTab from './components/tabs/MetodologiaTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { status, predictions, polymarket, polls, loading, error, lastUpdated, refresh } = useElectionData();

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      <Header status={status} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        {/* Loading state */}
        {loading && !predictions && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ color: '#38BDF8', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Cargando modelo...
            </div>
            <div style={{ color: '#94A3B8', fontSize: 14 }}>
              Conectando con el servidor de predicciones
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#7F1D1D', border: '1px solid #EF4444', borderRadius: 8,
            padding: '10px 16px', marginBottom: 16, color: '#FCA5A5', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{error}</span>
            <button
              onClick={refresh}
              style={{
                background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6,
                padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'dashboard' && (
          <DashboardTab predictions={predictions} polymarket={polymarket} status={status} />
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

        {/* Footer */}
        {lastUpdated && (
          <div style={{
            textAlign: 'center', padding: '24px 0 12px', color: '#64748B', fontSize: 11
          }}>
            Última actualización: {lastUpdated.toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            {' · '}
            <button
              onClick={refresh}
              style={{
                background: 'none', border: 'none', color: '#38BDF8',
                cursor: 'pointer', fontSize: 11, textDecoration: 'underline'
              }}
            >
              Actualizar ahora
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
