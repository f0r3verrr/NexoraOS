# Nexora OS — Watchlist (Cinema) Redesign Spec

## Goal
Redesign 2 pages, premium dark cinematic glassmorphism. Keep existing platform colors.
1. **Library** (`Cinema.jsx`) — full interactive: filters, hovers, transitions, manage.
2. **Public** (`CinemaPublic.jsx`) — view-only shareable page.
One polished final each. Interactive prototype. Russian UI.
Future-proof: page will later hold books, games, courses, videos (not just films/series).

## Color tokens (from src/index.css — REUSE, do not invent)
- bg: oklch(0.155 0.005 80) warm near-black; elev-1..3: 0.185/0.215/0.245; hover 0.225; active 0.27
- borders: subtle 0.27 / 0.32 / strong 0.40 (chroma .007-.010 hue 80)
- text: 0.96 / text-2 0.78 / text-3 0.60 / muted 0.46 (hue 80)
- Accent palette (project colors): youmin purple oklch(0.74 0.13 295), openresto teal 0.78/0.11/195,
  diploma orange 0.76/0.14/35, sites blue 0.72/0.13/245, bots pink 0.78/0.13/350, family green 0.78/0.11/145,
  home amber 0.80/0.13/75, health 0.82/0.13/130
- Cinema's own accent in existing code: indigo #6366f1 → violet #8b5cf6 gradient
- Rating gold #F5C518 (my/imdb), КП orange #FF9000
- success 0.78/.13/150, warn 0.82/.13/75, danger 0.72/.17/25, info 0.72/.13/245
- radii r-2..6: 6/8/10/12/16, full 999. spacing 4/8/12/16/20/24/32/40
- Fonts: Geist (sans), Geist Mono. font-feature ss01,cv11

## Data model (cinema_entries)
id, title, poster_url, backdrop_url, year, media_type (movie|series|cartoon|anime|documentary),
status (watching|watched|watchlist|waiting|dropped), my_rating(0-10), kp_rating, imdb_rating,
genres[], runtime(min), director, actors[], countries[], season, episode, episodes_total, seasons_total,
is_favorite, is_public, my_notes, my_review, mood, watched_date, watch_service, watch_url, overview, premiere_date

## Status labels
- Library: watching=Смотрю, watched=Просмотрено, watchlist=Хочу посмотреть, waiting=Жду сезон, dropped=Брошено
- Public: watching=Смотрю сейчас, watched=Просмотрено, watchlist=Хочу посмотреть, waiting=Жду новый сезон, dropped=Брошено
- media_type labels: Фильм, Сериал, Мультфильм, Аниме, Документалка

## Existing features to keep/improve
- Continue Watching bar (series with season/episode, progress %)
- Poster grid cards: rating/progress badge, fav heart, genre pill, SxxExx, KP rating fallback
- Detail modal: backdrop blur hero, ratings (my/kp/imdb), series progress bar, viewing info, overview w/ spoiler-blur for watchlist
- Public: hero w/ glow orbs, stats (total/watched/avg rating), sections by status, poster grid
- watch_service (SERVICES), mood, favorites

## Redesign direction (dark cinematic glassmorphism, premium)
- Library: cinematic hero featuring a "now watching" backdrop; glass filter/sort toolbar (sticky);
  segmented status tabs + media-type filter (incl. future categories tabs: Кино/Книги/Игры/Курсы/Видео — kino active, others "soon");
  stats strip; refined poster grid with glass overlays; continue-watching rail; detail modal.
- Public: refined hero, glass stat cards, status sections, premium poster cards, share/owner identity, view-only.
- Use sample data (seed ~12-16 entries with poster placeholders / real-ish titles) since no live Supabase.
- Build as ONE Nexora-Watchlist.dc.html with an internal tab switcher Library<->Public (or two screens).

## Files imported
src/index.css, src/screens/Cinema.jsx (88KB, full ref), src/screens/CinemaPublic.jsx, src/hooks/useCinema.js, src/lib/tmdb.js, src/icons.jsx, src/components/primitives.jsx
