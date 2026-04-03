import { getPartyColor } from '../../config/partyColors';

function HeroCard({ title, value, subtitle, color }) {
  return (
    <div style={{
      background: '#1E293B', border: '1px solid #334155', borderRadius: 12,
      padding: 16, textAlign: 'center'
    }}>
      <div style={{ color: '#94A3B8', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      <div style={{ color: color || '#F1F5F9', fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {subtitle && <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function CompactRow({ c }) {
  const party = getPartyColor(c.candidate);
  const initials = c.candidate.split(' ').map(w => w[0]).filter((_,i,a) => i === 0 || i === a.length-1).join('').toUpperCase();
  const barW = Math.min(100, (c.mean / 30) * 100);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderBottom: '1px solid #1E293B'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: party.bg, color: party.text, border: `2px solid ${party.primary}`,
        fontWeight: 600, fontSize: 11
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.candidate}
        </div>
        <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: '#334155' }}>
          <div style={{ width: `${barW}%`, height: '100%', background: party.primary, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.mean.toFixed(1)}%</div>
        <div style={{ color: c.prob_win >= 10 ? '#22C55E' : '#94A3B8', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
          P: {c.prob_win.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default function DashboardTab({ predictions, polymarket, status }) {
  if (!predictions?.candidates?.length) {
    return <div style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>
      Cargando predicciones... Ejecuta <code>/api/run-model</code> primero.
    </div>;
  }

  const sorted = [...predictions.candidates].sort((a, b) => b.prob_win - a.prob_win);
  const top = sorted[0];
  const second = sorted[1];
  const topParty = getPartyColor(top.candidate);
  const secondParty = getPartyColor(second.candidate);

  // Build model mean map for delta calculation
  const modelMap = {};
  for (const c of predictions.candidates) modelMap[c.candidate] = c.mean;

  const pmTop = polymarket?.candidates?.slice(0, 5) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <HeroCard title="Favorito" value={`${top.prob_win.toFixed(1)}%`} subtitle={`${top.candidate} · ${topParty.party}`} color={topParty.primary} />
        <HeroCard title="Segundo" value={`${second.prob_win.toFixed(1)}%`} subtitle={`${second.candidate} · ${secondParty.party}`} color={secondParty.primary} />
        <HeroCard
          title="Escenario más probable"
          value={`${sorted[0].candidate.split(' ').pop()} vs ${sorted[1].candidate.split(' ').pop()}`}
          subtitle={`${sorted[0].prob_runoff.toFixed(0)}% de simulaciones`}
          color="#CBD5E1"
        />
        <HeroCard title="Voto blanco esperado" value="~39%" subtitle="En Aliaga vs Keiko" color="#F59E0B" />
      </div>

      {/* Candidate list + Polymarket side by side on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Compact candidate list */}
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Candidatos</h3>
          {sorted.map(c => <CompactRow key={c.candidate} c={c} />)}
        </div>

        {/* Polymarket monitor */}
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#F1F5F9', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Monitor Polymarket</h3>
          <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
            Volumen: ${polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) + 'M' : '—'}
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
                <div>
                  <span style={{ color: party.primary, fontWeight: 500, fontSize: 13 }}>{c.candidate}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {c.probability.toFixed(1)}%
                  </span>
                  {delta !== null && (
                    <span style={{
                      color: delta > 0 ? '#22C55E' : delta < 0 ? '#EF4444' : '#94A3B8',
                      fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
                      minWidth: 50, textAlign: 'right'
                    }}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)} vs modelo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
