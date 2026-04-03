-- Peru Election Prediction Model 2026
-- Seed data — Sección 5 del Master Plan v2
-- Generado: 2 abril 2026, hora Lima

-- ============================================================
-- 5.1 ENCUESTADORAS Y PESOS HISTÓRICOS
-- ============================================================

INSERT INTO pollsters (id, name, historical_mae, weight_multiplier, notes) VALUES
  (1, 'IEP',   3.50, 1.25, 'Mejor track record 2021; única que captó crecimiento de Castillo; mayor cobertura rural'),
  (2, 'Datum', 4.20, 1.10, 'Mayor muestra (n=2000); ficha técnica más robusta'),
  (3, 'Ipsos', 4.80, 1.00, 'Referencia base; metodología consistente y documentada'),
  (4, 'CPI',   5.10, 0.95, 'Ligeramente menor precisión 2021'),
  (5, 'CIT',   NULL, 0.85, 'Sin data comparable 2021; penalización por incertidumbre');

-- ============================================================
-- 5.2 RESULTADOS REALES 2021 (GROUND TRUTH ONPE)
-- Primera vuelta — 11 abril 2021, votos válidos
-- ============================================================

INSERT INTO historical_results (election_year, round, candidate, party, pct_actual, pct_valid_actual) VALUES
  (2021, 1, 'Pedro Castillo',       'Perú Libre',         18.92, 18.92),
  (2021, 1, 'Keiko Fujimori',       'Fuerza Popular',     13.41, 13.41),
  (2021, 1, 'Rafael López Aliaga',  'Renovación Popular', 11.73, 11.73),
  (2021, 1, 'Hernando de Soto',     'Avanza País',        11.62, 11.62),
  (2021, 1, 'Yonhy Lescano',        'Acción Popular',      9.87,  9.87),
  (2021, 1, 'Verónica Mendoza',     'Juntos por el Perú',  8.84,  8.84),
  (2021, 1, 'César Acuña',          'APP',                 6.00,  6.00);

-- ============================================================
-- 5.5 DATASET COMPLETO DE ENCUESTAS 2026
-- ============================================================

-- ------------------------------------------------------------
-- SERIE CPI (Presencial, Urb+Rural, n~1300, ME ±2.7-2.8%, Confianza 95.5%)
-- ------------------------------------------------------------

-- CPI Nov 2025
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_undecided, pct_blank_null, notes)
VALUES (4, '2025-11-01', '2025-11-30', 1300, 2.80, 95.5, 'nacional', 'presencial', 'intencion_voto', 30.70, 19.20, 'CPI Nov 2025 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (1, 'Rafael López Aliaga',  'Renovación Popular', 12.50),
  (1, 'Keiko Fujimori',       'Fuerza Popular',      7.60),
  (1, 'Carlos Álvarez',       NULL,                   4.00),
  (1, 'López Chau',           NULL,                   1.80),
  (1, 'César Acuña',          'APP',                  2.80),
  (1, 'Yonhy Lescano',        'Acción Popular',       0.50);

-- CPI Ene I 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (4, '2026-01-01', '2026-01-15', 1300, 2.80, 95.5, 'nacional', 'presencial', 'intencion_voto', 'CPI Ene I 2026 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (2, 'Rafael López Aliaga',  'Renovación Popular', 13.60),
  (2, 'Keiko Fujimori',       'Fuerza Popular',      7.10),
  (2, 'López Chau',           NULL,                   3.10),
  (2, 'Martín Nieto',         NULL,                   0.20);

-- CPI 29 ene - 2 feb 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
VALUES (4, '2026-01-29', '2026-02-02', 1300, 2.70, 95.5, 'nacional', 'presencial', 'intencion_voto', 16.10, 'CPI 29ene-2feb 2026 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (3, 'Rafael López Aliaga',  'Renovación Popular', 14.60),
  (3, 'Keiko Fujimori',       'Fuerza Popular',      6.60),
  (3, 'López Chau',           NULL,                   3.70),
  (3, 'Carlos Álvarez',       NULL,                   3.60),
  (3, 'César Acuña',          'APP',                  3.90),
  (3, 'Antauro Humala Sánchez', NULL,                 1.80);

-- CPI 14-18 feb 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_undecided, pct_blank_null, notes)
VALUES (4, '2026-02-14', '2026-02-18', 1300, 2.70, 95.5, 'nacional', 'presencial', 'intencion_voto', 29.10, 16.10, 'CPI 14-18feb 2026 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (4, 'Rafael López Aliaga',  'Renovación Popular', 13.90),
  (4, 'Keiko Fujimori',       'Fuerza Popular',      7.00),
  (4, 'López Chau',           NULL,                   5.10),
  (4, 'Carlos Álvarez',       NULL,                   4.00),
  (4, 'Wolfgang Grozo',       NULL,                   0.60),
  (4, 'Antauro Humala Sánchez', NULL,                 1.80),
  (4, 'César Acuña',          'APP',                  4.40),
  (4, 'Yonhy Lescano',        'Acción Popular',       2.20);

-- CPI 28feb-5mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_undecided, notes)
VALUES (4, '2026-02-28', '2026-03-05', 1300, 2.70, 95.5, 'nacional', 'presencial', 'intencion_voto', 20.80, 'CPI 28feb-5mar 2026 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (5, 'Rafael López Aliaga',  'Renovación Popular', 12.70),
  (5, 'Keiko Fujimori',       'Fuerza Popular',      8.00),
  (5, 'López Chau',           NULL,                   5.60),
  (5, 'Carlos Álvarez',       NULL,                   5.00),
  (5, 'Wolfgang Grozo',       NULL,                   4.80),
  (5, 'César Acuña',          'APP',                  3.40);

-- CPI 21-23 mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_undecided, pct_blank_null, notes)
VALUES (4, '2026-03-21', '2026-03-23', 1300, 2.70, 95.5, 'nacional', 'presencial', 'intencion_voto', 23.10, 24.20, 'CPI 21-23mar 2026 via RPP');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (6, 'Rafael López Aliaga',  'Renovación Popular', 11.70),
  (6, 'Keiko Fujimori',       'Fuerza Popular',     10.10),
  (6, 'López Chau',           NULL,                   6.60),
  (6, 'Carlos Álvarez',       NULL,                   3.50),
  (6, 'Martín Nieto',         NULL,                   3.90),
  (6, 'Antauro Humala Sánchez', NULL,                 3.10),
  (6, 'César Acuña',          'APP',                  3.20);

-- ------------------------------------------------------------
-- SERIE IPSOS (Presencial, Urb+Rural, n=1212, ME ±2.5%, Confianza 95%)
-- ------------------------------------------------------------

-- Ipsos Ene 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (3, '2026-01-01', '2026-01-31', 1212, 2.50, 95.0, 'nacional', 'presencial', 'intencion_voto', 'Ipsos Ene 2026 via Peru21');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (7, 'Rafael López Aliaga',  'Renovación Popular', 10.00),
  (7, 'Keiko Fujimori',       'Fuerza Popular',      7.00);

-- Ipsos 5-6 feb 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (3, '2026-02-05', '2026-02-06', 1212, 2.50, 95.0, 'nacional', 'presencial', 'intencion_voto', 'Ipsos 5-6feb 2026 via Peru21');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (8, 'Rafael López Aliaga',  'Renovación Popular', 12.00),
  (8, 'Keiko Fujimori',       'Fuerza Popular',      8.00),
  (8, 'López Chau',           NULL,                   3.00);

-- Ipsos 6 mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (3, '2026-03-06', '2026-03-06', 1212, 2.50, 95.0, 'nacional', 'presencial', 'intencion_voto', 'Ipsos 6mar 2026 via Peru21');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (9, 'Rafael López Aliaga',  'Renovación Popular',  9.00),
  (9, 'Keiko Fujimori',       'Fuerza Popular',       6.00),
  (9, 'Carlos Álvarez',       NULL,                    6.00);

-- Ipsos 21-22 mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
VALUES (3, '2026-03-21', '2026-03-22', 1212, 2.50, 95.0, 'nacional', 'presencial', 'intencion_voto', 21.00, 'Ipsos 21-22mar 2026 via Peru21');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (10, 'Rafael López Aliaga',   'Renovación Popular', 10.00),
  (10, 'Keiko Fujimori',        'Fuerza Popular',     11.00),
  (10, 'López Chau',            NULL,                   5.00),
  (10, 'Carlos Álvarez',        NULL,                   5.00),
  (10, 'Antauro Humala Sánchez', NULL,                  5.00),
  (10, 'Martín Nieto',          NULL,                   5.00);

-- Ipsos 26-27 mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
VALUES (3, '2026-03-26', '2026-03-27', 1212, 2.50, 95.0, 'nacional', 'presencial', 'intencion_voto', 21.00, 'Ipsos 26-27mar 2026 via Peru21');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (11, 'Rafael López Aliaga',   'Renovación Popular',  9.00),
  (11, 'Keiko Fujimori',        'Fuerza Popular',      11.00),
  (11, 'López Chau',            NULL,                    4.00),
  (11, 'Carlos Álvarez',        NULL,                    7.00),
  (11, 'Antauro Humala Sánchez', NULL,                   4.00),
  (11, 'Martín Nieto',          NULL,                    5.00),
  (11, 'Ricardo Belmont',       NULL,                    3.00),
  (11, 'César Acuña',           'APP',                   3.00);

-- ------------------------------------------------------------
-- SERIE DATUM (Presencial, Urb+Rural, n=2000, ME ±2.2%, Confianza 95%)
-- ------------------------------------------------------------

-- Datum 13-17 mar 2026
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (2, '2026-03-13', '2026-03-17', 2000, 2.20, 95.0, 'nacional', 'presencial', 'intencion_voto', 'Datum 13-17mar 2026 via El Comercio/Cuarto Poder');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (12, 'Rafael López Aliaga',   'Renovación Popular', 11.70),
  (12, 'Keiko Fujimori',        'Fuerza Popular',     11.90),
  (12, 'Carlos Álvarez',        NULL,                   4.50),
  (12, 'Antauro Humala Sánchez', NULL,                  1.70),
  (12, 'Ricardo Belmont',       NULL,                   2.40);

-- Datum 25-27 mar 2026 (intención de voto)
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (2, '2026-03-25', '2026-03-27', 2000, 2.20, 95.0, 'nacional', 'presencial', 'intencion_voto', 'Datum 25-27mar 2026 intencion via El Comercio');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (13, 'Rafael López Aliaga',  'Renovación Popular', 11.70),
  (13, 'Keiko Fujimori',       'Fuerza Popular',     13.00);

-- Datum 25-27 mar 2026 (simulacro)
INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
VALUES (2, '2026-03-25', '2026-03-27', 2000, 2.20, 95.0, 'nacional', 'presencial', 'simulacro', 28.90, 'Datum 25-27mar 2026 simulacro via El Comercio');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (14, 'Rafael López Aliaga',   'Renovación Popular',  9.50),
  (14, 'Keiko Fujimori',        'Fuerza Popular',      13.20),
  (14, 'López Chau',            NULL,                    4.20),
  (14, 'Carlos Álvarez',        NULL,                    6.30),
  (14, 'Antauro Humala Sánchez', NULL,                   5.30),
  (14, 'Martín Nieto',          NULL,                    4.90),
  (14, 'Ricardo Belmont',       NULL,                    1.90);

-- ------------------------------------------------------------
-- CIT SIMULACRO (Presencial cédula réplica, n=1220, 20-23 mar)
-- ------------------------------------------------------------

INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, pct_blank_null, notes)
VALUES (5, '2026-03-20', '2026-03-23', 1220, 2.80, 95.0, 'nacional', 'presencial', 'simulacro', 22.50, 'CIT simulacro 20-23mar 2026 cédula réplica');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (15, 'Rafael López Aliaga',   'Renovación Popular', 16.80),
  (15, 'Keiko Fujimori',        'Fuerza Popular',     12.90),
  (15, 'López Chau',            NULL,                   7.00),
  (15, 'César Acuña',           'APP',                  6.30),
  (15, 'Carlos Álvarez',        NULL,                   6.10),
  (15, 'Wolfgang Grozo',        NULL,                   4.30),
  (15, 'Yonhy Lescano',         'Acción Popular',       3.60),
  (15, 'Martín Nieto',          NULL,                   3.00),
  (15, 'Antauro Humala Sánchez', NULL,                  2.30);

-- ------------------------------------------------------------
-- IEP INTENCIÓN (~30 mar 2026)
-- ------------------------------------------------------------

INSERT INTO polls (pollster_id, field_start, field_end, sample_n, margin_error, confidence_lvl, scope, technique, poll_type, notes)
VALUES (1, '2026-03-28', '2026-03-30', 1200, 2.80, 95.0, 'nacional', 'presencial', 'intencion_voto', 'IEP ~30mar 2026 via La República — campo exacto pendiente confirmar');

INSERT INTO poll_results (poll_id, candidate, party, pct_raw) VALUES
  (16, 'Rafael López Aliaga',   'Renovación Popular',  8.70),
  (16, 'Keiko Fujimori',        'Fuerza Popular',      10.00),
  (16, 'Carlos Álvarez',        NULL,                    6.90),
  (16, 'Antauro Humala Sánchez', NULL,                   6.70),
  (16, 'López Chau',            NULL,                    6.30),
  (16, 'Martín Nieto',          NULL,                    5.40),
  (16, 'Ricardo Belmont',       NULL,                    5.20),
  (16, 'Yonhy Lescano',         'Acción Popular',        2.20),
  (16, 'César Acuña',           'APP',                   2.20),
  (16, 'Wolfgang Grozo',        NULL,                    1.10),
  (16, 'Martín Vizcarra',       NULL,                    1.90);

-- ============================================================
-- POLYMARKET SNAPSHOTS HISTÓRICOS
-- ============================================================

INSERT INTO polymarket_snapshots (captured_at_lima, candidate, probability, volume_usd, phase) VALUES
  ('2026-02-15 12:00:00-05', 'Rafael López Aliaga',   47.50, 2000000, 'pre_veda'),
  ('2026-02-15 12:00:00-05', 'Keiko Fujimori',        14.00, 2000000, 'pre_veda'),
  ('2026-02-15 12:00:00-05', 'López Chau',            20.00, 2000000, 'pre_veda'),
  ('2026-02-15 12:00:00-05', 'Carlos Álvarez',         9.00, 2000000, 'pre_veda'),

  ('2026-03-24 12:00:00-05', 'Rafael López Aliaga',   40.00, 3990000, 'pre_veda'),
  ('2026-03-24 12:00:00-05', 'Antauro Humala Sánchez', 17.00, 3990000, 'pre_veda'),

  ('2026-04-02 21:53:00-05', 'Rafael López Aliaga',   30.00, 5100000, 'pre_veda'),
  ('2026-04-02 21:53:00-05', 'Keiko Fujimori',        19.00, 5100000, 'pre_veda'),
  ('2026-04-02 21:53:00-05', 'Carlos Álvarez',        16.30, 5100000, 'pre_veda'),
  ('2026-04-02 21:53:00-05', 'Antauro Humala Sánchez', 11.70, 5100000, 'pre_veda'),
  ('2026-04-02 21:53:00-05', 'López Chau',             8.00, 5100000, 'pre_veda'),
  ('2026-04-02 21:53:00-05', 'Martín Nieto',           6.00, 5100000, 'pre_veda');
