const fs = require('fs');
const path = require('path');
const { nowPeru, electoralPhase } = require('./model/clock');
const { getPolymarketWeight } = require('./model/weights');
const { handleError } = require('./errors/errorHandler');
const db = require('./db');

/**
 * Auto-migración: ejecuta schema.sql y seed.sql si las tablas no existen.
 */
async function autoMigrate() {
  // Verificar si las tablas ya existen
  const { rows } = await db.query(`
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'polls'
  `);

  if (parseInt(rows[0].count) > 0) {
    return false; // Tablas ya existen, no migrar
  }

  console.log('📦 Tablas no encontradas — ejecutando auto-migración...');

  // Ejecutar schema.sql
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);
  console.log('   ✅ schema.sql ejecutado — 7 tablas creadas');

  // Ejecutar seed.sql
  const seedPath = path.join(__dirname, 'db', 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  await db.query(seedSql);
  console.log('   ✅ seed.sql ejecutado — datos precargados');

  return true;
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

  // 4. Auto-migración si las tablas no existen
  try {
    await autoMigrate();
  } catch (e) {
    console.error('❌ Auto-migración falló:', e.message);
    await handleError('SEED_DATA_CORRUPT', { module: 'startup' }, e);
  }

  // 5. Verificar datos seed
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM polls');
    if (parseInt(rows[0].count) < 10) {
      console.warn(`⚠️  Solo ${rows[0].count} encuestas en DB`);
    } else {
      console.log(`✅ Encuestas en DB: ${rows[0].count}`);
    }
  } catch (e) {
    console.warn('⚠️  Tabla polls no accesible');
  }

  // 6. Último snapshot Polymarket
  try {
    const snap = await db.query('SELECT MAX(captured_at) as last FROM polymarket_snapshots');
    if (snap.rows[0].last) {
      const hrs = (Date.now() - new Date(snap.rows[0].last)) / 3600000;
      if (hrs > 3) {
        console.warn(`⚠️  Polymarket: último snapshot hace ${hrs.toFixed(1)} horas`);
      } else {
        console.log(`✅ Polymarket: último snapshot hace ${hrs.toFixed(1)} horas`);
      }
    } else {
      console.warn('⚠️  Sin snapshots de Polymarket aún');
    }
  } catch (e) {
    console.warn('⚠️  Tabla polymarket_snapshots no accesible');
  }

  console.log('\n✅ Sistema listo para operar.\n');
}

module.exports = { validateSystemIntegrity };
