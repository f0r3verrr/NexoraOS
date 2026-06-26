-- Cinema entries table
CREATE TABLE IF NOT EXISTS cinema_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  status         text not null default 'watchlist',
  media_type     text not null default 'movie',
  title          text not null,
  original_title text,
  tmdb_id        integer,
  poster_url     text,
  year           integer,
  genres         text[],
  runtime        integer,
  overview       text,
  my_rating      integer check (my_rating between 1 and 10),
  my_notes       text,
  is_public      boolean default true,
  watched_at     date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

ALTER TABLE cinema_entries ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "cinema_owner" ON cinema_entries
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can read public entries (for share links)
CREATE POLICY "cinema_public_read" ON cinema_entries
  FOR SELECT USING (is_public = true);
