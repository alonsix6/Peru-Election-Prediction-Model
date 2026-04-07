import { useState } from 'react';
import { getPartyColor } from '../../config/partyColors';
import { History, BarChart3, CheckCircle, XCircle, TrendingUp, Info } from 'lucide-react';

const DATA = {
  2016: {
    context: 'Primera vuelta con 3 encuestadoras activas (Ipsos, CPI, Datum). Agregador sin Polymarket — solo encuestas hasta antes de la veda electoral del 3 de abril.',
    candidates: [
      { name: 'Keiko Fujimori', modelo: 37.9, onpe: 39.9, error: -2.0, inIC: true },
      { name: 'Pedro Pablo Kuczynski', modelo: 19.8, onpe: 21.1, error: -1.3, inIC: true },
      { name: 'Verónika Mendoza', modelo: 17.6, onpe: 19.9, error: -2.3, inIC: true },
      { name: 'Alfredo Barnechea', modelo: 12.3, onpe: 7.3, error: +5.1, inIC: false },
      { name: 'Alan García', modelo: 7.5, onpe: 5.8, error: +1.7, inIC: true },
      { name: 'Gregorio Santos', modelo: 4.9, onpe: 4.1, error: +0.7, inIC: true },
    ],
    mae: 2.2,
    ic: '5/6 (83%)',
    pollsters: [
      { name: 'Ipsos', mae: 3.3 },
      { name: 'CPI', mae: 4.0 },
      { name: 'Datum', mae: 4.1 },
    ],
    highlight: 'Acertó el orden del top-3: Keiko 1ra, PPK 2do, Mendoza 3ra. Ningún analista mainstream predijo que PPK superaría a Mendoza.',
    note: 'El error en Barnechea (+5.1) responde a voto estratégico de última hora hacia PPK — fenómeno estructural no capturable por ninguna encuestadora.',
  },
  2021: {
    context: 'Primera vuelta con 4 encuestadoras activas (Ipsos, IEP, CPI, Datum). Agregador sin Polymarket — solo encuestas hasta antes de la veda electoral del 4 de abril.',
    candidates: [
      { name: 'Pedro Castillo', modelo: 12.7, onpe: 18.9, error: -6.2, inIC: false },
      { name: 'Keiko Fujimori', modelo: 11.9, onpe: 13.4, error: -1.5, inIC: true },
      { name: 'Rafael López Aliaga', modelo: 11.8, onpe: 11.8, error: 0.0, inIC: true },
      { name: 'Hernando de Soto', modelo: 13.5, onpe: 11.6, error: +1.9, inIC: true },
      { name: 'Yonhy Lescano', modelo: 15.1, onpe: 8.9, error: +6.2, inIC: false },
      { name: 'Verónika Mendoza', modelo: 10.4, onpe: 7.9, error: +2.5, inIC: true },
      { name: 'George Forsyth', modelo: 12.7, onpe: 6.1, error: +6.6, inIC: false },
      { name: 'César Acuña', modelo: 5.0, onpe: 5.8, error: -0.7, inIC: true },
      { name: 'Daniel Urresti', modelo: 6.8, onpe: 5.4, error: +1.4, inIC: true },
    ],
    mae: 3.0,
    ic: '6/9 (67%)',
    pollsters: [
      { name: 'IEP', mae: 3.5 },
      { name: 'Ipsos', mae: 4.8 },
      { name: 'CPI', mae: 5.1 },
    ],
    highlight: 'Tenía a Castillo en #3 con P(2da vuelta) = 23.6% cuando el consenso no lo consideraba. López Aliaga: predicción perfecta con error de 0.0 puntos.',
    note: 'Lescano y Forsyth fueron sobreestimados por colapso de voto estratégico en las últimas horas — el mismo fenómeno de Barnechea en 2016.',
  },
};

const POLLSTER_COLORS = {
  Ipsos: '#7C3AED', CPI: '#D97706', Datum: '#059669', IEP: '#1D4ED8',
};

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 10,
      padding: 18, flex: 1, minWidth: 160,
    }}>
      <div style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ color: color || '#1C1917', fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{value}</div>
      <div style={{ color: '#8C877F', fontSize: 11 }}>{sub}</div>
    </div>
  );
}

export default function BacktestingTab() {
  const [activeYear, setActiveYear] = useState(2016);
  const d = DATA[activeYear];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Validación histórica</div>
        <h2 style={{ color: '#1C1917', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
          ¿Qué tan bien predijo el modelo en elecciones pasadas?
        </h2>
        <p style={{ color: '#78716C', fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
          Corrimos el agregador hacia atrás usando solo los datos disponibles antes de cada veda electoral — sin información futura, sin ajustes posteriores.
        </p>
      </div>

      {/* Methodology note */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderLeft: '3px solid #1D4ED8',
        borderRadius: '0 10px 10px 0', padding: '16px 20px',
      }}>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: '#1C1917' }}>Metodología:</strong> el modelo combina encuestas de cada ciclo con ponderación bayesiana,
          ajusta por sesgos conocidos de cada encuestadora, redistribuye indecisos y corre 10,000 simulaciones Monte Carlo.{' '}
          <strong style={{ color: '#1C1917' }}>MAE</strong> (error absoluto medio) mide la distancia promedio entre predicción y resultado real en puntos porcentuales.
        </p>
      </div>

      {/* Year tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E0D8' }}>
        {[2016, 2021].map(y => (
          <button
            key={y}
            onClick={() => setActiveYear(y)}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: activeYear === y ? 600 : 400,
              color: activeYear === y ? '#1D4ED8' : '#78716C', background: 'transparent',
              border: 'none', borderBottom: activeYear === y ? '2px solid #1D4ED8' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Context */}
      <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.6 }}>{d.context}</p>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard label="MAE del modelo" value={`${d.mae} pts`} sub="error absoluto medio" color="#059669" />
        <MetricCard label="Calibración IC 90%" value={d.ic} sub="candidatos dentro del intervalo" color="#1D4ED8" />
        <MetricCard
          label="Vs. mejor encuestadora"
          value={`−${(d.pollsters[0].mae - d.mae).toFixed(1)} pts`}
          sub={`mejor que ${d.pollsters[0].name} (${d.pollsters[0].mae} pts)`}
          color="#059669"
        />
      </div>

      {/* Results table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E0D8' }}>
          <span style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Modelo vs. ONPE — votos válidos
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D8' }}>
                <th style={{ textAlign: 'left', padding: '8px 14px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Candidato</th>
                <th style={{ textAlign: 'right', padding: '8px 14px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Modelo</th>
                <th style={{ textAlign: 'right', padding: '8px 14px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>ONPE</th>
                <th style={{ textAlign: 'right', padding: '8px 14px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Error</th>
                <th style={{ textAlign: 'center', padding: '8px 14px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>IC 90%</th>
              </tr>
            </thead>
            <tbody>
              {d.candidates.map(c => {
                const errColor = Math.abs(c.error) < 0.1 ? '#059669' : c.error > 3 ? '#DC2626' : c.error < -3 ? '#D97706' : '#1C1917';
                return (
                  <tr key={c.name} style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ padding: '10px 14px', color: '#1C1917', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1C1917' }}>{c.modelo.toFixed(1)}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#78716C' }}>{c.onpe.toFixed(1)}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: errColor, fontWeight: 500 }}>
                      {c.error > 0 ? '+' : ''}{c.error.toFixed(1)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {c.inIC
                        ? <CheckCircle size={14} style={{ color: '#059669' }} />
                        : <XCircle size={14} style={{ color: '#DC2626' }} />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highlight */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 10, padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <TrendingUp size={16} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: '#1C1917' }}>Hallazgo clave:</strong> {d.highlight}
          </p>
        </div>
      </div>

      {/* Note */}
      <div style={{
        borderLeft: '3px solid #E5E0D8', padding: '12px 16px',
      }}>
        <p style={{ color: '#8C877F', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{d.note}</p>
      </div>

      {/* vs Pollsters */}
      <div>
        <div style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Comparación de MAE — modelo vs. encuestadoras
        </div>

        {/* Model row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0EDE8' }}>
          <span style={{ width: 100, color: '#1D4ED8', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>Modelo</span>
          <div style={{ flex: 1, height: 8, background: '#F0EDE8', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(d.mae / 6) * 100}%`, height: '100%', background: '#1D4ED8', borderRadius: 4 }} />
          </div>
          <span style={{ width: 55, textAlign: 'right', color: '#1D4ED8', fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{d.mae} pts</span>
          <span style={{
            fontSize: 10, padding: '2px 6px', background: '#EFF6FF', color: '#1D4ED8',
            border: '1px solid #BFDBFE', borderRadius: 4, flexShrink: 0
          }}>MEJOR</span>
        </div>

        {/* Pollster rows */}
        {d.pollsters.map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0EDE8' }}>
            <span style={{ width: 100, color: '#78716C', fontSize: 13, flexShrink: 0 }}>{p.name}</span>
            <div style={{ flex: 1, height: 8, background: '#F0EDE8', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(p.mae / 6) * 100}%`, height: '100%', background: POLLSTER_COLORS[p.name] || '#8C877F', opacity: 0.4, borderRadius: 4 }} />
            </div>
            <span style={{ width: 55, textAlign: 'right', color: '#78716C', fontSize: 13, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{p.mae} pts</span>
            <span style={{ width: 48 }} />
          </div>
        ))}
      </div>

      {/* 2026 Polymarket note */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderLeft: '3px solid #1D4ED8',
        borderRadius: '0 12px 12px 0', padding: '20px 24px',
      }}>
        <div style={{ color: '#1D4ED8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Elecciones 2026</div>
        <h4 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Una fuente adicional: Polymarket</h4>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 10px' }}>
          Los backtestings de 2016 y 2021 se corrieron <strong style={{ color: '#1C1917' }}>solo con encuestas</strong> — la misma
          base metodológica que usamos en 2026. Para este ciclo incorporamos adicionalmente los precios de Polymarket como
          señal complementaria, con peso dinámico que crece a medida que avanza la veda electoral.
        </p>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Polymarket captura información que las encuestas no tienen — inteligencia de campaña, organización territorial,
          flujos de dinero — pero no es independiente: ya internaliza parte de las encuestas. Por eso entra con peso calibrado.
          Su peso final el día de la elección es del 77%.
        </p>
      </div>
    </div>
  );
}
