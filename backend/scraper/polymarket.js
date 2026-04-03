const cron = require('node-cron');
const { nowPeru, electoralPhase } = require('../model/clock');
const { handleError } = require('../errors/errorHandler');
const db = require('../db');

const EVENT_SLUG = 'peru-presidential-election-winner';
const GAMMA_BASE_URL = 'https://gamma-api.polymarket.com';
const FETCH_TIMEOUT_MS = 15_000;

// Regex para filtrar placeholders genéricos (candidate A, candidate B, another candidate, etc.)
const PLACEHOLDER_RE = /^candidate\s+[a-z]$/i;
const GENERIC_NAMES = new Set(['another candidate', 'other', '']);

// Mapeo de nombres de la API a nombres canónicos del seed.
// La key es el nombre tal cual viene de la API (extraído del question).
const CANDIDATE_MAP = {
  'Alfonso López Chau':       'López Chau',
  'Rafael López Aliaga':      'Rafael López Aliaga',
  'Roberto Sánchez Palomino': 'Roberto Sánchez Palomino',
  'Jorge Nieto':              'Jorge Nieto',
  'Carlos Álvarez':           'Carlos Álvarez',
  'Keiko Fujimori':           'Keiko Fujimori',
  'Ricardo Belmont':          'Ricardo Belmont',
  'Marisol Pérez Tello':      'Marisol Pérez Tello',
  'Wolfgang Grozo':           'Wolfgang Grozo',
  'Carlos Espá':              'Carlos Espá',
  'César Acuña':              'César Acuña',
  'Yonhy Lescano':            'Yonhy Lescano',
  'Martín Vizcarra':          'Martín Vizcarra',
  'Mesías Guevara':           'Mesías Guevara',
  'George Forsyth':           'George Forsyth',
  'Mario Vizcarra':           'Mario Vizcarra',
  'Vladimir Cerrón':          'Vladimir Cerrón',
  'Roberto Chiabra':          'Roberto Chiabra',
  'Fiorella Molinelli':       'Fiorella Molinelli',
  'José Williams':            'José Williams',
  'Fernando Olivera':         'Fernando Olivera',
  'Rafael Belaúnde Llosa':    'Rafael Belaúnde Llosa',
  'José Luna':                'José Luna',
  'Enrique Valderrama':       'Enrique Valderrama'
};

// Candidatos que esperamos encontrar en la API (los del seed con encuestas)
const EXPECTED_CANDIDATES = [
  'Rafael López Aliaga', 'Keiko Fujimori', 'Carlos Álvarez',
  'Roberto Sánchez Palomino', 'López Chau', 'Jorge Nieto',
  'Wolfgang Grozo', 'César Acuña', 'Ricardo Belmont', 'Yonhy Lescano'
];

/**
 * Extrae el nombre del candidato del question de cada mercado binario.
 * "Will Rafael López Aliaga win the 2026 Peruvian presidential election?" → "Rafael López Aliaga"
 */
function extractCandidateName(question) {
  return question
    .replace(/^Will\s+/i, '')
    .replace(/\s+win the 2026 Peruvian presidential election\?$/i, '')
    .trim();
}

/**
 * Normaliza un nombre de la API al nombre canónico del seed.
 */
function normalizeCandidateName(apiName) {
  return CANDIDATE_MAP[apiName] || apiName;
}

/**
 * Determina si un nombre es un placeholder genérico que debe filtrarse.
 */
function isPlaceholder(name) {
  if (GENERIC_NAMES.has(name.toLowerCase())) return true;
  if (PLACEHOLDER_RE.test(name)) return true;
  return false;
}

/**
 * Obtiene datos del evento de elecciones de Perú desde Polymarket Gamma API.
 * Estructura: 1 evento → N mercados binarios (uno por candidato).
 */
async function fetchPolymarketData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${GAMMA_BASE_URL}/events?slug=${EVENT_SLUG}`,
      { signal: controller.signal }
    );

    if (!res.ok) {
      throw new Error(`Gamma API responded ${res.status}: ${res.statusText}`);
    }

    const events = await res.json();
    if (!events || events.length === 0) {
      throw new Error(`Event '${EVENT_SLUG}' not found in Gamma API`);
    }

    const event = events[0];
    const eventVolume = parseFloat(event.volume || event.volumeNum || 0);
    const markets = event.markets || [];

    const candidates = [];

    for (const market of markets) {
      // Extraer nombre del candidato del question
      const rawName = extractCandidateName(market.question || '');

      // Filtrar placeholders
      if (isPlaceholder(rawName)) continue;

      // Obtener precio Yes
      let priceYes = 0;
      try {
        const rawPrices = market.outcomePrices;
        const prices = typeof rawPrices === 'string' ? JSON.parse(rawPrices) : rawPrices;
        if (prices && prices.length > 0) {
          priceYes = parseFloat(prices[0]);
        }
      } catch {
        // Si no hay precios, saltar este mercado
        continue;
      }

      // Solo incluir candidatos con probabilidad > 0
      if (priceYes <= 0) continue;

      const canonicalName = normalizeCandidateName(rawName);

      candidates.push({
        candidate: canonicalName,
        probability: priceYes * 100,
        price_yes: priceYes,
        price_no: 1 - priceYes,
        volume_usd: eventVolume  // Volumen total del evento
      });
    }

    return { candidates, volume: eventVolume };

  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Valida que las probabilidades sumen ~100% (rango 95–105%).
 * Si no, renormaliza y loguea ERR_PM_003.
 */
function validateAndNormalize(candidates) {
  const totalProb = candidates.reduce((sum, c) => sum + c.probability, 0);

  if (totalProb < 95 || totalProb > 105) {
    handleError('POLYMARKET_PRICE_ANOMALY', {
      module: 'scraper/polymarket',
      totalProbability: totalProb.toFixed(2),
      candidateCount: candidates.length
    });

    // Renormalizar
    for (const c of candidates) {
      c.probability = (c.probability / totalProb) * 100;
      c.price_yes = c.probability / 100;
      c.price_no = 1 - c.price_yes;
    }
  }

  return candidates;
}

/**
 * Verifica que todos los candidatos esperados del seed aparezcan en la API.
 * Si falta alguno, loguea ERR_PM_004 por cada uno.
 */
function checkExpectedCandidates(candidates) {
  const found = new Set(candidates.map(c => c.candidate));

  for (const expected of EXPECTED_CANDIDATES) {
    if (!found.has(expected)) {
      handleError('POLYMARKET_CANDIDATE_MISSING', {
        module: 'scraper/polymarket',
        candidate: expected,
        message: `Candidato '${expected}' no encontrado en Polymarket`
      });
    }
  }
}

/**
 * Guarda snapshot en polymarket_snapshots.
 */
async function saveSnapshot(candidates) {
  const now = nowPeru();
  const phase = electoralPhase();

  for (const c of candidates) {
    await db.query(
      `INSERT INTO polymarket_snapshots
       (captured_at_lima, candidate, probability, price_yes, price_no, volume_usd, market_slug, phase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [now.toISO(), c.candidate, c.probability, c.price_yes, c.price_no,
       c.volume_usd, EVENT_SLUG, phase]
    );
  }

  console.log(`✅ Polymarket snapshot guardado: ${candidates.length} candidatos @ ${now.toFormat('dd/MM HH:mm')} Lima (fase: ${phase})`);
  return candidates.length;
}

/**
 * Función principal del scraper — se ejecuta cada hora.
 */
async function scrapePolymarket() {
  const now = nowPeru();
  console.log(`\n🔄 Scraping Polymarket @ ${now.toFormat('dd/MM/yyyy HH:mm:ss')} Lima...`);

  try {
    const data = await fetchPolymarketData();

    if (!data.candidates || data.candidates.length === 0) {
      await handleError('POLYMARKET_CANDIDATE_MISSING', {
        module: 'scraper/polymarket',
        message: 'No candidates returned from API'
      });
      return;
    }

    checkExpectedCandidates(data.candidates);

    const validated = validateAndNormalize(data.candidates);
    await saveSnapshot(validated);

    // Log resumen
    const top = validated.sort((a, b) => b.probability - a.probability).slice(0, 6);
    console.log(`   Volume total: $${(data.volume / 1_000_000).toFixed(2)}M`);
    for (const c of top) {
      console.log(`   ${c.candidate}: ${c.probability.toFixed(1)}%`);
    }

    // Auto-run pipeline después de scrape exitoso
    try {
      const { runFullPipeline } = require('../model/pipeline');
      console.log('\n🧮 Auto-run modelo post-scrape...');
      await runFullPipeline({ saveToDB: true, trigger: 'auto_polymarket_update' });
      console.log('✅ Modelo actualizado automáticamente');
    } catch (pipelineErr) {
      console.error('⚠️  Auto-run pipeline falló:', pipelineErr.message);
    }

  } catch (err) {
    await handleError('POLYMARKET_API_TIMEOUT', {
      module: 'scraper/polymarket',
      timeout_ms: FETCH_TIMEOUT_MS
    }, err);
  }
}

/**
 * Inicia el cron job — cada 30 minutos.
 * También ejecuta inmediatamente al arrancar.
 */
function startPolymarketCron() {
  console.log('⏰ Polymarket cron job programado: cada 30 minutos');

  // Ejecutar inmediatamente al arrancar
  scrapePolymarket();

  // Programar cada hora
  cron.schedule('*/30 * * * *', () => {
    scrapePolymarket();
  });
}

module.exports = { scrapePolymarket, startPolymarketCron, fetchPolymarketData };
