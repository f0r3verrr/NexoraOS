const BASE = '/api/kinopoisk/v1.4';

function apiKey() { return import.meta.env.VITE_KINOPOISK_API_KEY || ''; }

const TYPE_MAP = {
  'movie':            'movie',
  'tv-series':        'series',
  'animated-series':  'series',
  'cartoon':          'cartoon',
  'anime':            'anime',
  'documentary':      'documentary',
};

const TYPE_LABEL = {
  'movie':       'Фильм',
  'series':      'Сериал',
  'cartoon':     'Мультфильм',
  'anime':       'Аниме',
  'documentary': 'Документалка',
};

function normalize(item) {
  const type = TYPE_MAP[item.type] || 'movie';
  return {
    id:            item.id,
    type,
    type_label:    TYPE_LABEL[type] || 'Фильм',
    name:          item.name || item.alternativeName || '',
    original_name: item.alternativeName || '',
    year:          item.year || null,
    poster_url:    item.poster?.url || null,
    thumb_url:     item.poster?.previewUrl || item.poster?.url || null,
    overview:      item.description || item.shortDescription || '',
    genres:        (item.genres || []).map(g => g.name),
    runtime:       item.movieLength || null,
    // Rich fields from full /movie/{id} response:
    kp_rating:     item.rating?.kp     ?? null,
    imdb_rating:   item.rating?.imdb   ?? null,
    actors:        (item.persons || [])
                     .filter(p => p.profession === 'actor')
                     .slice(0, 5)
                     .map(p => p.name || p.enName)
                     .filter(Boolean),
    director:      (item.persons || []).find(p => p.profession === 'director')?.name || null,
    backdrop_url:  item.backdrop?.url  ?? null,
    countries:     (item.countries || []).map(c => c.name),
    premiere_date: item.premiere?.russia ?? item.premiere?.world ?? null,
    seasons_total: item.seasonsInfo?.length ?? null,
  };
}

export async function searchMedia(query) {
  const key = apiKey();
  if (!query?.trim() || !key) return [];
  try {
    const res = await fetch(
      `${BASE}/movie/search?query=${encodeURIComponent(query)}&limit=8&page=1`,
      { headers: { 'X-API-KEY': key } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.docs || []).map(normalize);
  } catch {
    return [];
  }
}

export async function getDetails(kinopoiskId) {
  const key = apiKey();
  if (!key || !kinopoiskId) return null;
  try {
    const res = await fetch(`${BASE}/movie/${kinopoiskId}`, {
      headers: { 'X-API-KEY': key },
    });
    if (!res.ok) return null;
    return normalize(await res.json());
  } catch {
    return null;
  }
}
