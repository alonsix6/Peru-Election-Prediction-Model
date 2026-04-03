import { useState } from 'react';
import CandidateCard from '../CandidateCard';
import TrendChart from '../TrendChart';

const POLLSTER_INFO = [
  { name: 'IEP', weight: '1.25x', note: 'Mejor track record 2021. Captó crecimiento de Castillo. Mayor cobertura rural.' },
  { name: 'Datum', weight: '1.10x', note: 'Mayor muestra (n=2000). Ficha técnica más robusta.' },
  { name: 'Ipsos', weight: '1.00x', note: 'Referencia base. Metodología consistente.' },
  { name: 'CPI', weight: '0.95x', note: 'Ligeramente menor precisión en 2021.' },
  { name: 'CIT', weight: '0.85x', note: 'Sin data comparable 2021. Penalización por incertidumbre.' },
];

export default function PrimeraVueltaTab({ predictions, polls }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!predictions?.candidates?.length) {
    return <div style={{ color: '#78716C', textAlign: 'center', padding: 40 }}>Sin datos de predicción.</div>;
  }

  const sorted = [...predictions.candidates].sort((a, b) => b.mean - a.mean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ color: '#1C1917', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
          Primera Vuelta
        </h2>
        <p style={{ color: '#78716C', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          ¿Qué porcentaje obtendrá cada candidato el 12 de abril?
          Los dos primeros pasan a segunda vuelta el 7 de junio.
        </p>
      </div>

      {/* Candidate cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((c, i) => (
          <CandidateCard
            key={c.candidate}
            candidate={c}
            rank={i + 1}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>

      {/* Trend Chart */}
      <TrendChart />

      {/* Pollster weight table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
          Peso de encuestadoras
        </h3>
        <p style={{ color: '#78716C', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
          El peso de cada encuestadora se basa en su precisión real en las elecciones de 2021 (MAE — Error Absoluto Medio).
          IEP fue la única que captó el crecimiento de Castillo antes de la elección.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D8' }}>
                <th style={{ color: '#78716C', fontWeight: 500, padding: '8px 12px', textAlign: 'left' }}>Encuestadora</th>
                <th style={{ color: '#78716C', fontWeight: 500, padding: '8px 12px', textAlign: 'center' }}>Peso</th>
                <th style={{ color: '#78716C', fontWeight: 500, padding: '8px 12px', textAlign: 'left' }}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {POLLSTER_INFO.map(p => (
                <tr key={p.name} style={{ borderBottom: '1px solid #E5E0D8' }}>
                  <td style={{ color: '#1C1917', fontWeight: 600, padding: '8px 12px' }}>{p.name}</td>
                  <td style={{ color: '#1D4ED8', fontWeight: 600, padding: '8px 12px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{p.weight}</td>
                  <td style={{ color: '#78716C', padding: '8px 12px' }}>{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#A8A29E', fontSize: 12, margin: '12px 0 0', fontStyle: 'italic' }}>
          Total encuestas en el modelo: {polls?.total_polls || 16} de {POLLSTER_INFO.length} casas encuestadoras.
        </p>
      </div>
    </div>
  );
}
