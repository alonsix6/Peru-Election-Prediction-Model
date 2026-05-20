import { getPartyColor } from '../config/partyColors';

const KEIKO_COLOR   = getPartyColor('Keiko Fujimori').primary;           // #F97316
const SANCHEZ_COLOR = getPartyColor('Roberto Sánchez Palomino').primary; // #16A34A

// SVG canvas
const CX = 220, CY = 215, R = 175;
const GAUGE_MAX = 15; // ±15pp — covers full IC 80% range

// ─── Math helpers ─────────────────────────────────────────────

// Vote share % → margin in pp (Keiko-centric: positive = Keiko leads)
const voteToMargin = (pct) => 2 * pct - 100;

// Margin (pp) → rotation angle in degrees (0° = straight up, ±90° = edges)
const marginToAngle = (m) => (Math.max(-GAUGE_MAX, Math.min(GAUGE_MAX, m)) / GAUGE_MAX) * 90;

// Angle (degrees from vertical, + = clockwise) → SVG {x, y}
const angleToXY = (deg, r = R) => {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

// SVG wedge path from pivot (CX, CY) to arc between two angles
const wedgePath = (a1, a2, r = R) => {
  const p1 = angleToXY(a1, r);
  const p2 = angleToXY(a2, r);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `M ${CX} ${CY} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${large} ${sweep} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`;
};

// ─── Sub-components ───────────────────────────────────────────

function GaugeArc() {
  // Background arc: Sánchez (green) left half, Keiko (orange) right half
  const leftEnd  = angleToXY(-90);
  const center   = angleToXY(0);
  const rightEnd = angleToXY(90);
  const W = 10;

  return (
    <g opacity={0.18}>
      {/* Left (Sánchez) half */}
      <path
        d={`M ${leftEnd.x.toFixed(1)} ${leftEnd.y.toFixed(1)} A ${R} ${R} 0 0 1 ${center.x.toFixed(1)} ${center.y.toFixed(1)}`}
        stroke={SANCHEZ_COLOR} strokeWidth={W} fill="none" strokeLinecap="round"
      />
      {/* Right (Keiko) half */}
      <path
        d={`M ${center.x.toFixed(1)} ${center.y.toFixed(1)} A ${R} ${R} 0 0 1 ${rightEnd.x.toFixed(1)} ${rightEnd.y.toFixed(1)}`}
        stroke={KEIKO_COLOR} strokeWidth={W} fill="none" strokeLinecap="round"
      />
    </g>
  );
}

function ConfidenceCones({ keiko }) {
  if (!keiko) return null;

  const mean  = keiko.mean;
  const p10   = keiko.p10;
  const p25   = keiko.p25 ?? null;
  const p40   = keiko.p40 ?? null;
  const p60   = keiko.p60 ?? null;
  const p75   = keiko.p75 ?? null;
  const p90   = keiko.p90;

  // Convert to angles
  const aLow80  = marginToAngle(voteToMargin(p10));
  const aHigh80 = marginToAngle(voteToMargin(p90));
  const aLow50  = p25 != null ? marginToAngle(voteToMargin(p25)) : null;
  const aHigh50 = p75 != null ? marginToAngle(voteToMargin(p75)) : null;
  const aLow20  = p40 != null ? marginToAngle(voteToMargin(p40)) : null;
  const aHigh20 = p60 != null ? marginToAngle(voteToMargin(p60)) : null;

  // Determine dominant color based on mean position
  const meanMargin = voteToMargin(mean);
  const coneColor = meanMargin >= 0 ? KEIKO_COLOR : SANCHEZ_COLOR;

  return (
    <g>
      {/* IC 80% — outermost, most transparent */}
      <path d={wedgePath(aLow80, aHigh80)} fill={coneColor} opacity={0.12} />

      {/* IC 50% — medium */}
      {aLow50 != null && aHigh50 != null && (
        <path d={wedgePath(aLow50, aHigh50)} fill={coneColor} opacity={0.20} />
      )}

      {/* IC 20% — innermost, most solid */}
      {aLow20 != null && aHigh20 != null && (
        <path d={wedgePath(aLow20, aHigh20)} fill={coneColor} opacity={0.32} />
      )}
    </g>
  );
}

function TickMarks() {
  const ticks = [];
  // Major labeled ticks every 5pp
  const labeledTicks = [-15, -10, -5, 0, 5, 10, 15];
  // Minor ticks every 1pp
  for (let m = -15; m <= 15; m++) {
    const angle = marginToAngle(m);
    const isMajor = labeledTicks.includes(m);
    const inner = angleToXY(angle, R + (isMajor ? 6 : 3));
    const outer = angleToXY(angle, R + (isMajor ? 16 : 8));
    ticks.push(
      <line
        key={m}
        x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
        x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
        stroke={m === 0 ? '#1C1917' : '#C4BDB5'}
        strokeWidth={isMajor ? 1.5 : 0.8}
      />
    );
  }

  // Labels at major ticks
  labeledTicks.forEach(m => {
    if (m === 0) return; // center label handled separately
    const angle = marginToAngle(m);
    const pos = angleToXY(angle, R + 30);
    const color = m < 0 ? SANCHEZ_COLOR : KEIKO_COLOR;
    const label = m < 0 ? `S+${Math.abs(m)}` : `K+${m}`;
    ticks.push(
      <text
        key={`lbl-${m}`}
        x={pos.x.toFixed(1)} y={pos.y.toFixed(1)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill={color} fontWeight="500"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {label}
      </text>
    );
  });

  return <g>{ticks}</g>;
}

function HistoricalLines() {
  // Keiko's R2 historical results: 2011 (-2.9pp), 2016 (-0.25pp), 2021 (-0.25pp)
  const refs = [
    { margin: -2.90, label: "'11", year: 2011 },
    { margin: -0.25, label: "'16/'21", year: 2016 },
  ];

  return (
    <g>
      {refs.map(({ margin, label }) => {
        const angle = marginToAngle(margin);
        const inner = angleToXY(angle, R - 20);
        const outer = angleToXY(angle, R + 2);
        const labelPos = angleToXY(angle, R - 35);
        return (
          <g key={label}>
            <line
              x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
              x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
              stroke="#A8A29E" strokeWidth={1} strokeDasharray="3 2"
            />
            <text
              x={labelPos.x.toFixed(1)} y={labelPos.y.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill="#A8A29E"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Needle({ keiko }) {
  const meanMargin = keiko?.mean != null ? voteToMargin(keiko.mean) : 0;
  const angle = marginToAngle(meanMargin);

  return (
    <g>
      {/* Needle body — rotates around pivot (CX, CY) */}
      <g transform={`rotate(${angle}, ${CX}, ${CY})`}>
        {/* Thin needle pointing up */}
        <polygon
          points={`${CX},${CY - R + 12} ${CX - 4},${CY} ${CX + 4},${CY}`}
          fill="#1C1917"
        />
      </g>
      {/* Pivot circle */}
      <circle cx={CX} cy={CY} r={7} fill="#1C1917" />
      <circle cx={CX} cy={CY} r={4} fill="#F7F4EF" />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function WinProbabilityNeedle({ keiko, sanchez }) {
  const hasData = keiko != null && sanchez != null;

  const meanMargin = hasData ? voteToMargin(keiko.mean) : null;
  const keikoLeads = meanMargin != null && meanMargin >= 0;
  const leader = keikoLeads ? keiko : sanchez;
  const leaderName = keikoLeads ? 'Keiko Fujimori' : 'Roberto Sánchez';
  const leaderColor = keikoLeads ? KEIKO_COLOR : SANCHEZ_COLOR;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12, padding: '20px 16px 16px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ color: '#8C877F', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Margen proyectado · Votos válidos
        </div>
      </div>

      {/* Candidate labels flanking the gauge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: -8, padding: '0 8px' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: SANCHEZ_COLOR, fontWeight: 700, fontSize: 13 }}>Roberto Sánchez</div>
          <div style={{ color: '#A8A29E', fontSize: 10 }}>Gana si aguja va izquierda</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: KEIKO_COLOR, fontWeight: 700, fontSize: 13 }}>Keiko Fujimori</div>
          <div style={{ color: '#A8A29E', fontSize: 10 }}>Gana si aguja va derecha</div>
        </div>
      </div>

      {/* SVG Needle */}
      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>
        <svg viewBox="0 0 440 230" style={{ width: '100%', overflow: 'visible' }}>
          <GaugeArc />
          {hasData && <ConfidenceCones keiko={keiko} />}
          <TickMarks />
          <HistoricalLines />
          {hasData && <Needle keiko={keiko} />}

          {/* Center "0" label */}
          {(() => {
            const zeroPos = angleToXY(0, R + 30);
            return (
              <text
                x={zeroPos.x.toFixed(1)} y={zeroPos.y.toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="#78716C" fontWeight="600"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Empate
              </text>
            );
          })()}
        </svg>
      </div>

      {/* Bottom readout */}
      {hasData ? (
        <div style={{ textAlign: 'center', marginTop: -8 }}>
          <div style={{ color: leaderColor, fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {leaderName}
          </div>
          <div style={{ color: leaderColor, fontWeight: 600, fontSize: 16, marginTop: 2 }}>
            {meanMargin != null
              ? `${keikoLeads ? 'K' : 'S'}+${Math.abs(meanMargin).toFixed(1)}pp · ${leader.prob_win.toFixed(0)}% de probabilidad`
              : '—'}
          </div>
          <div style={{ color: '#A8A29E', fontSize: 11, marginTop: 6 }}>
            {keiko.p25 != null
              ? `IC 80%: [${voteToMargin(keiko.p10) >= 0 ? 'K' : 'S'}+${Math.abs(voteToMargin(keiko.p10)).toFixed(1)}, ${voteToMargin(keiko.p90) >= 0 ? 'K' : 'S'}+${Math.abs(voteToMargin(keiko.p90)).toFixed(1)}pp]`
              : `IC 80%: [${keiko.p10.toFixed(1)}%, ${keiko.p90.toFixed(1)}%]`
            }
            {' · '}
            <span style={{ color: '#C4BDB5' }}>
              {keiko.p25 != null ? `IC 50%: [${voteToMargin(keiko.p25) >= 0 ? 'K' : 'S'}+${Math.abs(voteToMargin(keiko.p25)).toFixed(1)}, ${voteToMargin(keiko.p75) >= 0 ? 'K' : 'S'}+${Math.abs(voteToMargin(keiko.p75)).toFixed(1)}pp]` : ''}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#A8A29E', fontSize: 13, marginTop: 8 }}>
          Modelo inicializando...
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'IC 20%', opacity: 0.65 },
          { label: 'IC 50%', opacity: 0.40 },
          { label: 'IC 80%', opacity: 0.25 },
        ].map(({ label, opacity }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 8, borderRadius: 3, background: leaderColor, opacity }} />
            <span style={{ color: '#8C877F', fontSize: 10 }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#A8A29E" strokeWidth="1" strokeDasharray="3 2" />
          </svg>
          <span style={{ color: '#8C877F', fontSize: 10 }}>Ref. histórica Keiko</span>
        </div>
      </div>
    </div>
  );
}
