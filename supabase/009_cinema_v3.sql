-- Watchlist v3: favorites, rewatch history, seasons total, watch service
ALTER TABLE cinema_entries
  ADD COLUMN IF NOT EXISTS is_favorite   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS watch_history jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seasons_total integer,
  ADD COLUMN IF NOT EXISTS watch_service text;
