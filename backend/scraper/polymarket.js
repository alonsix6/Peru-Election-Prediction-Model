const cron = require('node-cron');
const { nowPeru, electoralPhase } = require('../model/clock');
const { handleError } = require('../errors/errorHandler');
const db = require('../db');

const MARKET_SLUG = 'peru-presidential-election-winner';
const CLOB_BASE_URL = 'https://clob.polymarket.com';
const GAMMA_BASE_URL = 'https://gamma-api.polymarket.com';
const FETCH_TIMEOUT_MS = 15_000;

// Mapeo de tokens/outcomes del mercado a nombres normalizados de candidatos
const CANDIDATE_MAP = {
  'rafael lopez aliaga':      'Rafael López Aliaga',
  'lopez aliaga':             'Rafael López Aliaga',
  'keiko fujimori':           'Keiko Fujimori',
  'keiko':                    'Keiko Fujimori',
  'carlos alvarez':           'Carlos Álvarez',
  'alvarez':                  'Carlos Álvarez',
  'roberto sanchez palomino': 'Roberto Sánchez Palomino',
  'roberto sanchez':          'Roberto Sánchez Palomino',
  'sanchez':                  'Roberto Sánchez Palomino',
  'lopez chau':               'López Chau',
  'chau':                     'López Chau',
  'jorge nieto':              'Jorge Nieto',
  'nieto':                    'Jorge Nieto',
  'wolfgang grozo':           'Wolfgang Grozo',
  'grozo':                    'Wolfgang Grozo',
  'cesar acuna':              'César Acuña',
  'acuna':                    'César Acuña',
  'ricardo belmont':          'Ricardo Belmont',
  'belmont':                  'Ricardo Belmont',
  'martin vizcarra':          'Martín Vizcarra',
  'vizcarra':                 'Martín Vizcarra',
  'yonhy lescano':            'Yonhy Lescano',
  'lescano':                  'Yonhy Lescano'
};

function normalizeCandidateName(rawName) {
  const key = rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return CANDIDATE_MAP[key] || rawName.trim();
}

/**
 * Obtiene datos del mercado de elecciones de Perú desde Polymarket.
 * Usa la Gamma API para obtener mercados por slug, luego CLOB para precios.
 */
async function fetchPolymarketData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // 1. Buscar el mercado por slug en Gamma API
    const marketRes = await fetch(
      `${GAMMA_BASE_URL}/markets?slug=${MARKET_SLUG}`,
      { signal: controller.signal }
    );

    if (!marketRes.ok) {
      throw new Error(`Gamma API responded ${marketRes.status}: ${marketRes.statusText}`);
    }

    const markets = await marketRes.json();
    if (!markets || markets.length === 0) {
      throw new Error(`Market '${MARKET_SLUG}' not found in Gamma API`);
    }

    const market = markets[0];
    const conditionId = market.conditionId || market.condition_id;
    const volume = parseFloat(market.volume || market.volumeNum || 0);

    // 2. Obtener precios actuales de los outcomes
    const candidates = [];

    // Si el mercado tiene outcomes directos (multi-outcome market)
    if (market.outcomes && market.outcomePrices) {
      const outcomes = JSON.parse(typeof market.outcomes === 'string' ? market.outcomes : JSON.stringify(market.outcomes));
      const prices = JSON.parse(typeof market.outcomePrices === 'string' ? market.outcomePrices : JSON.stringify(market.outcomePrices));

      for (let i = 0; i < outcomes.length; i++) {
        const name = normalizeCandidateName(outcomes[i]);
        const priceYes = parseFloat(prices[i] || 0);
        candidates.push({
          candidate: name,
          probability: priceYes * 100,
          price_yes: priceYes,
          price_no: 1 - priceYes,
          volume_usd: volume
        });
      }
    }

    // Si es un grupo de mercados (grouped market con tokens separados)
    if (candidates.length === 0 && market.tokens) {
      for (const token of market.tokens) {
        const name = normalizeCandidateName(token.outcome);
        candidates.push({
          candidate: name,
          probability: parseFloat(token.price || 0) * 100,
          price_yes: parseFloat(token.price || 0),
          price_no: 1 - parseFloat(token.price || 0),
          volume_usd: volume
        });
      }
    }

    return { candidates, volume, conditionId };

  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Valida que las probabilidades sumen ~100% (tolerancia ±5%).
 * Si no, renormaliza y loguea ERR_PM_003.
 */
function validateAndNormalize(candidates) {
  const totalProb = candidates.reduce((sum, c) => sum + c.probability, 0);

  if (Math.abs(totalProb - 100) > 5) {
    handleError('POLYMARKET_PRICE_ANOMALY', {
      module: 'scraper/polymarket',
      totalProbability: totalProb,
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
       c.volume_usd, MARKET_SLUG, phase]
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

    const validated = validateAndNormalize(data.candidates);
    await saveSnapshot(validated);

  } catch (err) {
    if (err.name === 'AbortError') {
      await handleError('POLYMARKET_API_TIMEOUT', {
        module: 'scraper/polymarket',
        timeout_ms: FETCH_TIMEOUT_MS
      }, err);
    } else {
      await handleError('POLYMARKET_API_TIMEOUT', {
        module: 'scraper/polymarket'
      }, err);
    }
  }
}

/**
 * Inicia el cron job — cada hora en punto.
 * También ejecuta inmediatamente al arrancar.
 */
function startPolymarketCron() {
  console.log('⏰ Polymarket cron job programado: cada hora en punto');

  // Ejecutar inmediatamente al arrancar
  scrapePolymarket();

  // Programar cada hora
  cron.schedule('0 * * * *', () => {
    scrapePolymarket();
  });
}

module.exports = { scrapePolymarket, startPolymarketCron, fetchPolymarketData };
