import { getPartyColor } from '../config/partyColors';

function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name[0].toUpperCase();
}

function winColor(prob) {
  if (prob >= 50) return '#22C55E';
  if (prob >= 10) return '#EAB308';
  return '#94A3B8';
}

export default function CandidateCard({ candidate: c, rank, expanded, onToggle }) {
  const party = getPartyColor(c.candidate);
  const barWidth = Math.min(100, (c.mean / 30) * 100);
  const p10Width = Math.min(100, (c.p10 / 30) * 100);
  const p90Width = Math.min(100, (c.p90 / 30) * 100);

  return (
    <div
      onClick={onToggle}
      style={{
        background: '#1E293B', border: '1px solid #334155', borderRadius: '12px',
        padding: '16px', cursor: 'pointer', borderLeft: `3px solid ${party.primary}`,
        transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: party.bg, color: party.text, border: `2px solid ${party.primary}`,
          fontWeight: 600, fontSize: '14px'
        }}>
          {getInitials(c.candidate)}
        </div>

        {/* Name + Party */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '15px' }}>
            {rank && <span style={{ color: '#94A3B8', fontWeight: 400, marginRight: 6 }}>#{rank}</span>}
            {c.candidate}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '12px' }}>{party.party}</div>

          {/* Progress bar */}
          <div style={{
            marginTop: 8, height: 8, borderRadius: 4, background: '#334155',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* IC 90% range */}
            <div style={{
              position: 'absolute', left: `${p10Width}%`, width: `${p90Width - p10Width}%`,
              height: '100%', background: party.primary, opacity: 0.25, borderRadius: 4
            }} />
            {/* Mean bar */}
            <div style={{
              width: `${barWidth}%`, height: '100%', background: party.primary,
              borderRadius: 4, position: 'relative', zIndex: 1
            }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', flexShrink: 0, textAlign: 'center' }}>
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '16px', fontVariantNumeric: 'tabular-nums' }}>
              {c.mean.toFixed(1)}%
            </div>
            <div style={{ color: '#94A3B8', fontSize: '10px' }}>1ra vuelta</div>
          </div>
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
              {c.prob_runoff.toFixed(0)}%
            </div>
            <div style={{ color: '#94A3B8', fontSize: '10px' }}>P(2da)</div>
          </div>
          <div>
            <div style={{
              color: winColor(c.prob_win), fontWeight: 700, fontSize: '16px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {c.prob_win.toFixed(1)}%
            </div>
            <div style={{ color: '#94A3B8', fontSize: '10px' }}>P(Ganar)</div>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          marginTop: 12, padding: '12px', background: '#0F172A', borderRadius: 8,
          color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 8 }}>
            <div>Encuestas: <strong style={{ color: '#F1F5F9' }}>{c.polls_pct ? c.polls_pct.toFixed(1) + '%' : '—'}</strong></div>
            <div>Polymarket: <strong style={{ color: '#F1F5F9' }}>{c.polymarket_pct ? c.polymarket_pct.toFixed(1) + '%' : '—'}</strong></div>
            <div>IC 90%: <strong style={{ color: '#F1F5F9' }}>[{c.p10.toFixed(1)}% – {c.p90.toFixed(1)}%]</strong></div>
            <div>Posterior: <strong style={{ color: '#F1F5F9' }}>{c.posterior_pct ? c.posterior_pct.toFixed(1) + '%' : '—'}</strong></div>
          </div>
          <p style={{ margin: 0, color: '#94A3B8' }}>
            {c.prob_win >= 50
              ? `${c.candidate} es el favorito para ganar la elección. En ${c.prob_runoff.toFixed(0)}% de las simulaciones pasa a segunda vuelta.`
              : c.prob_win >= 5
              ? `${c.candidate} tiene posibilidades reales. Pasa a segunda vuelta en ${c.prob_runoff.toFixed(0)}% de las 10,000 simulaciones.`
              : `${c.candidate} tiene probabilidades bajas de ganar, pero podría influir en la distribución de votos y segunda vuelta.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
