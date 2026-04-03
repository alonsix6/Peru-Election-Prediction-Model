import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getPartyColor } from '../config/partyColors';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const labels = ['Nov 25', 'Ene 26', 'Feb I', 'Feb II', 'Mar I', 'Mar II', 'Mar III', 'Mar IV'];

const TREND_DATA = [
  { name: 'Rafael López Aliaga', data: [12.5, 13.6, 14.6, 13.9, 12.7, 11.7, 9.5, 8.7] },
  { name: 'Keiko Fujimori', data: [7.6, 7.1, 6.6, 7.0, 8.0, 10.1, 11.0, 10.0] },
  { name: 'Carlos Álvarez', data: [4.0, null, 3.6, 4.0, 5.0, 3.5, 7.0, 6.9] },
  { name: 'López Chau', data: [1.8, 3.1, 3.7, 5.1, 5.6, 6.6, 4.0, 6.3] },
  { name: 'Roberto Sánchez Palomino', data: [null, null, 1.8, 1.8, null, 3.1, 6.7, 6.7] },
];

const chartData = {
  labels,
  datasets: TREND_DATA.map(candidate => {
    const color = getPartyColor(candidate.name);
    return {
      label: candidate.name,
      data: candidate.data,
      borderColor: color.primary,
      backgroundColor: color.primary + '33',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: color.primary,
      tension: 0.3,
      spanGaps: true,
    };
  }),
};

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
        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#E5E0D8' },
      ticks: { color: '#A8A29E', font: { size: 11 } }
    },
    y: {
      min: 0,
      max: 20,
      grid: { color: '#E5E0D8' },
      ticks: { color: '#A8A29E', callback: v => v + '%', font: { size: 11 } }
    }
  }
};

export default function TrendChart() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      padding: 16
    }}>
      <h3 style={{ color: '#1C1917', fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>
        Tendencia de encuestas
      </h3>
      <div style={{ height: 350 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
