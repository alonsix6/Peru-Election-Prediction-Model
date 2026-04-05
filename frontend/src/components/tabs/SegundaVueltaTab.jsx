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
  const scenarios = (predictions?.runoff_scenarios || []).filter(s => s.frequency >= 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ color: '#1C1917', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
          Segunda Vuelta
        </h2>
        <p style={{ color: '#78716C', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Si ningún candidato supera el 50% en primera vuelta (12 abril), los dos primeros
          se enfrentan en segunda vuelta el <strong style={{ color: '#1C1917' }}>7 de junio de 2026</strong>.
          Estas son las simulaciones de los escenarios más probables.
        </p>
      </div>

      {/* Runoff scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenarios.length === 0 && (
          <div style={{ color: '#78716C', textAlign: 'center', padding: 20 }}>Sin escenarios disponibles.</div>
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
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
          Rechazo definitivo
        </h3>
        <p style={{ color: '#A8A29E', fontSize: 12, margin: '0 0 16px' }}>
          Porcentaje del electorado que dice "Definitivamente NO votaría" por este candidato (CIT, marzo 2026).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REJECTION_DATA.map(d => {
            const party = getPartyColor(d.candidate);
            return (
              <div key={d.candidate}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#78716C', fontSize: 13 }}>{d.candidate}</span>
                  <span style={{ color: d.rejection >= 50 ? '#DC2626' : '#D97706', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {d.rejection}%
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: '#F0EDE8', position: 'relative' }}>
                  <div style={{
                    width: `${d.rejection}%`, height: '100%', borderRadius: 5,
                    background: party.primary
                  }} />
                  {/* 50% reference line */}
                  <div style={{
                    position: 'absolute', left: '50%', top: -2, bottom: -2,
                    width: 2, background: '#D97706', opacity: 0.5
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <span style={{ color: '#D97706', fontSize: 11, opacity: 0.7 }}>— línea: 50% —</span>
        </div>
      </div>

      {/* Calibration note */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
        borderLeft: '4px solid #1D4ED8', padding: 20
      }}>
        <h3 style={{ color: '#1D4ED8', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          ¿Por qué nuestros números difieren de Polymarket?
        </h3>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 4 }}>Nuestro modelo</div>
            <div style={{ color: '#1C1917', fontSize: 13, lineHeight: 1.6 }}>
              Combina <strong>23 encuestas</strong> con Polymarket usando pesos dinámicos.
              Durante la veda, el peso del mercado sube exponencialmente. Refleja el
              estado actual del electorado según los datos concretos disponibles.
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 4 }}>Polymarket</div>
            <div style={{ color: '#1C1917', fontSize: 13, lineHeight: 1.6 }}>
              Mercado con <strong>$6.3M en apuestas</strong> reales. Los precios incorporan
              todo: encuestas, rumores, operadores políticos, encuestas internas de campaña,
              y la probabilidad de eventos imprevistos.
            </div>
          </div>
        </div>

        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
          Ejemplo: Álvarez tiene ~11% en nuestro modelo pero ~24% en Polymarket.
          Esa diferencia existe porque las encuestas todavía lo ven bajo (6-8%),
          pero el mercado está apostando a que va a seguir subiendo. A medida que
          entre la veda electoral y el peso de Polymarket suba, nuestro modelo se
          acercará a lo que dice el mercado.
        </p>
        <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
          Ambas perspectivas son válidas. Mostramos las dos para que tú decidas.
        </p>
      </div>
    </div>
  );
}
