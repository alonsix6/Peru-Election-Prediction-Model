/**
 * Voto potencial — actualizado con datos Ipsos (campo 1-2 abril 2026).
 * Piso = "Definitivamente sí", Techo = Potencial (definitivo + podría), Rechazo = "Definitivamente no".
 * Reemplaza datos CIT marzo 2026.
 */
const VOTE_POTENTIAL_CIT = {
  'Rafael López Aliaga': { ceiling: 24.0, floor:  6.0, rejection: 51.0 },
  'Keiko Fujimori':      { ceiling: 26.0, floor: 10.0, rejection: 59.0 },
  'Carlos Álvarez':      { ceiling: 34.0, floor:  7.0, rejection: 38.0 },
  'López Chau':          { ceiling: 20.0, floor:  3.0, rejection: 42.0 },
  'Wolfgang Grozo':      { ceiling: 14.0, floor:  5.5, rejection: 45.6 },  // sin dato Ipsos, mantiene CIT marzo
  'Roberto Sánchez Palomino': { ceiling: 17.0, floor: 5.0, rejection: 41.0 }
};

/**
 * Redistribuye el voto indeciso proporcionalmente al espacio de crecimiento.
 *
 * Fórmula (sección 6, Fase 2):
 *   espacio = (techo_potencial − estimado_actual) × (1 − rechazo/100)
 *   redistribucion = indecisos_totales × (espacio / Σ espacios)
 *   estimado_final = estimado_actual + redistribucion
 *
 * @param {Object} aggregated - Salida de aggregatePolls():
 *   { candidate: { weighted_pct, combined_error, n_polls } }
 * @param {number} undecidedPct - % de indecisos a redistribuir
 * @param {Object} [votePotential] - Override de voto potencial CIT.
 *   Si no se pasa, usa VOTE_POTENTIAL_CIT.
 * @returns {Object} - { candidate: { estimated_pct, redistribution, ceiling, floor, rejection } }
 */
function redistributeUndecided(aggregated, undecidedPct, votePotential = VOTE_POTENTIAL_CIT) {
  const result = {};
  let totalSpace = 0;

  // Paso 1: Calcular espacio de crecimiento por candidato
  for (const [candidate, data] of Object.entries(aggregated)) {
    const current = data.weighted_pct;
    const potential = votePotential[candidate];

    let ceiling, floor, rejection;

    if (potential) {
      ceiling = potential.ceiling;
      floor = potential.floor;
      rejection = potential.rejection;
    } else {
      // Candidatos sin datos CIT: techo = weighted_pct × 2, piso = 0
      ceiling = current * 2;
      floor = 0;
      rejection = 50; // Rechazo neutro por defecto
    }

    // espacio = (techo − estimado_actual) × (1 − rechazo/100)
    const rawSpace = Math.max(0, ceiling - current);
    const space = rawSpace * (1 - rejection / 100);

    result[candidate] = {
      current_pct: current,
      ceiling,
      floor,
      rejection,
      space,
      redistribution: 0,  // Se calcula en paso 2
      estimated_pct: current
    };

    totalSpace += space;
  }

  // Paso 2: Redistribuir indecisos proporcionalmente
  if (totalSpace > 0 && undecidedPct > 0) {
    for (const [candidate, data] of Object.entries(result)) {
      const proportion = data.space / totalSpace;
      data.redistribution = undecidedPct * proportion;
      data.estimated_pct = data.current_pct + data.redistribution;

      // Clamp: no superar el techo de voto potencial
      if (data.estimated_pct > data.ceiling) {
        const excess = data.estimated_pct - data.ceiling;
        data.estimated_pct = data.ceiling;
        data.redistribution = data.ceiling - data.current_pct;
        data.clamped = true;
        data.excess = excess;
      }
    }
  }

  return result;
}

module.exports = { redistributeUndecided, VOTE_POTENTIAL_CIT };
