const express = require('express');
const router = express.Router();

const { nowPeru, electoralPhase, timeToElection } = require('../model/clock');
const { getPolymarketWeight, getPollWeight } = require('../model/weights');
const { aggregatePolls, HOUSE_EFFECTS } = require('../model/aggregator');
const { redistributeUndecided } = require('../model/undecided');
const { bayesianIntegration } = require('../model/bayesian');
const { runMonteCarlo } = require('../model/montecarlo');
const { handleError } = require('../errors/errorHandler');
const db = require('../db');

// ─── GET /api/status ────────────────────────────────────────
// Hora Lima, fase electoral, α actual, countdown

router.get('/status', (req, res) => {
  const now = nowPeru();
  const phase = electoralPhase();
  const countdown = timeToElection();
  const α = getPolymarketWeight();

  res.json({
    time_lima: now.toFormat('dd/MM/yyyy HH:mm:ss'),
    timezone: now.zoneName,
    electoral_phase: phase,
    polymarket_weight: α,
    polls_weight: α !== null ? 1 - α : null,
    days_to_election: countdown.days,
    hours_to_election: countdown.hours,
    total_hours: parseFloat(countdown.totalHours.toFixed(1)),
    is_election_day: countdown.isElectionDay,
    is_past_election: countdown.isPastElection
  });
});

// ─── GET /api/predictions ───────────────────────────────────
// Última predicción guardada en DB

router.get('/predictions', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT candidate, predicted_pct_mean, predicted_pct_p10, predicted_pct_p90,
             prob_first_round, prob_win_overall, electoral_phase,
             polymarket_weight, polls_weight, generated_at_lima, model_version
      FROM model_predictions
      WHERE generated_at = (SELECT MAX(generated_at) FROM model_predictions)
      ORDER BY predicted_pct_mean DESC
    `);

    if (rows.length === 0) {
      return res.json({ message: 'No predictions yet. Run /api/run-model first.', candidates: [] });
    }

    res.json({
      generated_at_lima: rows[0].generated_at_lima,
      electoral_phase: rows[0].electoral_phase,
      polymarket_weight: parseFloat(rows[0].polymarket_weight),
      polls_weight: parseFloat(rows[0].polls_weight),
      model_version: rows[0].model_version,
      candidates: rows.map(r => ({
        candidate: r.candidate,
        predicted_pct_mean: parseFloat(r.predicted_pct_mean),
        predicted_pct_p10: parseFloat(r.predicted_pct_p10),
        predicted_pct_p90: parseFloat(r.predicted_pct_p90),
        prob_first_round: parseFloat(r.prob_first_round),
        prob_win_overall: parseFloat(r.prob_win_overall)
      }))
    });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/predictions' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/polymarket ────────────────────────────────────
// Último snapshot de Polymarket

router.get('/polymarket', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT candidate, probability, price_yes, price_no,
             volume_usd, phase, captured_at_lima
      FROM polymarket_snapshots
      WHERE captured_at = (SELECT MAX(captured_at) FROM polymarket_snapshots)
      ORDER BY probability DESC
    `);

    if (rows.length === 0) {
      return res.json({ message: 'No Polymarket snapshots yet.', candidates: [] });
    }

    res.json({
      captured_at_lima: rows[0].captured_at_lima,
      phase: rows[0].phase,
      volume_usd: parseFloat(rows[0].volume_usd),
      candidates: rows.map(r => ({
        candidate: r.candidate,
        probability: parseFloat(r.probability),
        price_yes: parseFloat(r.price_yes),
        price_no: parseFloat(r.price_no)
      }))
    });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/polymarket' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/polls ─────────────────────────────────────────
// Encuestas con sus pesos efectivos actuales

router.get('/polls', async (req, res) => {
  try {
    const { rows: pollsters } = await db.query('SELECT * FROM pollsters');
    const pollsterMap = {};
    for (const p of pollsters) {
      pollsterMap[p.id] = p;
    }

    const { rows: polls } = await db.query(`
      SELECT p.*, ps.name as pollster_name, ps.weight_multiplier
      FROM polls p
      JOIN pollsters ps ON p.pollster_id = ps.id
      ORDER BY p.field_end DESC
    `);

    const { rows: results } = await db.query(`
      SELECT * FROM poll_results ORDER BY poll_id, pct_raw DESC
    `);

    // Agrupar resultados por poll_id
    const resultsByPoll = {};
    for (const r of results) {
      if (!resultsByPoll[r.poll_id]) resultsByPoll[r.poll_id] = [];
      resultsByPoll[r.poll_id].push(r);
    }

    const pollsWithWeights = polls.map(p => {
      const weight = getPollWeight(p, parseFloat(p.weight_multiplier));
      return {
        id: p.id,
        pollster: p.pollster_name,
        field_start: p.field_start,
        field_end: p.field_end,
        sample_n: p.sample_n,
        margin_error: parseFloat(p.margin_error),
        poll_type: p.poll_type,
        pct_undecided: p.pct_undecided ? parseFloat(p.pct_undecided) : null,
        pct_blank_null: p.pct_blank_null ? parseFloat(p.pct_blank_null) : null,
        effective_weight: parseFloat(weight.toFixed(4)),
        house_effects: HOUSE_EFFECTS[p.pollster_name] || {},
        results: (resultsByPoll[p.id] || []).map(r => ({
          candidate: r.candidate,
          party: r.party,
          pct_raw: parseFloat(r.pct_raw)
        }))
      };
    });

    res.json({
      total_polls: pollsWithWeights.length,
      polls: pollsWithWeights
    });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/polls' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/run-model ─────────────────────────────────────
// Ejecuta el pipeline completo y guarda predicción en DB

router.get('/run-model', async (req, res) => {
  try {
    const now = nowPeru();
    const phase = electoralPhase();
    console.log(`\n🧮 Ejecutando modelo @ ${now.toFormat('dd/MM HH:mm')} Lima (fase: ${phase})...`);

    // 1. Cargar datos de DB
    const { rows: pollsters } = await db.query('SELECT * FROM pollsters');
    const pollsterWeights = {};
    const pollsterNames = {};
    for (const p of pollsters) {
      pollsterWeights[p.name] = parseFloat(p.weight_multiplier);
      pollsterNames[p.id] = p.name;
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
    // Promedio ponderado de indecisos de las encuestas recientes
    const recentPolls = polls
      .filter(p => p.pct_undecided !== null)
      .sort((a, b) => b.field_end.localeCompare(a.field_end))
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

    // 6. Guardar en DB
    const α = bayesian.polymarket_weight;
    for (const [candidate, data] of Object.entries(mcResults)) {
      await db.query(`
        INSERT INTO model_predictions
          (generated_at_lima, electoral_phase, polymarket_weight, polls_weight,
           candidate, predicted_pct_mean, predicted_pct_p10, predicted_pct_p90,
           prob_first_round, prob_win_overall, model_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [now.toISO(), phase, α, 1 - α,
          candidate, data.mean, data.p10, data.p90,
          data.prob_runoff, data.prob_win, '2.0']);
    }
    console.log('   ✅ Predicción guardada en DB');

    // 7. Responder
    const sorted = Object.entries(mcResults)
      .sort((a, b) => b[1].mean - a[1].mean);

    res.json({
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
    });

  } catch (err) {
    console.error('Error ejecutando modelo:', err);
    await handleError('MONTE_CARLO_NO_CONVERGENCE', { module: 'api/run-model' }, err);
    res.status(500).json({ error: 'Model execution failed', message: err.message });
  }
});

module.exports = router;
