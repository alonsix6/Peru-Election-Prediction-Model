import { useState, useEffect } from 'react';
import { getPartyColor } from '../../config/partyColors';
import { Activity, TrendingUp, BarChart3, X, ExternalLink, Loader2, Play, RefreshCcw, Info } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const API = import.meta.env.VITE_API_URL || '';

const ABBREV = {
  'Rafael López Aliaga': 'RLA', 'Keiko Fujimori': 'KF',
  'Carlos Álvarez': 'CA', 'López Chau': 'ALC',
  'Roberto Sánchez Palomino': 'RSP', 'Jorge Nieto': 'JN',
  'Wolfgang Grozo': 'WG', 'César Acuña': 'CAc',
  'Ricardo Belmont': 'RB', 'Marisol Pérez Tello': 'MPT',
  'Carlos Espá': 'CE', 'Yonhy Lescano': 'YL', 'Mario Vizcarra': 'MV',
};
function abbrev(name) { return ABBREV[name] || name.split(' ').map(w => w[0]).join(''); }

const POLLSTER_COLORS = {
  IEP: '#1D4ED8', Datum: '#059669', Ipsos: '#7C3AED', CPI: '#D97706', CIT: '#6B7280'
};

function weightBlocks(w, color) {
  const filled = w >= 0.8 ? 5 : w >= 0.6 ? 4 : w >= 0.4 ? 3 : w >= 0.2 ? 2 : 1;
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{
      display: 'inline-block', width: 10, height: 10, marginRight: 2, borderRadius: 2,
      background: i < filled ? color : '#F0EDE8',
      border: i < filled ? 'none' : '1px solid #E5E0D8'
    }} />
  ));
}

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / 86400000);
}

// ─── Compact Candidate Row ──────────────────────────────────
function CompactRow({ c }) {
  const party = getPartyColor(c.candidate);
  const initials = c.candidate.split(' ').map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
  const barW = Math.min(100, (c.mean / 30) * 100);
  const probColor = c.prob_win >= 50 ? '#059669' : c.prob_win >= 10 ? '#D97706' : '#A8A29E';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #E5E0D8' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, background: party.bg, color: party.text,
        border: `2px solid ${party.primary}`, fontWeight: 600, fontSize: 11
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1C1917', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.candidate}</div>
        <div style={{ color: '#78716C', fontSize: 11 }}>{party.party}</div>
        <div style={{ marginTop: 4, height: 8, borderRadius: 4, background: '#F0EDE8' }}>
          <div style={{ width: `${barW}%`, height: '100%', background: party.primary, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: party.primary, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.mean.toFixed(1)}%</div>
        <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 2 }}>P(Ganar)</div>
        <div style={{ color: probColor, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{c.prob_win.toFixed(1)}%</div>
      </div>
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────
function HistoryCard() {
  const [history, setHistory] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/model-history`).then(r => r.json()).then(setHistory).catch(() => {});
  }, []);

  if (!history?.history?.length) return null;

  const latest = new Date(history.history[0].generated_at_lima);
  const minsAgo = Math.floor((Date.now() - latest) / 60000);
  const dotColor = minsAgo < 35 ? '#059669' : minsAgo < 90 ? '#D97706' : '#DC2626';

  // Filter out identical consecutive entries — keep most recent of each group
  const filtered = history.history.reduce((acc, entry) => {
    if (acc.length === 0) return [entry];
    const prev = acc[acc.length - 1];
    const changed = Math.abs(entry.top3[0].pct_mean - prev.top3[0].pct_mean) >= 0.1;
    if (changed) acc.push(entry);
    // If no change, skip — the first (most recent) entry of each group is already kept
    return acc;
  }, []);

  const visible = filtered.slice(0, 8);
  const totalRuns = history.history.length;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#A8A29E' }} />
          <span style={{ color: '#1C1917', fontSize: 14, fontWeight: 600 }}>Historial del modelo</span>
        </div>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: dotColor,
          display: 'inline-block', boxShadow: minsAgo < 35 ? `0 0 6px ${dotColor}` : 'none'
        }} />
      </div>
      <div style={{ color: '#A8A29E', fontSize: 11, marginBottom: 10 }}>Auto-actualiza cada 30 min</div>

      {visible.map((h, i) => {
        const t = new Date(h.generated_at_lima);
        const timeStr = t.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
        const isLatest = i === 0;
        const top3Str = h.top3.map(c => `${abbrev(c.candidate)} ${c.pct_mean.toFixed(1)}%`).join(' \u00B7 ');
        return (
          <div key={i} style={{
            padding: '5px 0', borderBottom: '1px solid #E5E0D8',
            fontFamily: 'monospace', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
            color: isLatest ? '#1C1917' : '#78716C', fontWeight: isLatest ? 500 : 400
          }}>
            {isLatest && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />}
            <span style={{ color: '#A8A29E', flexShrink: 0 }}>{timeStr}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3Str}</span>
          </div>
        );
      })}

      {visible.length <= 1 && (
        <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 6 }}>Sin cambios en las últimas {totalRuns} corridas</div>
      )}
    </div>
  );
}

// ─── Sources Card ───────────────────────────────────────────
function SourcesCard({ polls, polymarket, onOpenPolymarket }) {
  const pollList = polls?.polls?.slice(0, 10) || [];
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <BarChart3 size={14} style={{ color: '#A8A29E' }} />
        <span style={{ color: '#1C1917', fontSize: 14, fontWeight: 600 }}>Fuentes de datos</span>
      </div>

      {/* Encuestas — grid alineado */}
      <div style={{ color: '#78716C', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>ENCUESTAS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '42px 62px 56px 1fr', gap: '0', alignItems: 'center', fontSize: 12 }}>
        {pollList.map((p, i) => {
          const pColor = POLLSTER_COLORS[p.pollster] || '#6B7280';
          const days = daysAgo(p.field_end);
          const isSimulacro = p.poll_type === 'simulacro';
          return [
            <span key={`n${i}`} style={{ color: pColor, fontWeight: 600, padding: '5px 0', borderBottom: '1px solid #F0EDE8' }}>{p.pollster}</span>,
            <span key={`t${i}`} style={{ padding: '5px 0', borderBottom: '1px solid #F0EDE8' }}>
              <span style={{
                fontSize: 10, borderRadius: 4, padding: '1px 5px',
                background: isSimulacro ? '#ECFDF5' : '#EFF6FF',
                color: isSimulacro ? '#065F46' : '#1E40AF'
              }}>{isSimulacro ? 'Simulacro' : 'Intención'}</span>
            </span>,
            <span key={`d${i}`} style={{ color: '#A8A29E', padding: '5px 0', borderBottom: '1px solid #F0EDE8', textAlign: 'right', paddingRight: 8 }}>
              {days}d
            </span>,
            <span key={`w${i}`} style={{ display: 'flex', gap: 2, padding: '5px 0', borderBottom: '1px solid #F0EDE8' }}>
              {weightBlocks(p.effective_weight, pColor)}
            </span>
          ];
        })}
      </div>
      <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
        El peso disminuye con la antigüedad
      </div>

      {/* Polymarket */}
      <div style={{ color: '#78716C', fontSize: 11, fontWeight: 500, marginTop: 14, marginBottom: 6 }}>POLYMARKET</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} style={{ color: '#1D4ED8' }} />
          <span style={{ color: '#1C1917', fontSize: 13, fontWeight: 500 }}>Polymarket</span>
          <span style={{ color: '#A8A29E', fontSize: 11 }}>
            ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M vol' : '--'}
          </span>
        </div>
        <button onClick={onOpenPolymarket} style={{
          background: 'transparent', border: '1px solid #E5E0D8', borderRadius: 6,
          color: '#1D4ED8', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#C9C4BB'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E0D8'}
        >
          Ver señales <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
}

// ─── Polymarket Modal ───────────────────────────────────────
function PolymarketModal({ polymarket, onClose }) {
  const candidates = polymarket?.candidates || [];
  const top5 = candidates.slice(0, 5);

  // Build simple chart data from available snapshots
  const chartData = {
    labels: ['Actual'],
    datasets: top5.map(c => {
      const color = getPartyColor(c.candidate);
      return {
        label: abbrev(c.candidate),
        data: [c.probability],
        borderColor: color.primary,
        backgroundColor: 'transparent',
        borderWidth: 2, pointRadius: 4, tension: 0.4
      };
    })
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#1C1917', usePointStyle: true, font: { size: 11 } } },
      tooltip: { backgroundColor: '#FFFFFF', titleColor: '#1C1917', bodyColor: '#78716C', borderColor: '#E5E0D8', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: '#E5E0D8' }, ticks: { color: '#A8A29E', font: { size: 10 } } },
      y: { min: 0, max: 40, grid: { color: '#E5E0D8' }, ticks: { color: '#A8A29E', callback: v => v + '%', font: { size: 10 } } }
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(600px, 90vw)', maxHeight: '80vh', overflowY: 'auto',
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 16, padding: 24,
        position: 'relative'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent',
          border: 'none', color: '#A8A29E', cursor: 'pointer'
        }}><X size={20} /></button>

        {/* Header */}
        <h3 style={{ color: '#1C1917', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Señales de Polymarket</h3>
        <p style={{ color: '#78716C', fontSize: 13, margin: '0 0 16px' }}>
          Mercado de predicciones {'\u00B7'} ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M en apuestas reales' : ''}
        </p>

        {/* Chart */}
        <div style={{ height: 180, marginBottom: 16 }}>
          <Line data={chartData} options={chartOpts} />
        </div>

        {/* Table */}
        <div style={{ fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 4, padding: '6px 0', borderBottom: '1px solid #E5E0D8' }}>
            <span style={{ color: '#78716C', fontWeight: 500 }}>Candidato</span>
            <span style={{ color: '#78716C', fontWeight: 500, textAlign: 'right' }}>Prob</span>
          </div>
          {candidates.slice(0, 15).map((c, i) => {
            const party = getPartyColor(c.candidate);
            return (
              <div key={c.candidate} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px', gap: 4, padding: '5px 0',
                borderBottom: '1px solid #E5E0D8', background: i % 2 ? '#F7F4EF' : 'transparent'
              }}>
                <span style={{ color: party.primary, fontWeight: 500 }}>{c.candidate}</span>
                <span style={{ color: '#1C1917', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.probability.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Simulation Card ────────────────────────────────────────
function SimulationCard() {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [simData, setSimData] = useState(null);

  async function runSim() {
    setState('loading');
    try {
      const res = await fetch(`${API}/api/run-model`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setSimData(data);
      setState('done');
    } catch {
      setState('error');
    }
  }

  function reset() {
    setState('idle');
    setSimData(null);
  }

  const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 };

  if (state === 'error') {
    return (
      <div style={cardStyle}>
        <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Tu proyección personal</h3>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12 }}>
          <p style={{ color: '#DC2626', fontSize: 13, margin: '0 0 10px' }}>
            No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.
          </p>
          <button onClick={runSim} style={{
            background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6,
            padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500
          }}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (state === 'done' && simData) {
    const top5 = (simData.candidates || []).sort((a, b) => b.prob_win - a.prob_win).slice(0, 5);
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: 0 }}>Tu proyección personal</h3>
          <button onClick={reset} style={{
            background: 'transparent', border: 'none', color: '#1D4ED8',
            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}>
            <RefreshCcw size={12} /> Nueva
          </button>
        </div>

        {top5.map((c, i) => {
          const party = getPartyColor(c.candidate);
          const barW = Math.min(100, (c.mean / 30) * 100);
          const probWin = c.prob_win ?? c.prob_win_overall ?? 0;
          return (
            <div key={c.candidate} style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #E5E0D8' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <span style={{ color: '#A8A29E', fontSize: 12, marginRight: 6 }}>{i + 1}.</span>
                  <span style={{ color: party.primary, fontSize: 14, fontWeight: 500 }}>{c.candidate}</span>
                </div>
                <span style={{ color: party.primary, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {c.mean.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#F0EDE8', marginBottom: 3 }}>
                <div style={{ width: `${barW}%`, height: '100%', background: party.primary, borderRadius: 3 }} />
              </div>
              <div style={{ color: '#78716C', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                P(Ganar) {probWin.toFixed(1)}%
              </div>
            </div>
          );
        })}

        <div style={{
          marginTop: 12, background: '#F0EDE8', borderRadius: 6, padding: '8px 10px',
          display: 'flex', gap: 6, alignItems: 'flex-start'
        }}>
          <Info size={14} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: '#78716C', fontSize: 11, lineHeight: 1.5 }}>
            Resultado de tu sesión — puede variar levemente del modelo oficial. Esto es completamente normal: el modelo usa aleatoriedad controlada en cada corrida.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Tu proyección personal</h3>
      <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
        Ejecuta el modelo de predicción con tus propios 10,000 escenarios. El resultado puede variar levemente del dashboard oficial por la naturaleza estadística del modelo — eso es completamente normal y esperado.
      </p>
      <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
        El dashboard principal se actualiza automáticamente cada 30 minutos con datos frescos de Polymarket.
      </p>
      <button
        onClick={runSim}
        disabled={state === 'loading'}
        style={{
          width: '100%', padding: 10, border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 500, cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          background: state === 'loading' ? 'rgba(29, 78, 216, 0.7)' : '#1D4ED8',
          color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s'
        }}
      >
        {state === 'loading'
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Calculando 10,000 escenarios...</>
          : <><Play size={16} /> Ejecutar mi simulación</>
        }
      </button>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────
export default function DashboardTab({ predictions, polymarket, polls, status }) {
  const [pmModalOpen, setPmModalOpen] = useState(false);

  if (!predictions?.candidates?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 size={24} style={{ color: '#1D4ED8', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <div style={{ color: '#78716C', fontSize: 14 }}>
          El modelo está inicializando. Los datos estarán disponibles en los próximos minutos.
        </div>
      </div>
    );
  }

  const sorted = [...predictions.candidates].sort((a, b) => b.prob_win - a.prob_win);
  const top = sorted[0];
  const second = sorted[1];
  const topParty = getPartyColor(top.candidate);
  const secondParty = getPartyColor(second.candidate);

  const modelMap = {};
  for (const c of predictions.candidates) modelMap[c.candidate] = c.mean;
  const pmTop = polymarket?.candidates?.slice(0, 5) || [];

  // Runoff scenario for hero card
  const runoff = predictions.runoff_scenarios?.[0];
  const blankPct = runoff?.avg_blank_pct;

  // Runoff pair candidates for bicolor bar
  let runoffC1 = null, runoffC2 = null, runoffC1Party = null, runoffC2Party = null;
  if (runoff) {
    const winKeys = Object.keys(runoff.wins);
    runoffC1 = winKeys[0];
    runoffC2 = winKeys[1];
    runoffC1Party = getPartyColor(runoffC1);
    runoffC2Party = getPartyColor(runoffC2);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Left column — main dashboard */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {/* Card 1: Favorito */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#A8A29E', fontSize: 11, marginBottom: 4 }}>Favorito · P(Ganar)</div>
              <div style={{ color: topParty.primary, fontSize: 32, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{top.prob_win.toFixed(1)}%</div>
              <div style={{ color: '#1C1917', fontSize: 13, marginTop: 2 }}>{top.candidate}</div>
              <div style={{ color: '#78716C', fontSize: 11 }}>{topParty.party}</div>
            </div>

            {/* Card 2: Segundo */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#A8A29E', fontSize: 11, marginBottom: 4 }}>Segundo · P(Ganar)</div>
              <div style={{ color: secondParty.primary, fontSize: 32, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{second.prob_win.toFixed(1)}%</div>
              <div style={{ color: '#1C1917', fontSize: 13, marginTop: 2 }}>{second.candidate}</div>
              <div style={{ color: '#78716C', fontSize: 11 }}>{secondParty.party}</div>
            </div>

            {/* Card 3: Escenario probable */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#A8A29E', fontSize: 11, marginBottom: 4 }}>2da vuelta más probable</div>
              {runoff && runoffC1 && runoffC2 ? (
                <>
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8, marginBottom: 6 }}>
                    <div style={{ width: `${runoff.wins[runoffC1]}%`, background: runoffC1Party.primary, height: '100%' }} />
                    <div style={{ width: `${runoff.wins[runoffC2]}%`, background: runoffC2Party.primary, height: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: '#1C1917' }}>{abbrev(runoffC1)} {runoff.wins[runoffC1].toFixed(0)}%</span>
                    <span style={{ color: '#1C1917' }}>{abbrev(runoffC2)} {runoff.wins[runoffC2].toFixed(0)}%</span>
                  </div>
                  <div style={{ color: '#78716C', fontSize: 11, marginTop: 4 }}>{runoff.frequency}% de simulaciones</div>
                </>
              ) : (
                <div style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, marginTop: 4 }}>---</div>
              )}
            </div>

            {/* Card 4: Voto blanco */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#A8A29E', fontSize: 11, marginBottom: 4 }}>Voto blanco esperado</div>
              <div style={{ color: '#1C1917', fontSize: 30, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{blankPct ? `~${blankPct.toFixed(0)}%` : '---'}</div>
              {runoff && <div style={{ color: '#78716C', fontSize: 11, marginTop: 2 }}>En {runoff.pair.split(' vs ').map(n => n.split(' ').pop()).join(' vs ')}</div>}
            </div>
          </div>

          {/* Candidate list + Polymarket side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Candidatos</h3>
              {sorted.map(c => <CompactRow key={c.candidate} c={c} />)}
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
              <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Monitor Polymarket</h3>
              <div style={{ color: '#78716C', fontSize: 12, marginBottom: 12 }}>
                Volumen: ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M' : '--'}
              </div>
              {pmTop.map(c => {
                const party = getPartyColor(c.candidate);
                const modelMean = modelMap[c.candidate];
                const delta = modelMean != null ? c.probability - modelMean : null;
                return (
                  <div key={c.candidate} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #E5E0D8'
                  }}>
                    <span style={{ color: party.primary, fontWeight: 500, fontSize: 13 }}>{c.candidate}</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ color: '#1C1917', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{c.probability.toFixed(1)}%</span>
                      {delta !== null && (
                        <span style={{
                          color: delta > 0 ? '#059669' : delta < 0 ? '#DC2626' : '#A8A29E',
                          fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500, minWidth: 50, textAlign: 'right'
                        }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 8 }}>
                Δ = diferencia entre probabilidad de mercado y estimación del modelo
              </div>
            </div>
          </div>

          {/* Simulation card */}
          <SimulationCard />
        </div>

        {/* Right column — sidebar (desktop only, hidden on mobile via CSS) */}
        <div className="dashboard-sidebar" style={{
          width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <HistoryCard />
          <SourcesCard polls={polls} polymarket={polymarket} onOpenPolymarket={() => setPmModalOpen(true)} />
        </div>
      </div>

      {/* Responsive: hide sidebar on mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .dashboard-sidebar { display: none !important; }
        }
      `}</style>

      {/* Polymarket Modal */}
      {pmModalOpen && <PolymarketModal polymarket={polymarket} onClose={() => setPmModalOpen(false)} />}
    </>
  );
}
