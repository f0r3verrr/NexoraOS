-- Watchlist v2: new columns for rich API data + user personal fields
ALTER TABLE cinema_entries
  ADD COLUMN IF NOT EXISTS kp_rating      numeric(4,2),
  ADD COLUMN IF NOT EXISTS imdb_rating    numeric(4,2),
  ADD COLUMN IF NOT EXISTS actors         text[],
  ADD COLUMN IF NOT EXISTS director       text,
  ADD COLUMN IF NOT EXISTS backdrop_url   text,
  ADD COLUMN IF NOT EXISTS countries      text[],
  ADD COLUMN IF NOT EXISTS watch_url      text,
  ADD COLUMN IF NOT EXISTS watched_date   date,
  ADD COLUMN IF NOT EXISTS mood           integer CHECK (mood BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS quotes         text,
  ADD COLUMN IF NOT EXISTS season         integer,
  ADD COLUMN IF NOT EXISTS episode        integer,
  ADD COLUMN IF NOT EXISTS episodes_total integer;

-- Allow decimal ratings (e.g. 8.5/10)
ALTER TABLE cinema_entries
  ALTER COLUMN my_rating TYPE numeric(4,1);
ALTER TABLE cinema_entries
  DROP CONSTRAINT IF EXISTS cinema_entries_my_rating_check;
ALTER TABLE cinema_entries
  ADD CONSTRAINT cinema_entries_my_rating_check CHECK (my_rating BETWEEN 0 AND 10);
