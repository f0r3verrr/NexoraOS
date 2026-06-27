import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { usePublicCinema } from '../hooks/useCinema.js';
import { supabase } from '../lib/supabase.js';

function usePublicProfile(userId) {
  return useQuery({
    queryKey: ['profile', 'public', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single();
      return data ?? null;
    },
    enabled: !!userId,
  });
}

const STATUS_ORDER = ['watching', 'watched', 'watchlist', 'waiting', 'dropped'];
const STATUS_META = {
  watching:  { label: 'Смотрю сейчас',    color: '#8b5cf6' },
  watched:   { label: 'Просмотрено',      color: '#34d399' },
  watchlist: { label: 'Хочу посмотреть',  color: '#60a5fa' },
  waiting:   { label: 'Жду новый сезон',  color: '#fbbf24' },
  dropped:   { label: 'Брошено',          color: '#9ca3af' },
};
const TYPE_LABEL = { movie: 'Фильм', series: 'Сериал', anime: 'Аниме', cartoon: 'Мультфильм', documentary: 'Документалка' };
const SERIES_TYPES = ['series', 'anime', 'cartoon', 'documentary'];

/* ── PublicPosterCard ──────────────────────────────────────── */
function PublicPosterCard({ entry, onOpen }) {
  const [hover, setHover] = useState(false);
  const isSeries = SERIES_TYPES.includes(entry.media_type);
  const hasEp = isSeries && (entry.season || entry.episode);
  const epLabel = hasEp ? `S${entry.season || 1}·E${String(entry.episode || 1).padStart(2, '0')}` : null;
  const genre0 = entry.genres?.[0] || '';

  return (
    <div
      onClick={() => onOpen(entry)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', aspectRatio: '2/3', borderRadius: 15, overflow: 'hidden',
        cursor: 'pointer',
        background: 'linear-gradient(150deg, oklch(0.26 0.04 285), oklch(0.16 0.015 285))',
        boxShadow: hover ? '0 26px 54px rgba(0,0,0,.66)' : '0 5px 20px rgba(0,0,0,.42)',
        border: '1px solid rgba(255,255,255,.05)',
        transform: hover ? 'translateY(-9px)' : 'translateY(0)',
        transition: 'transform .3s cubic-bezier(.34,1.4,.64,1), box-shadow .3s',
      }}
    >
      {entry.poster_url
        ? <img src={entry.poster_url} alt={entry.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 4v5M16 4v5M3 15h18"/></svg>
          </div>
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.10 0.004 80 / .96) 3%, oklch(0.10 0.004 80 / .32) 42%, transparent 66%)' }} />

      {/* episode badge */}
      {epLabel && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#c4b5fd', background: 'rgba(12,12,16,.6)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.08)' }}>{epLabel}</span>
        </div>
      )}

      {/* fav */}
      {entry.is_favorite && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 99, background: 'rgba(12,12,16,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(244,63,94,.3)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f43f5e" stroke="none"><path d="M12 20s-7-4.4-7-10a4.5 4.5 0 0 1 8.5-2A4.5 4.5 0 0 1 22 10c0 5.6-7 10-7 10"/></svg>
        </div>
      )}

      {/* bottom info */}
      <div style={{ position: 'absolute', left: 13, right: 13, bottom: 0, paddingBottom: 14 }}>
        {entry.my_rating != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#F5C518', marginBottom: 6 }}>★ {entry.my_rating}</span>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>{entry.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, fontSize: 11, color: 'oklch(0.62 0.007 80)' }}>
          {entry.year && <span>{entry.year}</span>}
          {entry.year && genre0 && <span style={{ width: 2, height: 2, borderRadius: 99, background: 'oklch(0.45 0.007 80)', flexShrink: 0 }} />}
          {genre0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{genre0}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── PublicDetailModal ─────────────────────────────────────── */
function PublicDetailModal({ entry, onClose }) {
  const [spoilerShown, setSpoilerShown] = useState(false);

  const isSeries = SERIES_TYPES.includes(entry.media_type);
  const meta     = STATUS_META[entry.status] || STATUS_META.watched;
  const hasEp    = isSeries && (entry.season || entry.episode);
  const epLabel  = hasEp ? `S${entry.season || 1}·E${String(entry.episode || 1).padStart(2, '0')}` : null;
  const pct      = entry.episodes_total && entry.episode ? Math.round(entry.episode / entry.episodes_total * 100) : null;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(6,6,10,.74)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }} onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', borderRadius: 22, background: 'oklch(0.17 0.006 80)', border: '1px solid oklch(0.28 0.007 80)', boxShadow: '0 40px 100px rgba(0,0,0,.7)' }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', height: 240, overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
            {(entry.backdrop_url || entry.poster_url)
              ? <img src={entry.backdrop_url || entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 28%' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(150deg, oklch(0.26 0.04 285), oklch(0.16 0.015 285))' }} />
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.17 0.006 80) 2%, oklch(0.17 0.006 80 / .3) 45%, transparent 80%)' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 99, background: 'rgba(8,8,12,.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,8,12,.9)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,8,12,.6)'}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
            <div style={{ position: 'absolute', left: 28, right: 28, bottom: 20, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
              {entry.poster_url && (
                <div style={{ width: 100, flexShrink: 0, aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,.6)', border: '2px solid rgba(255,255,255,.1)' }}>
                  <img src={entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 11px', borderRadius: 99, background: 'rgba(12,12,16,.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.1)', marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color, boxShadow: `0 0 7px ${meta.color}` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.88 0.006 80)' }}>{meta.label}</span>
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.1, textShadow: '0 2px 16px rgba(0,0,0,.6)', color: '#fff' }}>{entry.title}</h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18, fontSize: 13, color: 'oklch(0.66 0.007 80)' }}>
              {entry.year && <span>{entry.year}</span>}
              {entry.year && <span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} />}
              {entry.media_type && <span>{TYPE_LABEL[entry.media_type] || entry.media_type}</span>}
              {entry.countries?.length > 0 && <><span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} /><span>{entry.countries.slice(0, 2).join(', ')}</span></>}
            </div>

            {/* ratings */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {entry.my_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'rgba(245,197,24,.08)', border: '1px solid rgba(245,197,24,.22)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#F5C518' }}>{entry.my_rating}</span>
                    <span style={{ fontSize: 12, color: 'oklch(0.55 0.007 80)' }}>/10</span>
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>оценка куратора</div>
                </div>
              )}
              {entry.kp_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#FF9000' }}>{entry.kp_rating}</span>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>кинопоиск</div>
                </div>
              )}
              {entry.imdb_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#F5C518' }}>{entry.imdb_rating}</span>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>imdb</div>
                </div>
              )}
            </div>

            {/* series progress */}
            {epLabel && (
              <div style={{ padding: '14px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.86 0.006 80)' }}>Прогресс</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{epLabel}</span>
                </div>
                {pct != null && (
                  <div style={{ height: 5, borderRadius: 99, background: 'oklch(0.26 0.007 80)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${pct}%` }} />
                  </div>
                )}
              </div>
            )}

            {/* genres */}
            {entry.genres?.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
                {entry.genres.map(g => (
                  <span key={g} style={{ fontSize: 12, color: 'oklch(0.74 0.006 80)', background: 'oklch(0.21 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', padding: '5px 13px', borderRadius: 99 }}>{g}</span>
                ))}
              </div>
            )}

            {/* overview */}
            {entry.overview && (
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'oklch(0.78 0.006 80)', filter: (!spoilerShown && entry.status === 'watchlist') ? 'blur(7px)' : 'none', transition: 'filter 300ms' }}>
                  {entry.overview}
                </p>
                {!spoilerShown && entry.status === 'watchlist' && (
                  <button onClick={() => setSpoilerShown(true)} style={{ position: 'absolute', inset: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'oklch(0.86 0.006 80)', background: 'transparent', cursor: 'pointer', border: 'none', borderRadius: 6, fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    👁 Показать описание
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Public page ───────────────────────────────────────────── */
export default function CinemaPublic() {
  const { userId } = useParams();
  const { data: entries = [], isLoading, isError } = usePublicCinema(userId);
  const { data: profile } = usePublicProfile(userId);
  const [sel, setSel] = useState(null);

  const grouped = STATUS_ORDER
    .map(key => ({ key, items: entries.filter(e => e.status === key) }))
    .filter(g => g.items.length > 0);

  const watchedCount = entries.filter(e => e.status === 'watched').length;
  const favCount     = entries.filter(e => e.is_favorite).length;
  const ratedList    = entries.filter(e => e.my_rating != null);
  const avgRating    = ratedList.length
    ? (ratedList.reduce((s, e) => s + e.my_rating, 0) / ratedList.length).toFixed(1)
    : null;

  const pubStatCards = [
    { value: String(entries.length), unit: '', label: 'Всего записей', color: 'oklch(0.96 0.004 80)' },
    { value: String(watchedCount), unit: '', label: 'Просмотрено', color: '#34d399' },
    ...(avgRating ? [{ value: avgRating, unit: '/10', label: 'Средняя оценка', color: '#F5C518' }] : []),
    ...(favCount > 0 ? [{ value: String(favCount), unit: '', label: 'Любимое', color: '#f43f5e' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'oklch(0.135 0.005 80)', color: 'oklch(0.96 0.004 80)', fontFamily: "'Geist', system-ui, sans-serif", fontFeatureSettings: "'ss01'", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes nxFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-26px)} }
        @keyframes pub-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: oklch(0.30 0.008 80); border-radius: 99px; }
      `}</style>

      {sel && <PublicDetailModal entry={sel} onClose={() => setSel(null)} />}

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid oklch(0.22 0.007 80)', background: 'linear-gradient(150deg, oklch(0.18 0.02 285) 0%, oklch(0.145 0.01 300) 45%, oklch(0.135 0.005 250) 100%)' }}>
        {/* floating orbs */}
        <div style={{ position: 'absolute', top: -120, left: '8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,246,.22), transparent 68%)', animation: 'nxFloat 11s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.16), transparent 68%)', animation: 'nxFloat 14s ease-in-out infinite reverse', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '78px 40px 50px', position: 'relative' }}>
          {/* public badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 11px', borderRadius: 99, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: '#c4b5fd' }}>ПУБЛИЧНАЯ КОЛЛЕКЦИЯ</span>
          </div>

          {/* title */}
          <h1 style={{ fontSize: 60, fontWeight: 800, letterSpacing: '-.035em', lineHeight: .98, marginBottom: 18 }}>
            <span style={{ background: 'linear-gradient(115deg,#fff 30%,#c4b5fd)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Watchlist</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'oklch(0.70 0.007 80)', maxWidth: 540, marginBottom: 28 }}>
            Фильмы и сериалы из личной коллекции. Подборка обновляется регулярно.
          </p>

          {/* owner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 46, height: 46, borderRadius: 99, flexShrink: 0, objectFit: 'cover', border: '2px solid rgba(255,255,255,.12)', boxShadow: '0 6px 22px rgba(124,92,246,.35)' }} />
            ) : (
              <div style={{ width: 46, height: 46, borderRadius: 99, flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', boxShadow: '0 6px 22px rgba(124,92,246,.45)', border: '2px solid rgba(255,255,255,.12)' }}>
                {profile?.display_name ? profile.display_name[0].toUpperCase() : '?'}
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'oklch(0.92 0.004 80)' }}>{profile?.display_name || 'Пользователь'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'oklch(0.56 0.007 80)', marginTop: 2 }}>
                {avgRating && (
                  <>
                    <span style={{ color: '#F5C518', fontWeight: 600 }}>★ {avgRating}</span>
                    <span style={{ width: 2, height: 2, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} />
                  </>
                )}
                <span>{entries.length} тайтлов</span>
              </div>
            </div>
          </div>

          {/* stat cards */}
          {!isLoading && entries.length > 0 && (
            <div style={{ display: 'flex', gap: 14, marginTop: 38, flexWrap: 'wrap' }}>
              {pubStatCards.map(s => (
                <div key={s.label} style={{ flex: 1, minWidth: 150, padding: '18px 22px', borderRadius: 16, background: 'rgba(255,255,255,.05)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.09)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-.02em', color: s.color }}>{s.value}</span>
                    {s.unit && <span style={{ fontSize: 13, color: 'oklch(0.55 0.007 80)' }}>{s.unit}</span>}
                  </div>
                  <div style={{ fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase', color: 'oklch(0.60 0.007 80)', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '46px 40px 90px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} style={{ aspectRatio: '2/3', borderRadius: 15, background: 'oklch(0.20 0.006 80)', animation: `pub-pulse 1.4s ease-in-out ${i * 0.07}s infinite` }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'oklch(0.46 0.007 80)', fontSize: 15 }}>
            Не удалось загрузить коллекцию
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'oklch(0.46 0.007 80)', fontSize: 15 }}>
            Коллекция пока пустая
          </div>
        ) : (
          grouped.map(g => {
            const meta = STATUS_META[g.key];
            return (
              <section key={g.key} style={{ marginBottom: 52 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 22 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: meta.color, boxShadow: `0 0 10px ${meta.color}`, flexShrink: 0 }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'oklch(0.82 0.006 80)' }}>{meta.label}</h2>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'oklch(0.55 0.007 80)', background: 'oklch(0.20 0.007 80)', padding: '2px 9px', borderRadius: 99 }}>{g.items.length}</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, oklch(0.28 0.007 80), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {g.items.map(e => <PublicPosterCard key={e.id} entry={e} onOpen={setSel} />)}
                </div>
              </section>
            );
          })
        )}

        {/* footer */}
        <div style={{ textAlign: 'center', paddingTop: 30, borderTop: '1px solid oklch(0.20 0.007 80)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'oklch(0.46 0.007 80)', letterSpacing: '.04em' }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>N</span>
            Создано в Nexora OS
          </div>
        </div>
      </div>
    </div>
  );
}
