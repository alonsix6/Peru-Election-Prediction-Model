const { nowPeru } = require('../model/clock');
const { ERROR_TYPES } = require('./errorTypes');
const db = require('../db');
const fs = require('fs');

async function handleError(errorCode, context = {}, originalError = null) {
  const errorDef = ERROR_TYPES[errorCode];
  const now = nowPeru();

  // 1. Log en consola con severidad visual
  const prefix = {
    CRITICAL: '🚨 CRÍTICO',
    HIGH:     '⚠️  ALTO',
    MEDIUM:   '⚡ MEDIO',
    LOW:      '📝 BAJO'
  }[errorDef?.severity] ?? '❓ DESCONOCIDO';

  console.error(`${prefix} [${errorDef?.code ?? errorCode}] ${errorDef?.description ?? 'Error desconocido'}`);
  if (originalError?.message) console.error('   Mensaje:', originalError.message);
  if (Object.keys(context).length > 0) console.error('   Contexto:', JSON.stringify(context));
  console.log(`   Fallback: ${errorDef?.fallback ?? 'Sin fallback definido'}`);

  // 2. Guardar en DB
  try {
    await db.query(
      `INSERT INTO error_log
       (occurred_at_lima, error_type, error_code, module, message, stack_trace, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [now.toISO(), errorCode, errorDef?.code, context.module ?? 'unknown',
       originalError?.message ?? errorDef?.description,
       originalError?.stack ?? null, JSON.stringify(context)]
    );
  } catch {
    // Si DB falla, escribir en archivo local
    fs.appendFileSync('./error_fallback.log',
      `${now.toISO()} | ${errorDef?.code ?? errorCode} | ${originalError?.message ?? ''}\n`
    );
  }

  // 3. Modo degradado si es CRÍTICO
  if (errorDef?.severity === 'CRITICAL') {
    console.error('\n   ⚠️  SISTEMA EN MODO DEGRADADO ⚠️\n');
  }

  return errorDef;
}

// Wrapper para funciones async
function withErrorHandling(errorCode, context, fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      await handleError(errorCode, { ...context, args }, err);
      return null; // El caller decide el fallback
    }
  };
}

module.exports = { handleError, withErrorHandling };
