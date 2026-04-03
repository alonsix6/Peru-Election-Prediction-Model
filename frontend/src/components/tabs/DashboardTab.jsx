import { useState, useEffect } from 'react';
import { getPartyColor } from '../../config/partyColors';
import { Activity, TrendingUp, BarChart3, X, ExternalLink, Loader2 } from 'lucide-react';
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
    <span key={i} style={{ color: i < filled ? color : '#334155', fontSize: 10 }}>
      {i < filled ? '\u2588' : '\u2591'}
    </span>
  ));
}

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / 86400000);
}

// ─── Hero Card ──────────────────────────────────────────────
function HeroCard({ title, value, subtitle, color, icon: Icon }) {
  return (
    <div style={{
      background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16, textAlign: 'center'
    }}>
      {Icon && <Icon size={16} style={{ color: '#94A3B8', marginBottom: 4 }} />}
      <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      <div style={{ color: color || '#F1F5F9', fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {subtitle && <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Compact Candidate Row ──────────────────────────────────
function CompactRow({ c }) {
  const party = getPartyColor(c.candidate);
  const initials = c.candidate.split(' ').map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
  const barW = Math.min(100, (c.mean / 30) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, background: party.bg, color: party.text,
        border: `2px solid ${party.primary}`, fontWeight: 600, fontSize: 11
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.candidate}</div>
        <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#334155' }}>
          <div style={{ width: `${barW}%`, height: '100%', background: party.primary, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.mean.toFixed(1)}%</div>
        <div style={{ color: c.prob_win >= 10 ? '#22C55E' : '#94A3B8', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>P: {c.prob_win.toFixed(1)}%</div>
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
  const dotColor = minsAgo < 35 ? '#22C55E' : minsAgo < 90 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#94A3B8' }} />
          <span style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 600 }}>Historial del modelo</span>
        </div>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: dotColor,
          display: 'inline-block', boxShadow: minsAgo < 35 ? `0 0 6px ${dotColor}` : 'none'
        }} />
      </div>
      <div style={{ color: '#64748B', fontSize: 11, marginBottom: 10 }}>Auto-actualiza cada 30 min</div>

      {history.history.slice(0, 8).map((h, i) => {
        const t = new Date(h.generated_at_lima);
        const timeStr = t.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
        const isLatest = i === 0;
        const top3Str = h.top3.map(c => `${abbrev(c.candidate)} ${c.pct_mean.toFixed(1)}%`).join(' \u00B7 ');
        return (
          <div key={i} style={{
            padding: '5px 0', borderBottom: '1px solid #1E293B',
            fontFamily: 'monospace', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
            color: isLatest ? '#F1F5F9' : '#94A3B8', fontWeight: isLatest ? 500 : 400
          }}>
            {isLatest && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}
            <span style={{ color: '#64748B', flexShrink: 0 }}>{timeStr}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3Str}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sources Card ───────────────────────────────────────────
function SourcesCard({ polls, polymarket, onOpenPolymarket }) {
  const pollList = polls?.polls?.slice(0, 10) || [];
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <BarChart3 size={14} style={{ color: '#94A3B8' }} />
        <span style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 600 }}>Fuentes de datos</span>
      </div>

      {/* Encuestas */}
      <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500, marginBottom: 6 }}>ENCUESTAS</div>
      {pollList.map((p, i) => {
        const pColor = POLLSTER_COLORS[p.pollster] || '#6B7280';
        const days = daysAgo(p.field_end);
        const typeLabel = p.poll_type === 'simulacro' ? 'sim' : 'int';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12 }}>
            <span style={{ color: pColor, fontWeight: 600, width: 38, flexShrink: 0 }}>{p.pollster}</span>
            <span style={{ color: '#64748B', width: 24, flexShrink: 0 }}>{typeLabel}</span>
            <span style={{ color: '#64748B', width: 55, flexShrink: 0 }}>hace {days}d</span>
            <span style={{ display: 'flex', gap: 1 }}>{weightBlocks(p.effective_weight, pColor)}</span>
          </div>
        );
      })}
      <div style={{ color: '#475569', fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>
        El peso disminuye con la antigüedad
      </div>

      {/* Polymarket */}
      <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500, marginTop: 14, marginBottom: 6 }}>POLYMARKET</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} style={{ color: '#38BDF8' }} />
          <span style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 500 }}>Polymarket</span>
          <span style={{ color: '#64748B', fontSize: 11 }}>
            ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M vol' : '--'}
          </span>
        </div>
        <button onClick={onOpenPolymarket} style={{
          background: 'transparent', border: '1px solid #334155', borderRadius: 6,
          color: '#38BDF8', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
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
      legend: { position: 'bottom', labels: { color: '#CBD5E1', usePointStyle: true, font: { size: 11 } } },
      tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#CBD5E1', borderColor: '#334155', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: '#334155' }, ticks: { color: '#94A3B8', font: { size: 10 } } },
      y: { min: 0, max: 40, grid: { color: '#334155' }, ticks: { color: '#94A3B8', callback: v => v + '%', font: { size: 10 } } }
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(600px, 90vw)', maxHeight: '80vh', overflowY: 'auto',
        background: '#1E293B', border: '1px solid #334155', borderRadius: 16, padding: 24,
        position: 'relative'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent',
          border: 'none', color: '#94A3B8', cursor: 'pointer'
        }}><X size={20} /></button>

        {/* Header */}
        <h3 style={{ color: '#F1F5F9', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Señales de Polymarket</h3>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 16px' }}>
          Mercado de predicciones {'\u00B7'} ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M en apuestas reales' : ''}
        </p>

        {/* Chart */}
        <div style={{ height: 180, marginBottom: 16 }}>
          <Line data={chartData} options={chartOpts} />
        </div>

        {/* Table */}
        <div style={{ fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 4, padding: '6px 0', borderBottom: '1px solid #334155' }}>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>Candidato</span>
            <span style={{ color: '#94A3B8', fontWeight: 500, textAlign: 'right' }}>Prob</span>
          </div>
          {candidates.slice(0, 15).map((c, i) => {
            const party = getPartyColor(c.candidate);
            return (
              <div key={c.candidate} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px', gap: 4, padding: '5px 0',
                borderBottom: '1px solid #1E293B', background: i % 2 ? '#1a2536' : 'transparent'
              }}>
                <span style={{ color: party.primary, fontWeight: 500 }}>{c.candidate}</span>
                <span style={{ color: '#F1F5F9', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.probability.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────
export default function DashboardTab({ predictions, polymarket, polls, status }) {
  const [pmModalOpen, setPmModalOpen] = useState(false);

  if (!predictions?.candidates?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 size={24} style={{ color: '#38BDF8', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <div style={{ color: '#94A3B8', fontSize: 14 }}>
          El modelo está inicializando. Los datos estarán disponibles en los próximos minutos.
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
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

  return (
    <>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Left column — main dashboard */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <HeroCard title="Favorito" value={`${top.prob_win.toFixed(1)}%`} subtitle={`${top.candidate} \u00B7 ${topParty.party}`} color={topParty.primary} />
            <HeroCard title="Segundo" value={`${second.prob_win.toFixed(1)}%`} subtitle={`${second.candidate} \u00B7 ${secondParty.party}`} color={secondParty.primary} />
            <HeroCard
              title="Escenario probable"
              value={runoff ? `${abbrev(Object.keys(runoff.wins)[0])} vs ${abbrev(Object.keys(runoff.wins)[1])}` : '---'}
              subtitle={runoff ? `${runoff.frequency}% de simulaciones` : ''}
              color="#CBD5E1"
            />
            <HeroCard title="Voto blanco esperado" value={blankPct ? `~${blankPct.toFixed(0)}%` : '---'} subtitle={runoff ? `En ${runoff.pair.split(' vs ').map(n => n.split(' ').pop()).join(' vs ')}` : ''} color="#F59E0B" />
          </div>

          {/* Candidate list + Polymarket side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
              <h3 style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Candidatos</h3>
              {sorted.map(c => <CompactRow key={c.candidate} c={c} />)}
            </div>

            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
              <h3 style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Monitor Polymarket</h3>
              <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
                Volumen: ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M' : '--'}
              </div>
              {pmTop.map(c => {
                const party = getPartyColor(c.candidate);
                const modelMean = modelMap[c.candidate];
                const delta = modelMean != null ? c.probability - modelMean : null;
                return (
                  <div key={c.candidate} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #0F172A'
                  }}>
                    <span style={{ color: party.primary, fontWeight: 500, fontSize: 13 }}>{c.candidate}</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{c.probability.toFixed(1)}%</span>
                      {delta !== null && (
                        <span style={{
                          color: delta > 0 ? '#22C55E' : delta < 0 ? '#EF4444' : '#94A3B8',
                          fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500, minWidth: 50, textAlign: 'right'
                        }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
