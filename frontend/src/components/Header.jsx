import { useState, useEffect } from 'react';

const PHASE_STYLES = {
  pre_veda: { label: 'Pre-Veda', color: '#38BDF8', bg: '#0C4A6E' },
  veda: { label: 'Veda Electoral', color: '#FB923C', bg: '#7C2D12' },
  election_day: { label: 'Día de Elección', color: '#F87171', bg: '#7F1D1D' },
  post_election: { label: 'Post-Elección', color: '#94A3B8', bg: '#334155' },
};

export default function Header({ status }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const limaTime = now.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const phase = status?.electoral_phase || 'pre_veda';
  const ps = PHASE_STYLES[phase] || PHASE_STYLES.pre_veda;
  const alpha = status?.polymarket_weight;
  const totalHours = status?.total_hours || 0;

  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  const mins = Math.floor((totalHours * 60) % 60);
  const secs = now.getSeconds();

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      padding: '16px 20px',
      borderBottom: '1px solid #334155'
    }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '12px', maxWidth: '1200px', margin: '0 auto'
      }}>
        <div>
          <h1 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            Modelo Electoral Perú 2026
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '2px 0 0' }}>
            Primera vuelta · 12 abril 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#CBD5E1', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
            {limaTime}
          </span>

          <span style={{
            background: ps.bg, color: ps.color, padding: '3px 10px',
            borderRadius: '9999px', fontSize: '12px', fontWeight: 600
          }}>
            {ps.label}
          </span>

          <span style={{
            color: '#F1F5F9', fontVariantNumeric: 'tabular-nums',
            fontSize: '14px', fontWeight: 600
          }}>
            {days}d {String(hours).padStart(2,'0')}h {String(mins).padStart(2,'0')}m {String(secs).padStart(2,'0')}s
          </span>

          {alpha !== null && alpha !== undefined && (
            <span style={{
              background: '#0C4A6E', color: '#38BDF8', padding: '3px 10px',
              borderRadius: '9999px', fontSize: '12px', fontWeight: 600
            }}>
              α {(alpha * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
