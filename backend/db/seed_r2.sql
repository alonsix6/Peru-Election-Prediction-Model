-- Seed R2: Updated pollster weights (based on R1 accuracy) + second-round polls.
-- Idempotent: safe to run multiple times.

-- Update pollster weights based on R1 2026 conteo rápido performance.
-- Ipsos: MAE 0.28pp (best), Datum: MAE 2.0pp (second best).
UPDATE pollsters SET
  weight_multiplier = 1.30,
  notes = 'Ipsos. MAE 0.28pp en conteo rápido R1 2026 — mejor cobertura geográfica nacional. Base de referencia para segunda vuelta.'
WHERE name = 'Ipsos';

UPDATE pollsters SET
  weight_multiplier = 1.05,
  notes = 'Datum. MAE 2.0pp en conteo rápido R1 2026. Muestra grande (n=3000). Penalizado por sesgo urbano en selección de mesas.'
WHERE name = 'Datum';

-- Ipsos April 23-24, 2026: first R2 head-to-head poll.
-- Keiko 38%, Sánchez 38% (empate técnico). Blanco/nulo 24%.
DO $$
DECLARE
  p_id INT;
  poll_id INT;
BEGIN
  SELECT id INTO p_id FROM pollsters WHERE name = 'Ipsos';

  IF NOT EXISTS (
    SELECT 1 FROM polls WHERE pollster_id = p_id AND field_end = '2026-04-24' AND election_round = 2
  ) THEN
    INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error,
                       confidence_lvl, scope, technique, poll_type,
                       pct_undecided, pct_blank_null, notes, election_round)
    VALUES (p_id, '2026-04-23', '2026-04-24', '2026-04-26', 1200, 2.80, 95.0,
            'nacional', 'presencial', 'intencion_voto',
            24.0, 24.0,
            'Ipsos segunda vuelta abr 23-24 2026. Empate técnico 38-38. Blanco/nulo 24%. Primera encuesta post-primera vuelta.',
            2)
    RETURNING id INTO poll_id;

    INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
      (poll_id, 'Keiko Fujimori', 'Fuerza Popular', 38.0),
      (poll_id, 'Roberto Sánchez Palomino', 'Juntos por el Perú', 38.0);
  END IF;
END $$;

-- IEP May 1-7, 2026: simulacro segunda vuelta (votos válidos).
-- Sánchez 50.8%, Keiko 49.2%.
DO $$
DECLARE
  p_id INT;
  poll_id INT;
BEGIN
  SELECT id INTO p_id FROM pollsters WHERE name = 'IEP';

  IF NOT EXISTS (
    SELECT 1 FROM polls WHERE pollster_id = p_id AND field_end = '2026-05-07' AND election_round = 2
  ) THEN
    INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error,
                       confidence_lvl, scope, technique, poll_type,
                       pct_blank_null, notes, election_round)
    VALUES (p_id, '2026-05-01', '2026-05-07', '2026-05-10', 1500, 2.50, 95.0,
            'nacional', 'presencial', 'simulacro',
            0.0,
            'IEP mayo 2026. Simulacro votos válidos segunda vuelta: Sánchez 50.8%, Keiko 49.2%. Incluye cobertura regional.',
            2)
    RETURNING id INTO poll_id;

    INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
      (poll_id, 'Keiko Fujimori', 'Fuerza Popular', 49.2),
      (poll_id, 'Roberto Sánchez Palomino', 'Juntos por el Perú', 50.8);
  END IF;
END $$;
