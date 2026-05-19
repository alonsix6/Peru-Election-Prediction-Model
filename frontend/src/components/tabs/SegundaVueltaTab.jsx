// Encuestas R2 publicadas (hardcoded — se actualizan cuando entren nuevas encuestas)
const R2_POLLS = [
  {
    pollster: 'IEP',
    dates: '1–7 mayo 2026',
    n: 1500,
    keiko: 49.2,
    sanchez: 50.8,
    blancoNulo: null,
    type: 'Simulacro (votos válidos)',
    note: 'Sánchez +1.6pp — empate dentro del margen ±2.5%',
  },
  {
    pollster: 'Ipsos',
    dates: '23–24 abril 2026',
    n: 1200,
    keiko: 38,
    sanchez: 38,
    blancoNulo: 24,
    type: 'Intención de voto',
    note: 'Empate técnico — blanco/nulo 24%',
  },
];

const KEIKO_COLOR = '#DC2626';
const SANCHEZ_COLOR = '#1D4ED8';

function HeadToHead({ predictions }) {
  const cands = predictions?.candidates || [];
  const keiko = cands.find(c => c.candidate?.includes('Keiko') || c.candidate?.includes('Fujimori'));
  const sanchez = cands.find(c => c.candidate?.includes('Sánchez') || c.candidate?.includes('Roberto'));

  if (!keiko && !sanchez) {
    return (
      <div style={{
        background: '#F7F4EF', borderRadius: 12, padding: 20,
        color: '#78716C', textAlign: 'center', fontSize: 13
      }}>
        Modelo segunda vuelta inicializando — datos disponibles cuando el modelo corra su primera predicción R2.
      </div>
    );
  }

  const candidates = [
    { data: keiko, name: 'Keiko Fujimori', party: 'Fuerza Popular', color: KEIKO_COLOR },
    { data: sanchez, name: 'Roberto Sánchez Palomino', party: 'Juntos por el Perú', color: SANCHEZ_COLOR },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {candidates.map(({ data, name, party, color }) => (
        <div key={name} style={{
          flex: 1, minWidth: 200, background: '#FFFFFF',
          border: `2px solid ${color}20`, borderRadius: 12, padding: 20,
        }}>
          <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>{party}</div>
          <div style={{ color: '#1C1917', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{name}</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 4 }}>Predicción del modelo</div>
            <div style={{ color, fontWeight: 700, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>
              {data ? data.mean.toFixed(1) : '—'}%
            </div>
            {data && (
              <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 2 }}>
                IC 90%: [{data.p10.toFixed(1)}%, {data.p90.toFixed(1)}%]
              </div>
            )}
          </div>

          <div>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 4 }}>P(ganar segunda vuelta)</div>
            <div style={{ color, fontWeight: 600, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
              {data ? data.prob_win.toFixed(1) : '—'}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SegundaVueltaTab({ predictions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ color: '#1C1917', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
          Segunda Vuelta — 7 de junio de 2026
        </h2>
        <p style={{ color: '#78716C', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Keiko Fujimori (17.2%) vs. Roberto Sánchez Palomino (12.0%) —
          clasificados por la ONPE con resultados al 100% proclamados el 17/05/2026.
        </p>
      </div>

      {/* Model prediction head-to-head */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <div style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Predicción del modelo (actualizada cada 30 min)
        </div>
        <HeadToHead predictions={predictions} />
        {predictions?.generated_at_lima && (
          <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 12 }}>
            Última actualización: {new Date(predictions.generated_at_lima).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            {' · '}α Polymarket: {predictions.polymarket_weight ? (predictions.polymarket_weight * 100).toFixed(0) + '%' : '—'}
          </div>
        )}
      </div>

      {/* Polls table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
          Encuestas publicadas
        </h3>
        <p style={{ color: '#A8A29E', fontSize: 12, margin: '0 0 12px' }}>
          Todas las encuestas de segunda vuelta disponibles hasta la fecha.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D8' }}>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Encuestadora</th>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Fechas</th>
                <th style={{ textAlign: 'right', padding: '6px 12px', color: KEIKO_COLOR, fontWeight: 600, fontSize: 11 }}>Keiko</th>
                <th style={{ textAlign: 'right', padding: '6px 12px', color: SANCHEZ_COLOR, fontWeight: 600, fontSize: 11 }}>Sánchez</th>
                <th style={{ textAlign: 'right', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>B/N</th>
                <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {R2_POLLS.map(p => (
                <tr key={p.pollster + p.dates} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ padding: '10px 12px', color: '#1C1917', fontWeight: 600 }}>{p.pollster}</td>
                  <td style={{ padding: '10px 12px', color: '#78716C' }}>{p.dates}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: KEIKO_COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.keiko}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: SANCHEZ_COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.sanchez}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#78716C', fontVariantNumeric: 'tabular-nums' }}>{p.blancoNulo !== null ? p.blancoNulo + '%' : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#78716C', fontSize: 12 }}>{p.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {R2_POLLS.map(p => (
            <div key={p.pollster} style={{ color: '#A8A29E', fontSize: 11 }}>
              <strong>{p.pollster}:</strong> {p.note}
            </div>
          ))}
        </div>
      </div>

      {/* PM vs Polls divergence */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
        borderLeft: '4px solid #7C3AED', padding: 20
      }}>
        <h3 style={{ color: '#7C3AED', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          Polymarket vs. Encuestas — divergencia de 27pp
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>Polymarket (mercado)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <div style={{ color: KEIKO_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>~65%</div>
                <div style={{ color: '#A8A29E', fontSize: 10 }}>Keiko</div>
              </div>
              <div>
                <div style={{ color: SANCHEZ_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>~34%</div>
                <div style={{ color: '#A8A29E', fontSize: 10 }}>Sánchez</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>Encuestas (promedio)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <div style={{ color: KEIKO_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>~44%</div>
                <div style={{ color: '#A8A29E', fontSize: 10 }}>Keiko</div>
              </div>
              <div>
                <div style={{ color: SANCHEZ_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>~46%</div>
                <div style={{ color: '#A8A29E', fontSize: 10 }}>Sánchez</div>
              </div>
            </div>
          </div>
        </div>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
          A diferencia de la primera vuelta, en R2 Polymarket <em>sí</em> cotiza directamente P(ganar la presidencia) — que es exactamente lo que mide la segunda vuelta.
          El gap de 27pp entre PM y encuestas sugiere que el mercado está incorporando información no capturada en las encuestas
          (encuestas internas de campaña, alianzas en formación, percepción mediática) o bien que existe una burbuja especulativa.
        </p>
        <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
          El modelo usa α=0.65 (cap reducido desde 0.77 en R1) para evitar sobreponderación del mercado ante este gap inusual.
          Las encuestas mantienen el 35% del peso en todo momento.
        </p>
      </div>

      {/* Alliance context */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
          Contexto: alianzas y transferencia de voto
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: SANCHEZ_COLOR, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              Apoyos a Roberto Sánchez
            </div>
            {[
              { name: 'López Chau', pct: 8.0, note: 'Ahora Nación — apoyo explícito' },
              { name: 'Marisol Pérez Tello', pct: 5.4, note: 'Primero la Gente — apoyo explícito' },
            ].map(a => (
              <div key={a.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#1C1917', fontSize: 13 }}>{a.name}</span>
                  <span style={{ color: SANCHEZ_COLOR, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{a.pct}% en R1</span>
                </div>
                <div style={{ color: '#A8A29E', fontSize: 11 }}>{a.note}</div>
                <div style={{ height: 5, borderRadius: 3, background: '#F0EDE8', marginTop: 4 }}>
                  <div style={{ width: `${(a.pct / 20) * 100}%`, height: '100%', borderRadius: 3, background: SANCHEZ_COLOR, opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: KEIKO_COLOR, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              Apoyos a Keiko Fujimori
            </div>
            {[
              { name: 'Jorge Nieto', pct: 11.0, note: 'Partido del Buen Gobierno — alianza formal' },
            ].map(a => (
              <div key={a.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#1C1917', fontSize: 13 }}>{a.name}</span>
                  <span style={{ color: KEIKO_COLOR, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{a.pct}% en R1</span>
                </div>
                <div style={{ color: '#A8A29E', fontSize: 11 }}>{a.note}</div>
                <div style={{ height: 5, borderRadius: 3, background: '#F0EDE8', marginTop: 4 }}>
                  <div style={{ width: `${(a.pct / 20) * 100}%`, height: '100%', borderRadius: 3, background: KEIKO_COLOR, opacity: 0.5 }} />
                </div>
              </div>
            ))}
            <p style={{ color: '#A8A29E', fontSize: 11, margin: '8px 0 0' }}>
              La transferencia de voto nunca es perfecta — los votantes de un candidato no siguen automáticamente la recomendación de su líder.
              Históricamente, entre 40–60% del voto transferible se transfiere efectivamente.
            </p>
          </div>
        </div>
      </div>

      {/* Historical pattern */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
        borderLeft: '4px solid #DC2626', padding: 20
      }}>
        <h3 style={{ color: '#DC2626', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          El patrón histórico de Keiko en segunda vuelta
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[
            { year: 2016, r1: 39.9, r2: 49.9, lost_to: 'PPK', margin: '42k votos', note: 'Iba adelante en encuestas R2' },
            { year: 2021, r1: 13.4, r2: 47.1, lost_to: 'Castillo', margin: '44k votos', note: 'Empate técnico en encuestas R2' },
          ].map(e => (
            <div key={e.year} style={{ background: '#FEF2F2', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#1C1917', fontWeight: 600, fontSize: 13 }}>{e.year}</span>
                <span style={{ color: '#DC2626', fontSize: 12 }}>Perdió por {e.margin}</span>
              </div>
              <div style={{ color: '#78716C', fontSize: 12, lineHeight: 1.5 }}>
                Primera vuelta: {e.r1}% → Segunda vuelta: {e.r2}% (vs {e.lost_to}). {e.note}.
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
          Keiko ha llegado a segunda vuelta dos veces y ha perdido ambas por márgenes mínimos (menos de 45k votos).
          Su alta tasa de rechazo definitivo — <strong style={{ color: '#1C1917' }}>60.5%</strong> según Ipsos/CIT — es el factor
          estructural que la pone en desventaja independientemente de su performance en primera vuelta.
        </p>
        <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
          Sánchez replica el patrón geográfico de Castillo (2021): Lima ~3%, Sierra ~24%, Selva ~23%.
          El voto rural es su base natural y crece en segunda vuelta cuando el electorado se polariza.
        </p>
      </div>

      {/* Blank/null vote note */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
          Voto en blanco y nulo — el tercer actor
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            background: '#F7F4EF', borderRadius: 8, padding: '8px 16px',
            textAlign: 'center', minWidth: 80, flexShrink: 0
          }}>
            <div style={{ color: '#D97706', fontWeight: 700, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>24%</div>
            <div style={{ color: '#A8A29E', fontSize: 10 }}>Ipsos abr 23-24</div>
          </div>
          <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Un cuarto del electorado declara que votará en blanco o nulo — nivel inusualmente alto que refleja
            el rechazo a ambos candidatos. En segunda vuelta, el voto blanco/nulo no cambia el resultado
            (se decide por votos válidos), pero afecta la legitimidad percibida del ganador.
            El modelo redistribuye este porcentaje en sus proyecciones de votos válidos.
          </p>
        </div>
      </div>
    </div>
  );
}
