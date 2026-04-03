import { useState } from 'react';
import RunoffCard from '../RunoffCard';
import { getPartyColor } from '../../config/partyColors';

const REJECTION_DATA = [
  { candidate: 'Keiko Fujimori', rejection: 62.7 },
  { candidate: 'López Chau', rejection: 51.7 },
  { candidate: 'Rafael López Aliaga', rejection: 50.8 },
  { candidate: 'Carlos Álvarez', rejection: 50.2 },
  { candidate: 'Wolfgang Grozo', rejection: 45.6 },
];

export default function SegundaVueltaTab({ predictions }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const scenarios = predictions?.runoff_scenarios || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
          Segunda Vuelta
        </h2>
        <p style={{ color: '#94A3B8', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Si ningún candidato supera el 50% en primera vuelta (12 abril), los dos primeros
          se enfrentan en segunda vuelta el <strong style={{ color: '#CBD5E1' }}>7 de junio de 2026</strong>.
          Estas son las simulaciones de los escenarios más probables.
        </p>
      </div>

      {/* Runoff scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenarios.length === 0 && (
          <div style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>Sin escenarios disponibles.</div>
        )}
        {scenarios.map((s, i) => (
          <RunoffCard
            key={s.pair}
            scenario={s}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>

      {/* Rejection chart */}
      <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#F1F5F9', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
          Rechazo definitivo
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 16px' }}>
          Porcentaje del electorado que dice "Definitivamente NO votaría" por este candidato (CIT, marzo 2026).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REJECTION_DATA.map(d => {
            const party = getPartyColor(d.candidate);
            return (
              <div key={d.candidate}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#CBD5E1', fontSize: 13 }}>{d.candidate}</span>
                  <span style={{ color: d.rejection >= 50 ? '#EF4444' : '#F59E0B', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {d.rejection}%
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: '#334155', position: 'relative' }}>
                  <div style={{
                    width: `${d.rejection}%`, height: '100%', borderRadius: 5,
                    background: party.primary
                  }} />
                  {/* 50% reference line */}
                  <div style={{
                    position: 'absolute', left: '50%', top: -2, bottom: -2,
                    width: 2, background: '#F59E0B', opacity: 0.5
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <span style={{ color: '#F59E0B', fontSize: 11, opacity: 0.7 }}>— línea: 50% —</span>
        </div>
      </div>

      {/* Calibration note */}
      <div style={{
        background: '#1E293B', border: '1px solid #334155', borderRadius: 12,
        borderLeft: '4px solid #F59E0B', padding: 16
      }}>
        <h3 style={{ color: '#F59E0B', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
          Nota de calibración
        </h3>
        <p style={{ color: '#F1F5F9', fontSize: 14, margin: '0 0 8px', fontWeight: 500 }}>
          Nuestro modelo: Aliaga ~70% de ganar. Polymarket: 30%.
        </p>
        <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 8px', lineHeight: 1.6 }}>
          ¿Por qué la diferencia de ~40 puntos? Son preguntas distintas:
        </p>
        <ul style={{ color: '#94A3B8', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong style={{ color: '#CBD5E1' }}>Nuestro modelo:</strong> Dado el estado actual del electorado, ¿quién gana?</li>
          <li><strong style={{ color: '#CBD5E1' }}>Polymarket:</strong> Considerando todos los escenarios posibles (escándalos, retiradas, shocks), ¿quién gana?</li>
        </ul>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '12px 0 0', lineHeight: 1.6 }}>
          Polymarket incluye la posibilidad de eventos imprevistos en los próximos 9 días.
          Nuestro modelo refleja los datos concretos que tenemos hoy.
          Ambas perspectivas son válidas y complementarias.
        </p>
      </div>
    </div>
  );
}
