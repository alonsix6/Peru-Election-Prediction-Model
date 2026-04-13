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
