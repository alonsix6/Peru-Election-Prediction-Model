const fs = require('fs');
const path = require('path');
const { nowPeru, electoralPhase } = require('./model/clock');
const { getPolymarketWeight } = require('./model/weights');
const { handleError } = require('./errors/errorHandler');
const { runFullPipeline } = require('./model/pipeline');
const db = require('./db');

/**
 * Auto-migración: ejecuta schema.sql y seed.sql si las tablas no existen.
 * Si existen, agrega columnas nuevas (trigger, runoff_json) si faltan.
 */
async function autoMigrate() {
  const { rows } = await db.query(`
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'polls'
  `);

  if (parseInt(rows[0].count) === 0) {
    console.log('📦 Tablas no encontradas — ejecutando auto-migración...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await db.query(schemaSql);
    console.log('   ✅ schema.sql ejecutado');
    const seedSql = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
    await db.query(seedSql);
    console.log('   ✅ seed.sql ejecutado');
    return true;
  }

  // Migrar columnas nuevas si faltan
  const { rows: cols } = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'model_predictions' AND column_name IN ('trigger', 'runoff_json', 'polls_pct', 'polymarket_pct', 'posterior_pct', 'risk_json', 'is_final_snapshot', 'frozen_at')
  `);
  const existing = cols.map(c => c.column_name);

  const migrations = [
    ['trigger', `ALTER TABLE model_predictions ADD COLUMN trigger VARCHAR(30) DEFAULT 'auto_polymarket_update'`],
    ['runoff_json', `ALTER TABLE model_predictions ADD COLUMN runoff_json TEXT`],
    ['polls_pct', `ALTER TABLE model_predictions ADD COLUMN polls_pct DECIMAL(5,2)`],
    ['polymarket_pct', `ALTER TABLE model_predictions ADD COLUMN polymarket_pct DECIMAL(5,2)`],
    ['posterior_pct', `ALTER TABLE model_predictions ADD COLUMN posterior_pct DECIMAL(5,2)`],
    ['risk_json', `ALTER TABLE model_predictions ADD COLUMN risk_json TEXT`],
    ['is_final_snapshot', `ALTER TABLE model_predictions ADD COLUMN is_final_snapshot BOOLEAN DEFAULT FALSE`],
    ['frozen_at', `ALTER TABLE model_predictions ADD COLUMN frozen_at TIMESTAMPTZ`],
  ];
  for (const [col, sql] of migrations) {
    if (!existing.includes(col)) {
      await db.query(sql);
      console.log(`   ✅ Columna ${col} agregada a model_predictions`);
    }
  }

  return false;
}

/**
 * Verifica si hay al menos una predicción automática.
 * Si no, corre el pipeline para poblar la DB antes del primer usuario.
 */
async function ensureFirstPrediction() {
  try {
    const { rows } = await db.query(`
      SELECT COUNT(*) FROM model_predictions WHERE trigger = 'auto_polymarket_update'
    `);
    if (parseInt(rows[0].count) === 0) {
      console.log('🧮 Sin predicciones automáticas — corriendo pipeline inicial...');
      await runFullPipeline({ saveToDB: true, trigger: 'auto_polymarket_update' });
      console.log('✅ Primera predicción guardada en DB');
    } else {
      console.log(`✅ Predicciones en DB: ${rows[0].count} registros automáticos`);
    }
  } catch (e) {
    console.error('⚠️  No se pudo generar predicción inicial:', e.message);
  }
}

async function validateSystemIntegrity() {
  console.log('\n🗳️  PERU ELECTION MODEL 2026 — Iniciando...\n');

  // 1. Reloj de Lima
  try {
    const now = nowPeru();
    console.log(`✅ Reloj Lima: ${now.toFormat('dd/MM/yyyy HH:mm:ss')} (${now.zoneName})`);
    console.log(`   Fase electoral: ${electoralPhase()}`);
    const α = getPolymarketWeight();
    console.log(`   Peso Polymarket actual: ${α !== null ? (α * 100).toFixed(1) + '%' : 'N/A (post-elección)'}`);
  } catch (e) {
    await handleError('TIMEZONE_FAILURE', { module: 'startup' }, e);
  }

  // 2. Variables de entorno
  const missingVars = [];
  for (const v of ['DATABASE_URL', 'PORT', 'NODE_ENV']) {
    if (!process.env[v]) missingVars.push(v);
  }
  if (missingVars.length > 0) {
    console.warn(`⚠️  Variables faltantes: ${missingVars.join(', ')}`);
    for (const v of missingVars) {
      await handleError('ENV_VAR_MISSING', { variable: v, module: 'startup' });
    }
    if (missingVars.includes('DATABASE_URL')) {
      throw new Error('DATABASE_URL no configurada — DB no disponible');
    }
  } else {
    console.log('✅ Variables de entorno: OK');
  }

  // 3. Base de datos
  try {
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL: conexión OK');
  } catch (e) {
    await handleError('DB_CONNECTION_FAILED', { module: 'startup' }, e);
    throw new Error('No se pudo conectar a PostgreSQL');
  }

  // 4. Auto-migración
  try {
    await autoMigrate();
  } catch (e) {
    console.error('❌ Auto-migración falló:', e.message);
    await handleError('SEED_DATA_CORRUPT', { module: 'startup' }, e);
  }

  // 4b. Reconstrucción FOTO FINAL post-BdU
  // Si el final_election_day actual tiene datos pre-BdU (KF < 28%), reconstruir
  // usando el último snapshot de PM de la noche electoral (con datos post-BdU).
  try {
    const { rows: finalCheck } = await db.query(`
      SELECT predicted_pct_mean FROM model_predictions
      WHERE trigger = 'final_election_day' AND candidate = 'Keiko Fujimori'
      LIMIT 1
    `);

    if (finalCheck.length > 0) {
      const kfPct = parseFloat(finalCheck[0].predicted_pct_mean);

      if (kfPct < 28) {
        // Datos pre-BdU detectados — buscar último PM snapshot de la noche electoral
        const { rows: pmSnap } = await db.query(`
          SELECT DISTINCT captured_at_lima
          FROM polymarket_snapshots
          WHERE captured_at_lima >= '2026-04-12T18:30:00-05:00'
            AND captured_at_lima < '2026-04-13T00:00:00-05:00'
          ORDER BY captured_at_lima DESC
          LIMIT 1
        `);

        if (pmSnap.length > 0) {
          const pmTs = pmSnap[0].captured_at_lima;
          console.log(`🔄 FOTO FINAL pre-BdU detectada (KF ${kfPct.toFixed(1)}%) — reconstruyendo con PM snapshot de ${pmTs}...`);

          // Borrar final_election_day actual (pre-BdU)
          await db.query("DELETE FROM model_predictions WHERE trigger = 'final_election_day'");

          // Reconstruir con datos post-BdU, alpha=0.77 (el valor del día electoral)
          await runFullPipeline({
            saveToDB: true,
            trigger: 'final_election_day',
            pmTimestamp: pmTs,
            overrideTimestamp: pmTs,
            overrideAlpha: 0.77
          });
          console.log('✅ FOTO FINAL reconstruida con datos post-BdU');
        } else {
          console.warn('⚠️  No hay PM snapshots post-BdU para reconstruir');
        }
      } else {
        console.log(`✅ FOTO FINAL OK (KF ${kfPct.toFixed(1)}% — datos post-BdU)`);
      }
    }

    // Dedup: borrar final_election_day duplicados (mantener solo el último)
    const { rows: fotoFinal } = await db.query(`
      SELECT MAX(generated_at_lima) as ts FROM model_predictions
      WHERE trigger = 'final_election_day'
    `);
    if (fotoFinal[0].ts) {
      const r1 = await db.query(`
        DELETE FROM model_predictions
        WHERE trigger = 'final_election_day'
          AND generated_at_lima < $1
      `, [fotoFinal[0].ts]);
      if (r1.rowCount > 0) {
        console.log(`   🧹 ${r1.rowCount} registros duplicados de final_election_day eliminados`);
      }
    }
  } catch (e) {
    console.warn('⚠️  Reconstrucción/limpieza FOTO FINAL falló:', e.message);
  }

  // 5. Verificar datos seed
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM polls');
    console.log(`✅ Encuestas en DB: ${rows[0].count}`);
  } catch (e) {
    console.warn('⚠️  Tabla polls no accesible');
  }

  // 6. Último snapshot Polymarket
  try {
    const snap = await db.query('SELECT MAX(captured_at) as last FROM polymarket_snapshots');
    if (snap.rows[0].last) {
      const hrs = (Date.now() - new Date(snap.rows[0].last)) / 3600000;
      console.log(`✅ Polymarket: último snapshot hace ${hrs.toFixed(1)} horas`);
    } else {
      console.warn('⚠️  Sin snapshots de Polymarket aún');
    }
  } catch (e) {
    console.warn('⚠️  Tabla polymarket_snapshots no accesible');
  }

  // 7. Asegurar primera predicción (solo si no estamos post-elección)
  const phase = electoralPhase();
  if (phase === 'post_election') {
    console.log('🗳️  Post-elección — no se corren predicciones nuevas.');
  } else {
    await ensureFirstPrediction();
  }

  console.log('\n✅ Sistema listo para operar.\n');
}

module.exports = { validateSystemIntegrity };
