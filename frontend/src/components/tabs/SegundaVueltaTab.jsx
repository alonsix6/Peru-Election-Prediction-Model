const KEIKO_COLOR = '#DC2626';
const SANCHEZ_COLOR = '#1D4ED8';

// Alliance context — editorial data (news-sourced, not from live polls)
// Sources: communicados oficiales, declaraciones públicas, La República, RPP, Infobae
const KEIKO_ALLIANCES = [
  {
    name: 'Rafael López Aliaga',
    pct: 11.9,
    status: 'formal',
    note: 'Renovación Popular — apoyo formal confirmado. Mayor bloque de votos transferibles.',
  },
  {
    name: 'Jorge Nieto',
    pct: 11.0,
    status: 'incierto',
    note: 'Partido del Buen Gobierno — en negociaciones. Sin confirmar al 19/05/2026.',
  },
];

const SANCHEZ_ADJACENT = [
  {
    name: 'López Chau',
    pct: 7.3,
    status: 'ambiguo',
    note: 'Ahora Nación — descartó votar por Keiko. Sin anuncio formal de apoyo a Sánchez.',
  },
  {
    name: 'Marisol Pérez Tello',
    pct: 3.4,
    status: 'parcial',
    note: 'Primero la Gente — partido apoya a Sánchez. Ella personalmente votará viciado.',
  },
];

const SIN_POSICION = [
  { name: 'Belmont', pct: 10.2, note: 'Retirado, sin pronunciamiento público.' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPollTypLabel(pollType) {
  if (pollType === 'intencion_voto') return 'Intención de voto';
  if (pollType === 'simulacro') return 'Simulacro (votos válidos)';
  return pollType || '—';
}

function PollsTable({ r2polls }) {
  const polls = r2polls?.polls || [];

  if (polls.length === 0) {
    return (
      <div style={{ color: '#78716C', fontSize: 13, textAlign: 'center', padding: 20 }}>
        {r2polls === null
          ? 'Error cargando encuestas — reintenta en un momento.'
          : 'Sin encuestas de segunda vuelta aún.'}
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E0D8' }}>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Encuestadora</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Campo · Publicada</th>
              <th style={{ textAlign: 'right', padding: '6px 12px', color: KEIKO_COLOR, fontWeight: 600, fontSize: 11 }}>Keiko</th>
              <th style={{ textAlign: 'right', padding: '6px 12px', color: SANCHEZ_COLOR, fontWeight: 600, fontSize: 11 }}>Sánchez</th>
              <th style={{ textAlign: 'right', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>B/N</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', color: '#8C877F', fontWeight: 500, fontSize: 11 }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {polls.map(p => {
              const keiko = p.results?.find(r => r.candidate?.includes('Keiko'));
              const sanchez = p.results?.find(r => r.candidate?.includes('Sánchez') || r.candidate?.includes('Roberto'));
              const fieldRange = `${formatDate(p.field_start)}–${formatDate(p.field_end)}`;
              const pub = p.published_date ? formatDate(p.published_date) : '—';
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ padding: '10px 12px', color: '#1C1917', fontWeight: 600 }}>{p.pollster}</td>
                  <td style={{ padding: '10px 12px', color: '#78716C', fontSize: 12 }}>
                    {fieldRange}<br />
                    <span style={{ color: '#A8A29E' }}>pub. {pub}</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: KEIKO_COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {keiko ? keiko.pct_raw.toFixed(0) + '%' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: SANCHEZ_COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {sanchez ? sanchez.pct_raw.toFixed(0) + '%' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#78716C', fontVariantNumeric: 'tabular-nums' }}>
                    {p.pct_blank_null != null ? p.pct_blank_null.toFixed(0) + '%' : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#78716C', fontSize: 12 }}>{getPollTypLabel(p.poll_type)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {polls.map(p => p.notes && (
        <div key={p.id + '_note'} style={{ color: '#A8A29E', fontSize: 11, marginTop: 6 }}>
          <strong>{p.pollster}:</strong> {p.notes}
        </div>
      ))}
      <div style={{
        marginTop: 10, background: '#FFFBEB', border: '1px solid #FCD34D',
        borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#92400E',
      }}>
        Circulan encuestas falsas atribuidas a Datum, Ipsos e IEP. Solo las encuestas mostradas aquí han sido verificadas. IEP emitió comunicado el 16/05/2026 confirmando que no publicó ninguna encuesta de mayo.
      </div>
    </>
  );
}

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

function PMvsPollsSection({ polymarket, r2polls }) {
  const keikoPM = polymarket?.candidates?.find(c => c.candidate?.includes('Keiko'));
  const sanchezPM = polymarket?.candidates?.find(c => c.candidate?.includes('Sánchez') || c.candidate?.includes('Roberto'));

  const polls = r2polls?.polls || [];
  const keikoPct = keikoPM ? (keikoPM.probability * 100).toFixed(0) : null;
  const sanchezPct = sanchezPM ? (sanchezPM.probability * 100).toFixed(0) : null;
  const volumeM = polymarket?.volume_usd ? (polymarket.volume_usd / 1e6).toFixed(1) : null;

  // Weighted average raw intent from polls
  let wKeikoSum = 0, wSanchezSum = 0, wTotal = 0;
  for (const p of polls) {
    const keiko = p.results?.find(r => r.candidate?.includes('Keiko'));
    const sanchez = p.results?.find(r => r.candidate?.includes('Sánchez') || r.candidate?.includes('Roberto'));
    const w = p.effective_weight || 1;
    if (keiko && sanchez) {
      wKeikoSum += keiko.pct_raw * w;
      wSanchezSum += sanchez.pct_raw * w;
      wTotal += w;
    }
  }
  const avgKeiko = wTotal > 0 ? (wKeikoSum / wTotal).toFixed(0) : null;
  const avgSanchez = wTotal > 0 ? (wSanchezSum / wTotal).toFixed(0) : null;

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      borderLeft: '4px solid #7C3AED', padding: 20
    }}>
      <h3 style={{ color: '#7C3AED', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
        Polymarket vs. Encuestas
      </h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
          <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>
            Polymarket (mercado){volumeM && <span style={{ color: '#A8A29E' }}> · ${volumeM}M vol.</span>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ color: KEIKO_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
                {keikoPct != null ? keikoPct + '%' : '—'}
              </div>
              <div style={{ color: '#A8A29E', fontSize: 10 }}>Keiko</div>
            </div>
            <div>
              <div style={{ color: SANCHEZ_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
                {sanchezPct != null ? sanchezPct + '%' : '—'}
              </div>
              <div style={{ color: '#A8A29E', fontSize: 10 }}>Sánchez</div>
            </div>
          </div>
          {polymarket?.captured_at_lima && (
            <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 6 }}>
              {new Date(polymarket.captured_at_lima).toLocaleString('es-PE', { timeZone: 'America/Lima', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 180, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
          <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>
            Encuestas (intención bruta, promedio ponderado)
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ color: KEIKO_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
                {avgKeiko != null ? avgKeiko + '%' : '—'}
              </div>
              <div style={{ color: '#A8A29E', fontSize: 10 }}>Keiko</div>
            </div>
            <div>
              <div style={{ color: SANCHEZ_COLOR, fontWeight: 700, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
                {avgSanchez != null ? avgSanchez + '%' : '—'}
              </div>
              <div style={{ color: '#A8A29E', fontSize: 10 }}>Sánchez</div>
            </div>
          </div>
          {polls.length > 0 && (
            <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 6 }}>
              {polls.length} encuesta{polls.length > 1 ? 's' : ''} — ~{polls.reduce((s, p) => {
                const bn = p.pct_blank_null || 0;
                const nd = p.pct_undecided || 0;
                return s + Math.max(bn, nd);
              }, 0) / polls.length | 0}% no comprometidos
            </div>
          )}
        </div>
      </div>
      <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
        A diferencia de la primera vuelta, en R2 Polymarket <em>sí</em> cotiza directamente P(ganar la presidencia) — que es exactamente lo que mide la segunda vuelta.
        La brecha entre el mercado y las encuestas sugiere que PM incorpora información no capturada en sondeos
        (encuestas internas de campaña, alianzas en formación) o bien que existe un sesgo especulativo.
      </p>
      <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
        El modelo usa α=0.65 (cap reducido desde 0.77 en R1) para evitar sobreponderación del mercado ante este gap inusual.
        Las encuestas mantienen el 35% del peso en todo momento.
      </p>
    </div>
  );
}

function AllianceSection() {
  const statusLabel = {
    formal: { label: 'apoyo formal', color: '#16A34A' },
    incierto: { label: 'en negociaciones', color: '#D97706' },
    ambiguo: { label: 'posición ambigua', color: '#78716C' },
    parcial: { label: 'partido sí / ella no', color: '#78716C' },
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
      <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
        Alianzas y transferencia de voto
      </h3>
      <p style={{ color: '#A8A29E', fontSize: 12, margin: '0 0 14px' }}>
        Transferencia histórica estimada: 40–60% del voto de un candidato sigue efectivamente la recomendación de su líder.
        Barra de opacidad reduce para posiciones no confirmadas.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Sánchez side */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ color: SANCHEZ_COLOR, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Sector Sánchez
          </div>
          {SANCHEZ_ADJACENT.map(a => {
            const s = statusLabel[a.status];
            return (
              <div key={a.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                  <span style={{ color: '#1C1917', fontSize: 13 }}>{a.name}</span>
                  <span style={{ color: SANCHEZ_COLOR, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{a.pct}% en R1</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{
                    background: s.color + '20', color: s.color,
                    borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600
                  }}>{s.label}</span>
                </div>
                <div style={{ color: '#A8A29E', fontSize: 11 }}>{a.note}</div>
                <div style={{ height: 4, borderRadius: 2, background: '#F0EDE8', marginTop: 4 }}>
                  <div style={{ width: `${(a.pct / 15) * 100}%`, height: '100%', borderRadius: 2, background: SANCHEZ_COLOR, opacity: 0.25 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Keiko side */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ color: KEIKO_COLOR, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Sector Keiko
          </div>
          {KEIKO_ALLIANCES.map(a => {
            const s = statusLabel[a.status];
            return (
              <div key={a.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                  <span style={{ color: '#1C1917', fontSize: 13 }}>{a.name}</span>
                  <span style={{ color: KEIKO_COLOR, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{a.pct}% en R1</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{
                    background: s.color + '20', color: s.color,
                    borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600
                  }}>{s.label}</span>
                </div>
                <div style={{ color: '#A8A29E', fontSize: 11 }}>{a.note}</div>
                <div style={{ height: 4, borderRadius: 2, background: '#F0EDE8', marginTop: 4 }}>
                  <div style={{ width: `${(a.pct / 15) * 100}%`, height: '100%', borderRadius: 2, background: KEIKO_COLOR, opacity: a.status === 'formal' ? 0.65 : 0.25 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sin posición */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EDE8' }}>
        <div style={{ color: '#78716C', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Sin pronunciamiento</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SIN_POSICION.map(a => (
            <div key={a.name} style={{ background: '#F7F4EF', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
              <span style={{ color: '#1C1917', fontWeight: 600 }}>{a.name}</span>
              <span style={{ color: '#A8A29E', marginLeft: 6 }}>{a.pct}% en R1 · {a.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeographicSection() {
  const data = [
    { region: 'Lima Metropolitana', keiko: 41, sanchez: 22, note: 'Keiko +19pp' },
    { region: 'Interior / Rural', keiko: 26, sanchez: 55, note: 'Sánchez +29pp' },
  ];

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
      <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
        Polarización geográfica
      </h3>
      <p style={{ color: '#A8A29E', fontSize: 12, margin: '0 0 14px' }}>
        Intención de voto por región (IEP, abr 2026). Replica el patrón Castillo 2021: Lima vs. el resto del país.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(r => (
          <div key={r.region}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#1C1917', fontWeight: 600, fontSize: 13 }}>{r.region}</span>
              <span style={{ color: '#A8A29E', fontSize: 11 }}>{r.note}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: KEIKO_COLOR, fontSize: 11, fontWeight: 600 }}>Keiko {r.keiko}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#F0EDE8' }}>
                  <div style={{ width: `${r.keiko}%`, height: '100%', borderRadius: 4, background: KEIKO_COLOR, opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                  <span style={{ color: SANCHEZ_COLOR, fontSize: 11, fontWeight: 600 }}>Sánchez {r.sanchez}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#F0EDE8', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: `${r.sanchez}%`, height: '100%', borderRadius: 4, background: SANCHEZ_COLOR, opacity: 0.7 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AntiVotoSection({ antivoto }) {
  const candidates = antivoto?.candidates || [];
  const keiko = candidates.find(c => c.candidate?.includes('Keiko'));
  const sanchez = candidates.find(c => c.candidate?.includes('Sánchez') || c.candidate?.includes('Roberto'));

  const renderCard = (data, color, shortName) => {
    if (!data) return null;
    const prev = data.history?.length > 1 ? data.history[data.history.length - 2] : null;
    const delta = prev ? (data.latest_pct_no - prev.pct_no).toFixed(0) : null;
    const deltaLabel = delta === null ? null
      : delta > 0 ? `+${delta}pp desde ${prev.field_end.slice(5).replace('-', '/')}`
      : `${delta}pp desde ${prev.field_end.slice(5).replace('-', '/')}`;

    return (
      <div style={{ flex: 1, minWidth: 160, background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#8C877F', fontSize: 11, marginBottom: 6 }}>{shortName}</div>
        <div style={{ color, fontWeight: 700, fontSize: 24, fontVariantNumeric: 'tabular-nums' }}>
          {data.latest_pct_no}%
        </div>
        <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 2 }}>definitivamente no votaría</div>
        {deltaLabel && (
          <div style={{ color: parseInt(delta) < 0 ? '#16A34A' : '#DC2626', fontSize: 10, marginTop: 2, fontWeight: 600 }}>
            {deltaLabel}
          </div>
        )}
        {data.pollster && (
          <div style={{ color: '#A8A29E', fontSize: 10, marginTop: 4 }}>
            {data.pollster} · {data.latest_field_end}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      borderLeft: '4px solid #DC2626', padding: 20
    }}>
      <h3 style={{ color: '#DC2626', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
        Antivoto — el factor estructural
      </h3>
      {candidates.length === 0 ? (
        <div style={{ color: '#A8A29E', fontSize: 13 }}>Datos de antivoto no disponibles.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            {renderCard(keiko, KEIKO_COLOR, 'Keiko Fujimori')}
            {renderCard(sanchez, SANCHEZ_COLOR, 'Roberto Sánchez')}
          </div>
          <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
            El antivoto de Keiko bajó 11pp en tres semanas — su mejor registro en segunda vuelta —
            pero sigue siendo el más alto de los dos candidatos. El de Sánchez subió 4pp a medida que
            fue conociéndose más (su "no sé quién es" bajó del 30% al 5%).
          </p>
          {(keiko || sanchez) && (
            <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
              Fuente: {keiko?.pollster || sanchez?.pollster || 'Ipsos'}.
              Agrega la nueva encuesta en la DB para actualizar automáticamente.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function SegundaVueltaTab({ predictions, polymarket, r2polls, antivoto }) {
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
          Predicción del modelo (actualizada automáticamente)
        </div>
        <HeadToHead predictions={predictions} />
        {predictions?.generated_at_lima && (
          <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 12 }}>
            Última actualización: {new Date(predictions.generated_at_lima).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            {' · '}α Polymarket: {predictions.polymarket_weight ? (predictions.polymarket_weight * 100).toFixed(0) + '%' : '—'}
          </div>
        )}
      </div>

      {/* Polls table — dynamic from API */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: 16 }}>
        <h3 style={{ color: '#1C1917', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
          Encuestas publicadas
        </h3>
        <p style={{ color: '#A8A29E', fontSize: 12, margin: '0 0 12px' }}>
          Todas las encuestas de segunda vuelta verificadas hasta la fecha.
        </p>
        <PollsTable r2polls={r2polls} />
      </div>

      {/* PM vs Polls — dynamic */}
      <PMvsPollsSection polymarket={polymarket} r2polls={r2polls} />

      {/* Alliance context — editorial */}
      <AllianceSection />

      {/* Geographic breakdown — editorial, sourced from IEP */}
      <GeographicSection />

      {/* Antivoto — dynamic from API */}
      <AntiVotoSection antivoto={antivoto} />

      {/* Historical pattern */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
        borderLeft: '4px solid #78716C', padding: 20
      }}>
        <h3 style={{ color: '#78716C', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          El patrón histórico de Keiko en segunda vuelta
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[
            { year: 2016, r1: 39.9, r2: 49.9, r2votes: '8.9M', lost_to: 'PPK', margin: '42 mil votos', note: 'Iba adelante en encuestas R2' },
            { year: 2021, r1: 13.4, r2: 47.1, r2votes: '8.8M', lost_to: 'Castillo', margin: '44 mil votos', note: 'Empate técnico en encuestas R2' },
          ].map(e => (
            <div key={e.year} style={{ background: '#F7F4EF', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#1C1917', fontWeight: 600, fontSize: 13 }}>{e.year}</span>
                <span style={{ color: '#78716C', fontSize: 12 }}>Perdió por {e.margin}</span>
              </div>
              <div style={{ color: '#78716C', fontSize: 12, lineHeight: 1.5 }}>
                Primera vuelta: {e.r1}% → Segunda vuelta: {e.r2}% (~{e.r2votes} votos) vs. {e.lost_to}. {e.note}.
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Keiko ha llegado a segunda vuelta dos veces y ha perdido ambas por márgenes mínimos (menos de 45 mil votos).
          Sánchez replica el patrón geográfico de Castillo (2021): dominante en sierra y selva, débil en Lima.
          El voto rural es su base natural y crece en segunda vuelta cuando el electorado se polariza.
        </p>
      </div>
    </div>
  );
}
