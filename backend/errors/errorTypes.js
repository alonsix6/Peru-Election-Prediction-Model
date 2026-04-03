const ERROR_TYPES = {

  // ERRORES DE RELOJ Y TIMEZONE
  TIMEZONE_FAILURE: {
    code: 'ERR_TZ_001', severity: 'CRITICAL',
    description: 'No se pudo obtener la hora de Lima, Perú',
    fallback: 'Usar UTC-5 hardcodeado',
    action: 'Alertar inmediatamente — pesos del modelo incorrectos'
  },
  WRONG_PHASE_DETECTED: {
    code: 'ERR_TZ_002', severity: 'HIGH',
    description: 'Fase electoral calculada no coincide con la esperada',
    fallback: 'Usar fase anterior conocida',
    action: 'Log + alerta. No cambiar pesos hasta confirmar.'
  },

  // ERRORES DEL SCRAPER DE POLYMARKET
  POLYMARKET_API_TIMEOUT: {
    code: 'ERR_PM_001', severity: 'MEDIUM',
    description: 'Polymarket CLOB API no respondió en tiempo',
    fallback: 'Usar último snapshot guardado en DB',
    action: 'Reintentar en 5 min. 3 fallos consecutivos → alerta crítica'
  },
  POLYMARKET_DATA_STALE: {
    code: 'ERR_PM_002', severity: 'HIGH',
    description: 'Último snapshot tiene más de 3 horas de antigüedad',
    fallback: 'Reducir peso Polymarket al 50% del calculado',
    action: 'Mostrar en dashboard: "Datos de mercado desactualizados"'
  },
  POLYMARKET_PRICE_ANOMALY: {
    code: 'ERR_PM_003', severity: 'LOW',
    description: 'Probabilidades no suman ~100% (tolerancia ±5%)',
    fallback: 'Renormalizar automáticamente',
    action: 'Log silencioso. Normal en mercados con baja liquidez.'
  },
  POLYMARKET_CANDIDATE_MISSING: {
    code: 'ERR_PM_004', severity: 'MEDIUM',
    description: 'Candidato esperado no aparece en el mercado',
    fallback: 'Asignar 0% en Polymarket; usar solo encuestas para ese candidato',
    action: 'Log. Verificar si fue eliminado del mercado.'
  },

  // ERRORES DEL MODELO ESTADÍSTICO
  MONTE_CARLO_NO_CONVERGENCE: {
    code: 'ERR_MC_001', severity: 'HIGH',
    description: 'Distribuciones degeneradas (p.ej. un candidato al 99%)',
    fallback: 'Usar última predicción válida en DB',
    action: 'Log con parámetros de entrada. Revisar datos extremos.'
  },
  NEGATIVE_PROBABILITY: {
    code: 'ERR_MC_002', severity: 'HIGH',
    description: 'Probabilidad calculada es negativa',
    fallback: 'Clampear a 0 y renormalizar',
    action: 'Log. Revisar house effects — pueden estar sobre-corrigiendo.'
  },
  UNDECIDED_OVERFLOW: {
    code: 'ERR_MC_003', severity: 'MEDIUM',
    description: 'Redistribución de indecisos superó el techo de voto potencial',
    fallback: 'Clampear al techo y redistribuir el exceso proporcionalmente',
    action: 'Log silencioso. Esperado cuando el voto potencial está desactualizado.'
  },
  ZERO_WEIGHT_POLLS: {
    code: 'ERR_MC_004', severity: 'CRITICAL',
    description: 'Todas las encuestas tienen peso efectivo ~0 (muy antiguas)',
    fallback: 'Usar solo Polymarket con α=0.80',
    action: 'Dashboard: "Predicción basada únicamente en mercado de predicciones"'
  },
  CHOLESKY_FAILURE: {
    code: 'ERR_MC_005', severity: 'MEDIUM',
    description: 'Matriz de correlación no positiva definida',
    fallback: 'Usar errores independientes — resultado menos preciso',
    action: 'Log. Revisar matriz de correlación entre encuestadoras.'
  },

  // ERRORES DE BASE DE DATOS
  DB_CONNECTION_FAILED: {
    code: 'ERR_DB_001', severity: 'CRITICAL',
    description: 'No se puede conectar a PostgreSQL en Railway',
    fallback: 'Cachear últimas predicciones en memoria (máx 2 horas)',
    action: 'Alerta crítica inmediata. Sistema en modo degradado.'
  },
  DB_WRITE_FAILED: {
    code: 'ERR_DB_002', severity: 'HIGH',
    description: 'No se pudo escribir snapshot o predicción en DB',
    fallback: 'Reintentar 3 veces con backoff exponencial (1s, 2s, 4s)',
    action: 'Si falla las 3 veces: log en archivo local como respaldo'
  },
  SEED_DATA_CORRUPT: {
    code: 'ERR_DB_003', severity: 'CRITICAL',
    description: 'Datos precargados de encuestas o track record 2021 corruptos',
    fallback: 'Detener el modelo. No predecir con datos incompletos.',
    action: 'Alerta crítica. Restaurar desde seed.sql.'
  },

  // ERRORES DE DEPLOY / INFRAESTRUCTURA
  CRON_JOB_MISSED: {
    code: 'ERR_INF_001', severity: 'MEDIUM',
    description: 'Cron job de Polymarket no se ejecutó en horario esperado',
    fallback: 'Ejecutar inmediatamente al detectar el gap',
    action: 'Log con timestamp. >3 horas sin snapshot → ERR_PM_002'
  },
  ENV_VAR_MISSING: {
    code: 'ERR_INF_002', severity: 'CRITICAL',
    description: 'Variable de entorno crítica no definida (DATABASE_URL, etc.)',
    fallback: 'Ninguno — el sistema no arranca sin estas variables',
    action: 'El proceso muere con mensaje claro. Revisar Railway env vars.'
  },
  MEMORY_OVERFLOW: {
    code: 'ERR_INF_003', severity: 'HIGH',
    description: 'Monte Carlo de 10,000 simulaciones agotó memoria',
    fallback: 'Reducir a 5,000 simulaciones automáticamente',
    action: 'Log. Considera aumentar RAM en Railway.'
  }
};

module.exports = { ERROR_TYPES };
