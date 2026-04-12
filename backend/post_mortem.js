/**
 * POST-MORTEM: Evaluación del modelo electoral Perú 2026
 * Ejecutar después de insertar resultados ONPE:
 *   node post_mortem.js
 */
require('dotenv').config();
const db = require('./db');

async function run() {
  console.log('\n🗳️  POST-MORTEM — Modelo Electoral Perú 2026\n');

  // 1. Cargar predicción final
  const { rows: predictions } = await db.query(`
    SELECT candidate, predicted_pct_mean, predicted_pct_p10, predicted_pct_p90,
           prob_first_round, prob_win_overall, polls_pct, polymarket_pct,
           generated_at_lima, trigger
    FROM model_predictions
    WHERE trigger IN ('final_election_day', 'auto_polymarket_update')
      AND generated_at_lima = (
        SELECT MAX(generated_at_lima) FROM model_predictions
        WHERE trigger IN ('final_election_day', 'auto_polymarket_update')
      )
    ORDER BY predicted_pct_mean DESC
  `);

  if (predictions.length === 0) {
    console.error('❌ No hay predicciones en DB');
    process.exit(1);
  }

  const trigger = predictions[0].trigger;
  console.log(`Predicción usada: trigger='${trigger}', generada: ${predictions[0].generated_at_lima}`);

  // 2. Cargar resultados ONPE
  const { rows: onpe } = await db.query(`
    SELECT candidate, pct_valid_actual
    FROM historical_results
    WHERE election_year = 2026 AND round = 1
    ORDER BY pct_valid_actual DESC
  `);

  if (onpe.length === 0) {
    console.error('❌ No hay resultados ONPE 2026 en DB');
    console.log('   Insértalos con: POST /api/results/onpe');
    process.exit(1);
  }

  // 3. Calcular MAE
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('COMPARACIÓN MODELO vs ONPE — Primera Vuelta 2026');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Candidato'.padEnd(30) + 'Modelo'.padStart(8) + '  ONPE'.padStart(7) + '  Error'.padStart(8) + '  IC 90%'.padStart(15) + '  ¿En IC?'.padStart(8));
  console.log('─'.repeat(78));

  let totalError = 0;
  let count = 0;
  let inIC = 0;
  const modelRanking = [];
  const onpeRanking = [];

  for (const real of onpe) {
    const pred = predictions.find(p => p.candidate === real.candidate);
    if (!pred) {
      console.log(real.candidate.padEnd(30) + '    --'.padStart(8) + parseFloat(real.pct_valid_actual).toFixed(1).padStart(7) + '%    (sin predicción)');
      onpeRanking.push(real.candidate);
      continue;
    }

    const modelPct = parseFloat(pred.predicted_pct_mean);
    const realPct = parseFloat(real.pct_valid_actual);
    const p10 = parseFloat(pred.predicted_pct_p10);
    const p90 = parseFloat(pred.predicted_pct_p90);
    const error = modelPct - realPct;
    const dentro = realPct >= p10 && realPct <= p90;

    if (dentro) inIC++;
    totalError += Math.abs(error);
    count++;
    modelRanking.push({ name: real.candidate, modelPct });
    onpeRanking.push(real.candidate);

    console.log(
      real.candidate.padEnd(30) +
      (modelPct.toFixed(1) + '%').padStart(8) +
      (realPct.toFixed(1) + '%').padStart(7) +
      ((error >= 0 ? '+' : '') + error.toFixed(1)).padStart(8) +
      ('  [' + p10.toFixed(1) + '-' + p90.toFixed(1) + ']').padStart(15) +
      (dentro ? '  SÍ' : '  NO').padStart(8)
    );
  }

  const mae = count > 0 ? totalError / count : 0;
  console.log('─'.repeat(78));
  console.log('MAE: ' + mae.toFixed(2) + ' pts  |  IC 90%: ' + inIC + '/' + count + ' (' + (count > 0 ? (inIC / count * 100).toFixed(0) : 0) + '%)');

  // 4. Ranking accuracy
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('RANKING ACCURACY');
  console.log('═══════════════════════════════════════════════════════\n');

  modelRanking.sort((a, b) => b.modelPct - a.modelPct);
  const modelTop3 = modelRanking.slice(0, 3).map(c => c.name);
  const onpeTop3 = onpeRanking.slice(0, 3);

  console.log('Modelo top-3:  ' + modelTop3.join(', '));
  console.log('ONPE top-3:    ' + onpeTop3.join(', '));
  console.log();
  console.log('Acertó #1: ' + (modelTop3[0] === onpeTop3[0] ? 'SÍ ✓' : 'NO ✗ (modelo: ' + modelTop3[0] + ', real: ' + onpeTop3[0] + ')'));
  console.log('Acertó #2: ' + (modelTop3[1] === onpeTop3[1] ? 'SÍ ✓' : 'NO ✗ (modelo: ' + modelTop3[1] + ', real: ' + onpeTop3[1] + ')'));
  console.log('Acertó #3: ' + (modelTop3[2] === onpeTop3[2] ? 'SÍ ✓' : 'NO ✗ (modelo: ' + modelTop3[2] + ', real: ' + onpeTop3[2] + ')'));
  console.log('Acertó top-2 (segunda vuelta): ' + (
    new Set(modelTop3.slice(0, 2)).size === new Set([...modelTop3.slice(0, 2), ...onpeTop3.slice(0, 2)]).size
      ? 'SÍ ✓' : 'NO ✗'
  ));

  // 5. Encuestas vs PM vs Modelo
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('ENCUESTAS vs POLYMARKET vs MODELO');
  console.log('═══════════════════════════════════════════════════════\n');

  let maeEnc = 0, maePM = 0, maeModel = 0, cnt2 = 0;
  console.log('Candidato'.padEnd(30) + 'Enc'.padStart(7) + '  PM'.padStart(7) + '  Modelo'.padStart(8) + '  ONPE'.padStart(7));
  console.log('─'.repeat(60));

  for (const real of onpe) {
    const pred = predictions.find(p => p.candidate === real.candidate);
    if (!pred) continue;
    const realPct = parseFloat(real.pct_valid_actual);
    const enc = pred.polls_pct ? parseFloat(pred.polls_pct) : null;
    const pm = pred.polymarket_pct ? parseFloat(pred.polymarket_pct) : null;
    const model = parseFloat(pred.predicted_pct_mean);

    if (enc !== null) maeEnc += Math.abs(enc - realPct);
    if (pm !== null) maePM += Math.abs(pm - realPct);
    maeModel += Math.abs(model - realPct);
    cnt2++;

    console.log(
      real.candidate.padEnd(30) +
      (enc !== null ? enc.toFixed(1) + '%' : '  --').padStart(7) +
      (pm !== null ? pm.toFixed(1) + '%' : '  --').padStart(7) +
      (model.toFixed(1) + '%').padStart(8) +
      (realPct.toFixed(1) + '%').padStart(7)
    );
  }

  if (cnt2 > 0) {
    console.log('─'.repeat(60));
    console.log('MAE:'.padEnd(30) + (maeEnc / cnt2).toFixed(1).padStart(7) + (maePM / cnt2).toFixed(1).padStart(7) + (maeModel / cnt2).toFixed(1).padStart(8));
  }

  // 6. Resumen final
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('MAE del modelo: ' + mae.toFixed(2) + ' pts');
  console.log('Calibración IC 90%: ' + inIC + '/' + count + ' (' + (count > 0 ? (inIC / count * 100).toFixed(0) : 0) + '%)');
  console.log('Acertó ganador primera vuelta: ' + (modelTop3[0] === onpeTop3[0] ? 'SÍ' : 'NO'));
  console.log('Acertó top-2 segunda vuelta: ' + (
    new Set(modelTop3.slice(0, 2)).size === new Set([...modelTop3.slice(0, 2), ...onpeTop3.slice(0, 2)]).size
      ? 'SÍ' : 'NO'
  ));
  console.log('\nComparación histórica:');
  console.log('  2006: MAE 2.4 pts');
  console.log('  2011: MAE 3.6 pts');
  console.log('  2016: MAE 2.2 pts');
  console.log('  2021: MAE 3.0 pts');
  console.log('  2026: MAE ' + mae.toFixed(1) + ' pts ← este modelo');

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
