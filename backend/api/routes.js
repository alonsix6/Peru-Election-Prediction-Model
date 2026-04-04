const express = require('express');
const router = express.Router();

const { nowPeru, electoralPhase, timeToElection } = require('../model/clock');
const { getPolymarketWeight, getPollWeight } = require('../model/weights');
const { HOUSE_EFFECTS } = require('../model/aggregator');
const { runFullPipeline } = require('../model/pipeline');
const { handleError } = require('../errors/errorHandler');
const { scrapePolymarket } = require('../scraper/polymarket');
const db = require('../db');

// ─── GET /api/status ────────────────────────────────────────
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
// Sirve SIEMPRE la última predicción automática guardada en DB.
// No corre ningún cálculo — solo lee y sirve.
router.get('/predictions', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT candidate, predicted_pct_mean, predicted_pct_p10, predicted_pct_p90,
             prob_first_round, prob_win_overall, electoral_phase,
             polymarket_weight, polls_weight, generated_at_lima, model_version,
             runoff_json, polls_pct, polymarket_pct, posterior_pct, risk_json
      FROM model_predictions
      WHERE trigger = 'auto_polymarket_update'
        AND generated_at_lima = (
          SELECT MAX(generated_at_lima) FROM model_predictions
          WHERE trigger = 'auto_polymarket_update'
        )
      ORDER BY predicted_pct_mean DESC
    `);

    if (rows.length === 0) {
      return res.json({ message: 'No predictions yet.', candidates: [], runoff_scenarios: [] });
    }

    // runoff_json es el mismo para todos los rows de la misma corrida
    let runoff_scenarios = [];
    let risk_scenarios = null;
    try {
      if (rows[0].runoff_json) runoff_scenarios = JSON.parse(rows[0].runoff_json);
      if (rows[0].risk_json) risk_scenarios = JSON.parse(rows[0].risk_json);
    } catch { /* ignore parse error */ }

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
        prob_win_overall: parseFloat(r.prob_win_overall),
        polls_pct: r.polls_pct ? parseFloat(r.polls_pct) : null,
        polymarket_pct: r.polymarket_pct ? parseFloat(r.polymarket_pct) : null,
        posterior_pct: r.posterior_pct ? parseFloat(r.posterior_pct) : null,
      })),
      runoff_scenarios,
      risk_scenarios
    });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/predictions' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/polymarket ────────────────────────────────────
router.get('/polymarket', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT candidate, probability, price_yes, price_no,
             volume_usd, phase, captured_at_lima
      FROM polymarket_snapshots
      WHERE captured_at_lima = (SELECT MAX(captured_at_lima) FROM polymarket_snapshots)
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

// ─── GET /api/polymarket/history ─────────────────────────────
// Todos los snapshots agrupados por timestamp para gráfico de tendencia
router.get('/polymarket/history', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT captured_at_lima, candidate, probability
      FROM polymarket_snapshots
      ORDER BY captured_at_lima ASC
    `);

    // Agrupar por timestamp
    const byTime = {};
    for (const r of rows) {
      const key = r.captured_at_lima;
      if (!byTime[key]) byTime[key] = { time: key, candidates: {} };
      byTime[key].candidates[r.candidate] = parseFloat(r.probability);
    }

    res.json({ snapshots: Object.values(byTime) });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/polymarket/history' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/polls ─────────────────────────────────────────
router.get('/polls', async (req, res) => {
  try {
    const { rows: polls } = await db.query(`
      SELECT p.*, ps.name as pollster_name, ps.weight_multiplier
      FROM polls p JOIN pollsters ps ON p.pollster_id = ps.id
      ORDER BY p.field_end DESC
    `);

    const { rows: results } = await db.query(
      'SELECT * FROM poll_results ORDER BY poll_id, pct_raw DESC'
    );

    const resultsByPoll = {};
    for (const r of results) {
      if (!resultsByPoll[r.poll_id]) resultsByPoll[r.poll_id] = [];
      resultsByPoll[r.poll_id].push(r);
    }

    const pollsWithWeights = polls.map(p => {
      const weight = getPollWeight(p, parseFloat(p.weight_multiplier));
      return {
        id: p.id, pollster: p.pollster_name,
        field_start: p.field_start, field_end: p.field_end,
        sample_n: p.sample_n, margin_error: parseFloat(p.margin_error),
        poll_type: p.poll_type,
        pct_undecided: p.pct_undecided ? parseFloat(p.pct_undecided) : null,
        pct_blank_null: p.pct_blank_null ? parseFloat(p.pct_blank_null) : null,
        effective_weight: parseFloat(weight.toFixed(4)),
        house_effects: HOUSE_EFFECTS[p.pollster_name] || {},
        results: (resultsByPoll[p.id] || []).map(r => ({
          candidate: r.candidate, party: r.party, pct_raw: parseFloat(r.pct_raw)
        }))
      };
    });

    res.json({ total_polls: pollsWithWeights.length, polls: pollsWithWeights });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/polls' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/run-model ─────────────────────────────────────
// Simulación personal del usuario. NO guarda en DB.
router.get('/run-model', async (req, res) => {
  try {
    const result = await runFullPipeline({ saveToDB: false, trigger: 'user_simulation' });
    res.json({
      source: 'user_simulation',
      note: 'Simulación personal. El dashboard oficial se actualiza automáticamente cada 30 minutos.',
      ...result
    });
  } catch (err) {
    console.error('Error en simulación:', err);
    await handleError('MONTE_CARLO_NO_CONVERGENCE', { module: 'api/run-model' }, err);
    res.status(500).json({ error: 'Simulation failed', message: err.message });
  }
});

// ─── GET /api/force-run ──────────────────────────────────────
// Inserta encuestas pendientes y fuerza corrida del pipeline
router.get('/force-run', async (req, res) => {
  try {
    const inserted = [];

    // Forzar scrape fresco de Polymarket antes del pipeline
    try {
      await scrapePolymarket();
    } catch (err) {
      console.warn('Scrape de Polymarket falló en force-run:', err.message);
    }

    // Fix sequences (seed used explicit IDs)
    await db.query(`SELECT setval('pollsters_id_seq', (SELECT COALESCE(MAX(id),0) FROM pollsters))`);
    await db.query(`SELECT setval('polls_id_seq', (SELECT COALESCE(MAX(id),0) FROM polls))`);
    await db.query(`SELECT setval('poll_results_id_seq', (SELECT COALESCE(MAX(id),0) FROM poll_results))`);

    // --- Ipsos tracking 29 mar - 1 abr ---
    const { rows: ex1 } = await db.query(
      `SELECT id FROM polls WHERE pollster_id = 3 AND field_end = '2026-04-01' AND published_date = '2026-04-03'`
    );
    if (ex1.length === 0) {
      const { rows: [p] } = await db.query(`
        INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_undecided, pct_blank_null, notes)
        VALUES (3, '2026-03-29', '2026-04-01', '2026-04-03', 1203, 2.80, 95.0, 'nacional', 'presencial', 'intencion_voto', 14.00, 16.00,
          'Tracking diario Ipsos para Perú21. Campo 29 mar - 1 abr 2026. Post-debates ronda 1 y 2 JNE.')
        RETURNING id`);
      await db.query(`INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
        ($1,'Keiko Fujimori','Fuerza Popular',12),($1,'Rafael López Aliaga','Renovación Popular',8),
        ($1,'Carlos Álvarez','País para Todos',8),($1,'Roberto Sánchez Palomino','Juntos por el Perú',6),
        ($1,'Jorge Nieto','Partido del Buen Gobierno',5),($1,'López Chau','Ahora Nación',4),
        ($1,'César Acuña','APP',4),($1,'Ricardo Belmont','Partido Cívico Obras',3),
        ($1,'Marisol Pérez Tello','Primero la Gente',2),($1,'George Forsyth','Somos Perú',2),
        ($1,'Yonhy Lescano','Cooperación Popular',2),($1,'Carlos Espá','SíCreo',2)`, [p.id]);
      inserted.push('Ipsos tracking 29mar-1abr');
    }

    // --- CID Latinoamérica (nueva encuestadora + encuesta) ---
    let cidId;
    const { rows: exCid } = await db.query(`SELECT id FROM pollsters WHERE name = 'CID'`);
    if (exCid.length === 0) {
      const { rows: [ps] } = await db.query(`
        INSERT INTO pollsters (name, historical_mae, weight_multiplier, notes)
        VALUES ('CID', NULL, 0.80, 'CID Latinoamérica. Sin data comparable 2021 en Perú. Penalización por incertidumbre histórica.')
        RETURNING id`);
      cidId = ps.id;
      inserted.push('Encuestadora CID creada');
    } else {
      cidId = exCid[0].id;
    }

    const { rows: ex2 } = await db.query(
      `SELECT id FROM polls WHERE pollster_id = $1 AND field_end = '2026-04-03' AND published_date = '2026-04-04'`, [cidId]
    );
    if (ex2.length === 0) {
      const { rows: [p] } = await db.query(`
        INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, pct_no_answer, notes)
        VALUES ($1, '2026-04-01', '2026-04-03', '2026-04-04', 2120, 2.80, 95.0, 'nacional', 'presencial', 'intencion_voto', 11.2, 13.8,
          'CID Latinoamérica Abril I 2026. Primera encuesta de esta casa en el modelo.')
        RETURNING id`, [cidId]);
      await db.query(`INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
        ($1,'Keiko Fujimori','Fuerza Popular',9.7),($1,'Rafael López Aliaga','Renovación Popular',9.1),
        ($1,'Carlos Álvarez','País para Todos',6.8),($1,'Fernando Olivera','Frente Esperanza',5.6),
        ($1,'López Chau','Ahora Nación',5.3),($1,'Ricardo Belmont','Partido Cívico Obras',4.9),
        ($1,'Carlos Espá','SíCreo',4.4),($1,'Roberto Sánchez Palomino','Juntos por el Perú',4.3),
        ($1,'Charlie Carrasco','Demócrata Unido',3.6),($1,'José Luna','Podemos Perú',3.6),
        ($1,'Herbert Caller','PPP',3.5),($1,'Marisol Pérez Tello','Primero la Gente',2.9),
        ($1,'Jorge Nieto','Partido del Buen Gobierno',2.6),($1,'César Acuña','APP',2.2)`, [p.id]);
      inserted.push('CID Abril I 2026');
    }

    // --- CIT Abril 2026 ---
    const { rows: ex3 } = await db.query(
      `SELECT id FROM polls WHERE pollster_id = 5 AND field_end = '2026-04-03' AND published_date = '2026-04-04'`
    );
    if (ex3.length === 0) {
      const { rows: [p] } = await db.query(`
        INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, pct_no_answer, notes)
        VALUES (5, '2026-04-01', '2026-04-03', '2026-04-04', 1500, 2.80, 95.0, 'nacional', 'presencial', 'intencion_voto', 7.8, 8.5,
          'CIT Abril 2026. Más reciente que la CIT de marzo 20-23.')
        RETURNING id`);
      await db.query(`INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
        ($1,'Rafael López Aliaga','Renovación Popular',13),($1,'Keiko Fujimori','Fuerza Popular',11),
        ($1,'López Chau','Ahora Nación',8),($1,'César Acuña','APP',6.5),
        ($1,'Carlos Álvarez','País para Todos',6.1),($1,'Jorge Nieto','Partido del Buen Gobierno',5.1),
        ($1,'Marisol Pérez Tello','Primero la Gente',4.5),($1,'Yonhy Lescano','Cooperación Popular',4),
        ($1,'Ricardo Belmont','Partido Cívico Obras',3.5),($1,'Roberto Sánchez Palomino','Juntos por el Perú',3.3),
        ($1,'Wolfgang Grozo','Integridad Democrática',3.1),($1,'Fernando Olivera','Frente Esperanza',2.2)`, [p.id]);
      inserted.push('CIT Abril 2026');
    }

    // --- Ipsos última antes de veda (intención, campo 1-2 abr) ---
    const { rows: ex4 } = await db.query(
      `SELECT id FROM polls WHERE pollster_id = 3 AND field_start = '2026-04-01' AND field_end = '2026-04-02' AND poll_type = 'intencion_voto'`
    );
    if (ex4.length === 0) {
      const { rows: [p] } = await db.query(`
        INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, pct_no_answer, notes)
        VALUES (3, '2026-04-01', '2026-04-02', '2026-04-04', 1217, 2.80, 95.0, 'nacional', 'presencial', 'intencion_voto', 16.0, 13.0,
          'Ipsos para Perú21. Último estudio antes de veda electoral. Campo 1-2 abril 2026. Álvarez supera a Aliaga por primera vez.')
        RETURNING id`, []);
      await db.query(`INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
        ($1,'Keiko Fujimori','Fuerza Popular',13),($1,'Carlos Álvarez','País para Todos',9),
        ($1,'Rafael López Aliaga','Renovación Popular',8),($1,'Roberto Sánchez Palomino','Juntos por el Perú',6),
        ($1,'Jorge Nieto','Partido del Buen Gobierno',5),($1,'López Chau','Ahora Nación',4),
        ($1,'Ricardo Belmont','Partido Cívico Obras',3),($1,'César Acuña','APP',3),
        ($1,'Marisol Pérez Tello','Primero la Gente',2),($1,'Yonhy Lescano','Cooperación Popular',2),
        ($1,'George Forsyth','Somos Perú',2),($1,'José Luna','Podemos Perú',2)`, [p.id]);
      inserted.push('Ipsos última pre-veda intención 1-2 abr');
    }

    // --- Ipsos simulacro (campo 1-2 abr) ---
    const { rows: ex5 } = await db.query(
      `SELECT id FROM polls WHERE pollster_id = 3 AND field_start = '2026-04-01' AND field_end = '2026-04-02' AND poll_type = 'simulacro'`
    );
    if (ex5.length === 0) {
      const { rows: [p] } = await db.query(`
        INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
        VALUES (3, '2026-04-01', '2026-04-02', '2026-04-04', 1192, 2.80, 95.0, 'nacional', 'presencial', 'simulacro', 26.0,
          'Tercer simulacro nacional Ipsos/Perú21. Campo 1-2 abril 2026. Votos emitidos.')
        RETURNING id`, []);
      await db.query(`INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
        ($1,'Keiko Fujimori','Fuerza Popular',13.7),($1,'Carlos Álvarez','País para Todos',9),
        ($1,'Rafael López Aliaga','Renovación Popular',8.1),($1,'Roberto Sánchez Palomino','Juntos por el Perú',6.7),
        ($1,'Jorge Nieto','Partido del Buen Gobierno',4.1),($1,'César Acuña','APP',3.8),
        ($1,'López Chau','Ahora Nación',3.3),($1,'Ricardo Belmont','Partido Cívico Obras',3.2),
        ($1,'Marisol Pérez Tello','Primero la Gente',2.8),($1,'Yonhy Lescano','Cooperación Popular',2.4),
        ($1,'Carlos Espá','SíCreo',2.1),($1,'Ronald Atencio','Alianza Venceremos',1.9)`, [p.id]);
      inserted.push('Ipsos simulacro 1-2 abr');
    }

    console.log('Encuestas insertadas:', inserted.length > 0 ? inserted.join(', ') : 'ninguna nueva');

    // Forzar pipeline
    const result = await runFullPipeline({ saveToDB: true, trigger: 'auto_polymarket_update' });

    res.json({ polls_inserted: inserted, ...result });
  } catch (err) {
    console.error('Error en force-run:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/model-history ─────────────────────────────────
// Últimas 20 corridas automáticas
router.get('/model-history', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT generated_at_lima
      FROM model_predictions
      WHERE trigger = 'auto_polymarket_update'
      ORDER BY generated_at_lima DESC
      LIMIT 20
    `);

    const history = [];
    for (const row of rows) {
      const { rows: candidates } = await db.query(`
        SELECT candidate, predicted_pct_mean, prob_first_round, prob_win_overall
        FROM model_predictions
        WHERE generated_at_lima = $1 AND trigger = 'auto_polymarket_update'
        ORDER BY predicted_pct_mean DESC
        LIMIT 3
      `, [row.generated_at_lima]);

      history.push({
        generated_at_lima: row.generated_at_lima,
        top3: candidates.map(c => ({
          candidate: c.candidate,
          pct_mean: parseFloat(c.predicted_pct_mean),
          prob_first_round: parseFloat(c.prob_first_round),
          prob_win: parseFloat(c.prob_win_overall)
        }))
      });
    }

    res.json({ count: history.length, history });
  } catch (err) {
    await handleError('DB_CONNECTION_FAILED', { module: 'api/model-history' }, err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
