require('dotenv').config();

const express = require('express');
const { validateSystemIntegrity } = require('./startup');
const { startPolymarketCron } = require('./scraper/polymarket');
const routes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para frontend en Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// API routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Peru Election Prediction Model 2026',
    version: '2.0',
    status: 'running',
    docs: [
      'GET /api/status        — hora Lima, fase, α actual',
      'GET /api/predictions   — última predicción del modelo',
      'GET /api/polymarket    — último snapshot de Polymarket',
      'GET /api/polls         — encuestas con pesos efectivos',
      'GET /api/run-model     — ejecuta pipeline completo'
    ]
  });
});

// Startup
async function start() {
  await validateSystemIntegrity();

  // Iniciar cron de Polymarket (cada hora + inmediato al arrancar)
  startPolymarketCron();

  app.listen(PORT, () => {
    console.log(`🗳️  API escuchando en puerto ${PORT}`);
    console.log(`   http://localhost:${PORT}/api/status`);
  });
}

start().catch(err => {
  console.error('❌ Error fatal al arrancar:', err);
  process.exit(1);
});
