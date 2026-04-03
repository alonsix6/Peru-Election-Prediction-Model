/**
 * Voto potencial CIT (20–23 mar) — sección 5.5 del plan.
 * Piso = "Definitivamente sí", Techo = Potencial (A+B), Rechazo = "Definitivamente no".
 */
const VOTE_POTENTIAL_CIT = {
  'Rafael López Aliaga': { ceiling: 27.7, floor: 14.6, rejection: 50.8 },
  'Keiko Fujimori':      { ceiling: 18.5, floor: 10.8, rejection: 62.7 },
  'Carlos Álvarez':      { ceiling: 18.4, floor:  4.2, rejection: 50.2 },
  'López Chau':          { ceiling: 17.2, floor:  5.4, rejection: 51.7 },
  'Wolfgang Grozo':      { ceiling: 14.0, floor:  5.5, rejection: 45.6 },
  // Estimado — sin dato CIT, basado en precedente Castillo 2021 (base rural/anti-sistema)
  'Roberto Sánchez Palomino': { ceiling: 22.0, floor: 6.0, rejection: 48.0 }
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
