const { nowPeru, electoralPhase } = require('./clock');
const { aggregatePolls } = require('./aggregator');
const { redistributeUndecided } = require('./undecided');
const { bayesianIntegration } = require('./bayesian');
const { runMonteCarlo } = require('./montecarlo');
const db = require('../db');

/**
 * Ejecuta el pipeline estadístico completo:
 * 1. Cargar encuestas de DB
 * 2. Agregar con house effects
 * 3. Redistribuir indecisos
 * 4. Integración bayesiana con Polymarket
 * 5. Monte Carlo 10,000 simulaciones
 *
 * @param {Object} options
 * @param {boolean} options.saveToDB - Guardar resultado en model_predictions
 * @param {string} options.trigger - 'auto_polymarket_update' | 'user_simulation'
 * @returns {Object} { candidates, runoffSummary, meta }
 */
async function runFullPipeline({ saveToDB = false, trigger = 'auto_polymarket_update' } = {}) {
  const now = nowPeru();
  const phase = electoralPhase();
  console.log(`\n🧮 Pipeline @ ${now.toFormat('dd/MM HH:mm')} Lima (fase: ${phase}, trigger: ${trigger})...`);

  // 1. Cargar encuestas
  const { rows: pollsters } = await db.query('SELECT * FROM pollsters');
  const pollsterWeights = {};
  for (const p of pollsters) {
    pollsterWeights[p.name] = parseFloat(p.weight_multiplier);
  }

  const { rows: dbPolls } = await db.query(`
    SELECT p.*, ps.name as pollster_name
    FROM polls p JOIN pollsters ps ON p.pollster_id = ps.id
  `);

  const { rows: dbResults } = await db.query('SELECT * FROM poll_results');
  const resultsByPoll = {};
  for (const r of dbResults) {
    if (!resultsByPoll[r.poll_id]) resultsByPoll[r.poll_id] = [];
    resultsByPoll[r.poll_id].push({ candidate: r.candidate, pct_raw: parseFloat(r.pct_raw) });
  }

  const polls = dbPolls.map(p => ({
    pollster_name: p.pollster_name,
    field_end: p.field_end,
    sample_n: p.sample_n,
    poll_type: p.poll_type,
    margin_error: parseFloat(p.margin_error),
    pct_undecided: p.pct_undecided ? parseFloat(p.pct_undecided) : null,
    results: resultsByPoll[p.id] || []
  }));

  // 2. Agregar encuestas
  const aggregated = aggregatePolls(polls, pollsterWeights);
  console.log('   ✅ Agregación:', Object.keys(aggregated).length, 'candidatos');

  // 3. Redistribuir indecisos
  const recentPolls = polls
    .filter(p => p.pct_undecided !== null)
    .sort((a, b) => new Date(b.field_end) - new Date(a.field_end))
    .slice(0, 5);
  const avgUndecided = recentPolls.length > 0
    ? recentPolls.reduce((s, p) => s + p.pct_undecided, 0) / recentPolls.length
    : 25;

  const withUndecided = redistributeUndecided(aggregated, avgUndecided);
  console.log('   ✅ Indecisos redistribuidos:', avgUndecided.toFixed(1) + '%');

  // 4. Integración Bayesiana con Polymarket
  const { rows: pmSnapshots } = await db.query(`
    SELECT candidate, probability, volume_usd
    FROM polymarket_snapshots
    WHERE captured_at = (SELECT MAX(captured_at) FROM polymarket_snapshots)
  `);

  const polymarketData = {};
  let pmVolume = 0;
  for (const s of pmSnapshots) {
    polymarketData[s.candidate] = parseFloat(s.probability);
    pmVolume = parseFloat(s.volume_usd);
  }

  const bayesian = bayesianIntegration(withUndecided, polymarketData, pmVolume);
  console.log('   ✅ Bayesian: α=' + bayesian.polymarket_weight.toFixed(3));

  // 5. Monte Carlo
  const { results: mcResults, runoffSummary } = runMonteCarlo(bayesian.candidates, 10_000);
  console.log('   ✅ Monte Carlo: 10,000 simulaciones');

  const α = bayesian.polymarket_weight;

  // 6. Guardar en DB si se solicita
  if (saveToDB) {
    const runoffJson = JSON.stringify(runoffSummary);
    for (const [candidate, data] of Object.entries(mcResults)) {
      await db.query(`
        INSERT INTO model_predictions
          (generated_at_lima, electoral_phase, polymarket_weight, polls_weight,
           candidate, predicted_pct_mean, predicted_pct_p10, predicted_pct_p90,
           prob_first_round, prob_win_overall, model_version, trigger, runoff_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [now.toISO(), phase, α, 1 - α,
          candidate, data.mean, data.p10, data.p90,
          data.prob_runoff, data.prob_win, '2.0', trigger, runoffJson]);
    }
    console.log('   ✅ Guardado en DB (trigger: ' + trigger + ')');
  }

  // Construir respuesta
  const sorted = Object.entries(mcResults).sort((a, b) => b[1].mean - a[1].mean);

  // Log top 3
  const top3 = sorted.slice(0, 3);
  for (let i = 0; i < top3.length; i++) {
    const [name, d] = top3[i];
    console.log(`   ${i + 1}. ${name} ${d.mean.toFixed(1)}% | P(ganar) ${d.prob_win.toFixed(1)}%`);
  }

  return {
    generated_at_lima: now.toISO(),
    electoral_phase: phase,
    polymarket_weight: α,
    polls_weight: 1 - α,
    avg_undecided: avgUndecided,
    polymarket_candidates: Object.keys(polymarketData).length,
    candidates: sorted.map(([candidate, data]) => ({
      candidate,
      ...data,
      polls_pct: bayesian.candidates[candidate]?.polls_pct ?? null,
      polymarket_pct: bayesian.candidates[candidate]?.polymarket_pct ?? null,
      posterior_pct: bayesian.candidates[candidate]?.posterior_pct ?? null
    })),
    runoff_scenarios: runoffSummary
  };
}

module.exports = { runFullPipeline };
