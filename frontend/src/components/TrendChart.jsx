import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getPartyColor } from '../config/partyColors';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Top candidatos a graficar (sólidos)
const TOP_CANDIDATES = [
  'Keiko Fujimori', 'Carlos Álvarez', 'Rafael López Aliaga',
  'Roberto Sánchez Palomino', 'López Chau', 'Jorge Nieto'
];

// Candidatos secundarios (línea punteada)
const SECONDARY_CANDIDATES = [
  'Ricardo Belmont'
];

/**
 * Agrupa encuestas por período quincenal y calcula promedios por candidato.
 */
function buildTrendData(polls) {
  if (!polls?.polls?.length) return null;

  // Definir períodos quincenales
  const periods = [
    { label: 'Nov 25', start: '2025-11-01', end: '2025-12-01' },
    { label: 'Ene 26', start: '2026-01-01', end: '2026-02-01' },
    { label: 'Feb I', start: '2026-02-01', end: '2026-02-15' },
    { label: 'Feb II', start: '2026-02-15', end: '2026-03-01' },
    { label: 'Mar I', start: '2026-03-01', end: '2026-03-15' },
    { label: 'Mar II', start: '2026-03-15', end: '2026-03-25' },
    { label: 'Mar III', start: '2026-03-25', end: '2026-04-01' },
    { label: 'Abr I', start: '2026-04-01', end: '2026-04-06' },
  ];

  // Para cada período y candidato, promediar los resultados
  const allCandidates = [...TOP_CANDIDATES, ...SECONDARY_CANDIDATES];
  const data = {};
  for (const cand of allCandidates) data[cand] = [];

  for (const period of periods) {
    const pStart = new Date(period.start);
    const pEnd = new Date(period.end);

    // Encontrar encuestas en este período
    const periodPolls = polls.polls.filter(p => {
      const fe = new Date(p.field_end);
      return fe >= pStart && fe < pEnd;
    });

    // Promediar por candidato
    for (const cand of allCandidates) {
      const values = [];
      for (const poll of periodPolls) {
        const result = poll.results?.find(r => r.candidate === cand);
        if (result) values.push(result.pct_raw);
      }
      data[cand].push(values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null);
    }
  }

  return { labels: periods.map(p => p.label), data };
}

export default function TrendChart({ polls }) {
  const trend = useMemo(() => buildTrendData(polls), [polls]);

  if (!trend) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
        padding: 16, textAlign: 'center', color: '#78716C'
      }}>
        Cargando tendencias...
      </div>
    );
  }

  const chartData = {
    labels: trend.labels,
    datasets: [
      ...TOP_CANDIDATES.map(name => {
        const color = getPartyColor(name);
        return {
          label: name,
          data: trend.data[name],
          borderColor: color.primary,
          backgroundColor: color.primary + '33',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: color.primary,
          tension: 0.3,
          spanGaps: true,
        };
      }),
      ...SECONDARY_CANDIDATES.map(name => {
        const color = getPartyColor(name);
        return {
          label: name,
          data: trend.data[name],
          borderColor: color.primary,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          pointBackgroundColor: color.primary,
          tension: 0.3,
          spanGaps: true,
        };
      }),
    ],
  };

  // Encontrar max para escala Y
  const allCands = [...TOP_CANDIDATES, ...SECONDARY_CANDIDATES];
  const allValues = allCands.flatMap(c => trend.data[c]).filter(v => v !== null);
  const maxVal = Math.max(...allValues, 15);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#78716C', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#1C1917',
        bodyColor: '#78716C',
        borderColor: '#E5E0D8',
        borderWidth: 1,
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#E5E0D8' },
        ticks: { color: '#8C877F', font: { size: 11 } }
      },
      y: {
        min: 0,
        max: Math.ceil(maxVal / 5) * 5,
        grid: { color: '#E5E0D8' },
        ticks: { color: '#8C877F', callback: v => v + '%', font: { size: 11 } }
      }
    }
  };

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      padding: 16
    }}>
      <h3 style={{ color: '#1C1917', fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>
        Tendencia de encuestas
      </h3>
      <p style={{ color: '#8C877F', fontSize: 12, margin: '0 0 12px' }}>
        Promedio de encuestas por período. {polls?.total_polls || 0} encuestas de {6} casas encuestadoras.
      </p>
      <div style={{ height: 350 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
