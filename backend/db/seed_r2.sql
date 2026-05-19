-- Seed R2: Updated pollster weights (based on R1 accuracy) + second-round polls + antivoto.
-- Idempotent: safe to run multiple times.

-- Tabla antivoto_snapshots: historial de rechazo definitivo por candidato.
-- Se usa en el modelo y en el frontend. Agrega nuevas filas cuando salgan nuevas encuestas.
CREATE TABLE IF NOT EXISTS antivoto_snapshots (
  id             SERIAL PRIMARY KEY,
  election_round INT          DEFAULT 2,
  candidate      VARCHAR(100) NOT NULL,
  pct_no         NUMERIC(5,2) NOT NULL,  -- % que "definitivamente no votaría" por este candidato
  pollster_id    INT          REFERENCES pollsters(id),
  field_end      DATE         NOT NULL,
  published_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

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
-- Keiko 38%, Sánchez 38% (empate técnico). Blanco/viciado real: 17%. NS/NP: 7%.
-- Fix pct_blank_null for any existing record inserted with the wrong value (24.0).
UPDATE polls SET
  pct_blank_null = 17.0,
  pct_undecided = 24.0,
  notes = 'Ipsos segunda vuelta abr 23-24 2026. Empate técnico 38-38. Voto blanco/viciado: 17%, NS/NP: 7% (total no comprometido 24%). Primera encuesta post-primera vuelta.'
WHERE pollster_id = (SELECT id FROM pollsters WHERE name = 'Ipsos')
  AND field_end = '2026-04-24'
  AND election_round = 2;

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
            24.0, 17.0,
            'Ipsos segunda vuelta abr 23-24 2026. Empate técnico 38-38. Voto blanco/viciado: 17%, NS/NP: 7% (total no comprometido 24%). Primera encuesta post-primera vuelta.',
            2)
    RETURNING id INTO poll_id;

    INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
      (poll_id, 'Keiko Fujimori', 'Fuerza Popular', 38.0),
      (poll_id, 'Roberto Sánchez Palomino', 'Juntos por el Perú', 38.0);
  END IF;
END $$;

-- IEP April 21-25, 2026: intención de voto segunda vuelta.
-- Keiko 31%, Sánchez 32% (intención bruta). Blanco/nulo 24%, NS/NP 13%.
-- En votos válidos (excl. B/N+NS/NP): Sánchez 50.8%, Keiko 49.2%.
-- IEP emitió comunicado oficial el 16/05/2026 confirmando que NO hubo encuesta de mayo.
-- Correct any wrong record that was inserted with field_end='2026-05-07' (wrong dates/type).
DO $$
DECLARE
  p_id INT;
  wrong_poll_id INT;
  poll_id INT;
BEGIN
  SELECT id INTO p_id FROM pollsters WHERE name = 'IEP';

  -- Fix wrong record if it exists (had wrong dates, wrong poll_type, wrong pct_raw)
  SELECT id INTO wrong_poll_id
  FROM polls
  WHERE pollster_id = p_id AND field_end = '2026-05-07' AND election_round = 2;

  IF wrong_poll_id IS NOT NULL THEN
    UPDATE polls SET
      field_start   = '2026-04-21',
      field_end     = '2026-04-25',
      published_date = '2026-05-02',
      sample_n      = 1600,
      margin_error  = 2.80,
      poll_type     = 'intencion_voto',
      pct_undecided = 37.0,
      pct_blank_null = 24.0,
      notes = 'IEP abr 21-25 2026. Intención de voto segunda vuelta: Sánchez 32%, Keiko 31%, B/N 24%, NS/NP 13%. En votos válidos: Sánchez 50.8%, Keiko 49.2%. IEP emitió comunicado oficial el 16/05/2026 confirmando que no hubo encuesta de mayo.'
    WHERE id = wrong_poll_id;

    -- Fix wrong poll results (was 49.2/50.8 simulacro values, now 31/32 raw intent)
    UPDATE poll_results SET pct_raw = 31.0
    WHERE poll_id = wrong_poll_id AND candidate = 'Keiko Fujimori';

    UPDATE poll_results SET pct_raw = 32.0
    WHERE poll_id = wrong_poll_id AND candidate = 'Roberto Sánchez Palomino';
  END IF;

  -- Insert correct record only if neither the corrected nor an original correct record exists
  IF NOT EXISTS (
    SELECT 1 FROM polls WHERE pollster_id = p_id AND field_end = '2026-04-25' AND election_round = 2
  ) THEN
    INSERT INTO polls (pollster_id, field_start, field_end, published_date, sample_n, margin_error,
                       confidence_lvl, scope, technique, poll_type,
                       pct_undecided, pct_blank_null, notes, election_round)
    VALUES (p_id, '2026-04-21', '2026-04-25', '2026-05-02', 1600, 2.80, 95.0,
            'nacional', 'presencial', 'intencion_voto',
            37.0, 24.0,
            'IEP abr 21-25 2026. Intención de voto segunda vuelta: Sánchez 32%, Keiko 31%, B/N 24%, NS/NP 13%. En votos válidos: Sánchez 50.8%, Keiko 49.2%. IEP emitió comunicado oficial el 16/05/2026 confirmando que no hubo encuesta de mayo.',
            2)
    RETURNING id INTO poll_id;

    INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
      (poll_id, 'Keiko Fujimori', 'Fuerza Popular', 31.0),
      (poll_id, 'Roberto Sánchez Palomino', 'Juntos por el Perú', 32.0);
  END IF;
END $$;

-- Antivoto R2: snapshots de rechazo definitivo (Ipsos para segunda vuelta 2026).
-- Punto 1: 2 de abril (pre-confirmación de candidatos).
-- Punto 2: 23-24 de abril (post-primera vuelta, primera encuesta cabeza a cabeza).
DO $$
DECLARE
  ipsos_id INT;
BEGIN
  SELECT id INTO ipsos_id FROM pollsters WHERE name = 'Ipsos';

  -- 2 abril: Keiko 59%, Sánchez 39%
  IF NOT EXISTS (
    SELECT 1 FROM antivoto_snapshots
    WHERE candidate = 'Keiko Fujimori' AND field_end = '2026-04-02' AND election_round = 2
  ) THEN
    INSERT INTO antivoto_snapshots (election_round, candidate, pct_no, pollster_id, field_end, published_date, notes)
    VALUES (2, 'Keiko Fujimori', 59.0, ipsos_id, '2026-04-02', '2026-04-02',
            'Ipsos 2 abr 2026. Pre-primera vuelta. Rechazo definitivo previo a que Keiko confirmara segunda vuelta.');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM antivoto_snapshots
    WHERE candidate = 'Roberto Sánchez Palomino' AND field_end = '2026-04-02' AND election_round = 2
  ) THEN
    INSERT INTO antivoto_snapshots (election_round, candidate, pct_no, pollster_id, field_end, published_date, notes)
    VALUES (2, 'Roberto Sánchez Palomino', 39.0, ipsos_id, '2026-04-02', '2026-04-02',
            'Ipsos 2 abr 2026. Pre-primera vuelta. 30% adicional no lo conocía aún.');
  END IF;

  -- 23-24 abril: Keiko 48%, Sánchez 43%
  IF NOT EXISTS (
    SELECT 1 FROM antivoto_snapshots
    WHERE candidate = 'Keiko Fujimori' AND field_end = '2026-04-24' AND election_round = 2
  ) THEN
    INSERT INTO antivoto_snapshots (election_round, candidate, pct_no, pollster_id, field_end, published_date, notes)
    VALUES (2, 'Keiko Fujimori', 48.0, ipsos_id, '2026-04-24', '2026-04-26',
            'Ipsos 23-24 abr 2026. Bajó 11pp desde el 2 abr — mejor registro en segunda vuelta. Sigue siendo el más alto.');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM antivoto_snapshots
    WHERE candidate = 'Roberto Sánchez Palomino' AND field_end = '2026-04-24' AND election_round = 2
  ) THEN
    INSERT INTO antivoto_snapshots (election_round, candidate, pct_no, pollster_id, field_end, published_date, notes)
    VALUES (2, 'Roberto Sánchez Palomino', 43.0, ipsos_id, '2026-04-24', '2026-04-26',
            'Ipsos 23-24 abr 2026. Subió 4pp desde el 2 abr a medida que fue conociéndose (NS/NP bajó del 30% al 5%).');
  END IF;
END $$;
