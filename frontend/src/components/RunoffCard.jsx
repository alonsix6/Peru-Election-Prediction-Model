import { getPartyColor } from '../config/partyColors';

const REJECTION = {
  'Rafael López Aliaga': 50.8,
  'Keiko Fujimori': 62.7,
  'Carlos Álvarez': 50.2,
  'López Chau': 51.7,
  'Wolfgang Grozo': 45.6,
};

export default function RunoffCard({ scenario: s, expanded, onToggle }) {
  const candidates = Object.keys(s.wins);
  const [candA, candB] = candidates.sort((a, b) => s.wins[b] - s.wins[a]);
  const pctA = s.wins[candA];
  const pctB = s.wins[candB];
  const colorA = getPartyColor(candA);
  const colorB = getPartyColor(candB);

  // Bar proportions (excluding blank for the vote bar)
  const totalVote = pctA + pctB;
  const barA = totalVote > 0 ? (pctA / totalVote) * 100 : 50;
  const barB = totalVote > 0 ? (pctB / totalVote) * 100 : 50;

  return (
    <div
      onClick={onToggle}
      style={{
        background: '#1E293B', border: '1px solid #334155', borderRadius: '12px',
        padding: '16px', cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '15px' }}>
          {candA.split(' ').pop()} vs {candB.split(' ').pop()}
        </span>
        <span style={{
          background: '#334155', color: '#CBD5E1', padding: '2px 8px',
          borderRadius: '9999px', fontSize: '12px'
        }}>
          {s.frequency}% de simulaciones
        </span>
      </div>

      {/* Bicolor bar */}
      <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          width: `${barA}%`, background: colorA.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '12px', fontWeight: 600, minWidth: 30
        }}>
          {pctA.toFixed(0)}%
        </div>
        <div style={{
          width: `${barB}%`, background: colorB.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '12px', fontWeight: 600, minWidth: 30
        }}>
          {pctB.toFixed(0)}%
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: colorA.primary }}>{candA}</span>
        <span style={{ color: '#94A3B8' }}>Blanco: {s.avg_blank_pct.toFixed(1)}%</span>
        <span style={{ color: colorB.primary }}>{candB}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{
          marginTop: 12, padding: '12px', background: '#0F172A', borderRadius: 8,
          color: '#CBD5E1', fontSize: '13px', lineHeight: '1.6'
        }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#F1F5F9' }}>Voto blanco: {s.avg_blank_pct.toFixed(1)}%</strong>
            {s.avg_blank_pct > 35
              ? ' — Ambos candidatos generan alto rechazo. Una porción significativa del electorado preferiría no votar por ninguno.'
              : ' — Nivel moderado de voto blanco para una segunda vuelta.'}
          </p>
          {REJECTION[candA] && (
            <p style={{ margin: '0 0 4px' }}>Rechazo definitivo {candA.split(' ').pop()}: <strong style={{ color: '#F1F5F9' }}>{REJECTION[candA]}%</strong></p>
          )}
          {REJECTION[candB] && (
            <p style={{ margin: 0 }}>Rechazo definitivo {candB.split(' ').pop()}: <strong style={{ color: '#F1F5F9' }}>{REJECTION[candB]}%</strong></p>
          )}
        </div>
      )}
    </div>
  );
}
