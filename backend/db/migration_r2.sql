-- Migration R2: Add election_round to preserve round 1 data non-destructively.
-- DEFAULT 1 automatically tags all existing data as round 1.
ALTER TABLE model_predictions ADD COLUMN IF NOT EXISTS election_round INT DEFAULT 1;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS election_round INT DEFAULT 1;
ALTER TABLE polymarket_snapshots ADD COLUMN IF NOT EXISTS election_round INT DEFAULT 1;
