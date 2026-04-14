-- Logo rating system
-- Anonymous sessions (optional label), ratings 0-10, favorites, head-to-head comparisons

CREATE TABLE IF NOT EXISTS logo_rating_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logo_ratings (
  session_id UUID NOT NULL REFERENCES logo_rating_sessions(id) ON DELETE CASCADE,
  logo_id INTEGER NOT NULL CHECK (logo_id BETWEEN 1 AND 30),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, logo_id)
);

CREATE TABLE IF NOT EXISTS logo_comparisons (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES logo_rating_sessions(id) ON DELETE CASCADE,
  winner_logo_id INTEGER NOT NULL CHECK (winner_logo_id BETWEEN 1 AND 30),
  loser_logo_id INTEGER NOT NULL CHECK (loser_logo_id BETWEEN 1 AND 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (winner_logo_id != loser_logo_id)
);

CREATE INDEX IF NOT EXISTS idx_logo_ratings_logo ON logo_ratings(logo_id);
CREATE INDEX IF NOT EXISTS idx_logo_comparisons_winner ON logo_comparisons(winner_logo_id);
CREATE INDEX IF NOT EXISTS idx_logo_comparisons_loser ON logo_comparisons(loser_logo_id);
CREATE INDEX IF NOT EXISTS idx_logo_comparisons_session ON logo_comparisons(session_id);
