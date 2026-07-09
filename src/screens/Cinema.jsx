import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { SpinInput } from '../components/primitives.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCinema, useCreateCinemaEntry, useUpdateCinemaEntry, useDeleteCinemaEntry } from '../hooks/useCinema.js';
import { searchMedia, getDetails } from '../lib/tmdb.js';

/* ─── constants ─────────────────────────────────────────────── */
const STATUSES = [
  { key: 'watching',  label: 'Смотрю',           color: '#8b5cf6' },
  { key: 'watched',   label: 'Просмотрено',       color: '#34d399' },
  { key: 'watchlist', label: 'Хочу посмотреть',   color: '#60a5fa' },
  { key: 'waiting',   label: 'Жду сезон',         color: '#fbbf24' },
  { key: 'dropped',   label: 'Брошено',           color: '#9ca3af' },
];
const STATUS_META = {
  watching:  { label: 'Смотрю',          color: '#8b5cf6' },
  watched:   { label: 'Просмотрено',     color: '#34d399' },
  watchlist: { label: 'Хочу посмотреть', color: '#60a5fa' },
  waiting:   { label: 'Жду сезон',       color: '#fbbf24' },
  dropped:   { label: 'Брошено',         color: '#9ca3af' },
};
const TYPE_LABEL = { movie: 'Фильм', series: 'Сериал', anime: 'Аниме', cartoon: 'Мультфильм', documentary: 'Документалка' };
const MEDIA_TYPES = [
  { key: '',            label: 'Все типы' },
  { key: 'movie',       label: 'Фильмы' },
  { key: 'series',      label: 'Сериалы' },
  { key: 'anime',       label: 'Аниме' },
  { key: 'cartoon',     label: 'Мультфильмы' },
];
const MOOD_LABEL = ['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Восторг'];
const MOOD_COLOR = ['', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];
const SERIES_TYPES = ['series', 'anime', 'cartoon', 'documentary'];
const SERVICES = [
  { key: 'Netflix',      color: '#E50914' },
  { key: 'Кинопоиск',   color: '#FF6B00' },
  { key: 'Prime Video', color: '#00A8E0' },
  { key: 'Disney+',     color: '#0063E5' },
  { key: 'YouTube',     color: '#FF0000' },
  { key: 'Apple TV+',   color: '#555555' },
  { key: 'Иви',         color: '#CC2200' },
  { key: 'Окко',        color: '#E06020' },
  { key: 'Другое',      color: 'var(--text-muted)' },
];

const CAT_TABS = [
  { key: 'cinema', label: 'Кино', soon: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 4v5M16 4v5M3 15h18"/></svg> },
  { key: 'books',  label: 'Книги', soon: true, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M19 17H6a2 2 0 0 0-2 2"/></svg> },
  { key: 'games',  label: 'Игры', soon: true, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01"/></svg> },
  { key: 'courses', label: 'Курсы', soon: true, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4 2 9l10 5 10-5z"/><path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5"/></svg> },
  { key: 'videos', label: 'Видео', soon: true, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg> },
];

/* ─── shared styles ─────────────────────────────────────────── */
const labelSx = {
  fontSize: 11, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 5,
};
const inputSx = {
  width: '100%', height: 36, padding: '0 10px',
  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box',
};

/* ─── Stepper ───────────────────────────────────────────────── */
function Stepper({ value, onChange, min = 0, placeholder = '–' }) {
  const n = value === '' || value == null ? '' : Number(value);
  const dec = () => { if (n !== '' && Number(n) > min) onChange(Number(n) - 1); };
  const inc = () => onChange(n === '' ? (min || 1) : Number(n) + 1);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', height: 36, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', borderRadius: 8, overflow: 'hidden', userSelect: 'none' }}>
      <button type="button" onClick={dec} style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRight: '1px solid oklch(0.28 0.007 80)', color: 'oklch(0.58 0.007 80)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0 }}>−</button>
      <input
        type="text"
        inputMode="numeric"
        value={n}
        placeholder={placeholder}
        onChange={e => {
          const raw = e.target.value.replace(/\D/g, '');
          onChange(raw === '' ? '' : Number(raw));
        }}
        style={{ width: 40, background: 'transparent', border: 'none', textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)', outline: 'none', boxShadow: 'none', WebkitAppearance: 'none', padding: 0 }}
      />
      <button type="button" onClick={inc} style={{ width: 32, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderLeft: '1px solid oklch(0.28 0.007 80)', color: 'oklch(0.58 0.007 80)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0 }}>+</button>
    </div>
  );
}

/* ─── HeartIcon ─────────────────────────────────────────────── */
function HeartIcon({ size = 16, filled = false, color }) {
  const col = color || (filled ? '#f43f5e' : 'rgba(255,255,255,0.6)');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? col : 'none'} stroke={filled ? 'none' : col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ─── NumberRating ──────────────────────────────────────────── */
function NumberRating({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n >= 0 && n <= 10) onChange(Math.round(n * 2) / 2);
    else if (draft === '') onChange(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <input autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{ width: 72, height: 38, fontSize: 20, fontWeight: 800, textAlign: 'center', background: 'var(--bg-elev-2)', border: '1px solid rgba(139,92,246,.5)', borderRadius: 8, color: '#F5C518', fontFamily: 'var(--font-mono)', outline: 'none' }}
      />
    );
  }
  return (
    <button
      onClick={() => { setDraft(value != null ? String(value) : ''); setEditing(true); }}
      title="Нажми, чтобы изменить"
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, border: '1px dashed var(--border-subtle)', transition: 'border-color 120ms' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,197,24,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <span style={{ fontSize: 22, fontWeight: 800, color: value != null ? '#F5C518' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {value != null ? value : '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/10</span>
    </button>
  );
}

/* ─── PosterCard ────────────────────────────────────────────── */
function PosterCard({ entry, onOpen, onEdit, onDelete, onToggleFav }) {
  const [hover, setHover] = useState(false);
  const [isFav, setIsFav] = useState(entry.is_favorite);
  useEffect(() => setIsFav(entry.is_favorite), [entry.is_favorite]);
  const isSeries = SERIES_TYPES.includes(entry.media_type);
  const hasEp = isSeries && (entry.season || entry.episode);
  const pct = entry.episodes_total && entry.episode ? Math.round(entry.episode / entry.episodes_total * 100) : null;
  const meta = STATUS_META[entry.status] || STATUS_META.watched;
  const myStr = entry.my_rating != null ? String(entry.my_rating) : null;
  const kpOnly = entry.my_rating == null && entry.kp_rating != null;
  const epLabel = hasEp ? `S${entry.season || 1}·E${String(entry.episode || 1).padStart(2, '0')}` : null;
  const genre0 = entry.genres?.[0] || '';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(entry)}
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
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="film" size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} /></div>
      }

      {/* dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.10 0.004 80 / .96) 3%, oklch(0.10 0.004 80 / .35) 40%, transparent 64%)' }} />

      {/* status dot */}
      <div style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'rgba(12,12,16,.62)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.08)' }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color, boxShadow: `0 0 7px ${meta.color}`, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(0.86 0.006 80)' }}>{meta.label}</span>
      </div>

      {/* fav — always in DOM, z-index above hover overlay */}
      <button
        onClick={e => { e.stopPropagation(); setIsFav(v => !v); onToggleFav(entry); }}
        style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 99, background: 'rgba(12,12,16,.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isFav ? 'rgba(244,63,94,.5)' : 'rgba(255,255,255,.15)'}`, cursor: 'pointer', padding: 0, lineHeight: 0, transition: 'opacity .15s, border-color .15s', zIndex: 2, opacity: isFav || hover ? 1 : 0 }}
      >
        <HeartIcon size={13} filled={isFav} />
      </button>

      {/* bottom info */}
      <div style={{ position: 'absolute', left: 13, right: 13, bottom: 0, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
          {myStr && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#F5C518' }}>★ {myStr}</span>}
          {kpOnly && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#FF9000' }}><span style={{ fontSize: 9, color: 'oklch(0.7 0.006 80)' }}>КП</span>{entry.kp_rating}</span>}
          {epLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#c4b5fd', background: 'rgba(139,92,246,.2)', padding: '2px 7px', borderRadius: 6 }}>{epLabel}</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>{entry.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, fontSize: 11, color: 'oklch(0.62 0.007 80)' }}>
          {entry.year && <span>{entry.year}</span>}
          {entry.year && genre0 && <span style={{ width: 2, height: 2, borderRadius: 99, background: 'oklch(0.45 0.007 80)', flexShrink: 0 }} />}
          {genre0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{genre0}</span>}
        </div>
      </div>

      {/* progress bar */}
      {pct != null && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,.4)' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${pct}%` }} />
        </div>
      )}

      {/* hover actions */}
      {hover && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 10px 44px' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={e => { e.stopPropagation(); onEdit(entry); }} style={{ height: 28, padding: '0 10px', borderRadius: 7, background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.1)', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.26)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.16)'}>
              Изменить
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(entry.id); }} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(220,38,38,.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', border: '1px solid rgba(244,63,94,.2)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.6)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,.3)'}>
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ContinueWatchingRail ──────────────────────────────────── */
function ContinueWatchingRail({ entries, onOpen }) {
  const watching = entries.filter(e => e.status === 'watching' && (e.season || e.episode));
  if (!watching.length) return null;

  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'oklch(0.56 0.007 80)', marginBottom: 13 }}>Продолжить смотреть</div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
        <style>{`.nxcw::-webkit-scrollbar{display:none}`}</style>
        {watching.map(entry => {
          const pct = entry.episodes_total && entry.episode ? Math.round(entry.episode / entry.episodes_total * 100) : null;
          const epLabel = `S${entry.season || 1}·E${String(entry.episode || 1).padStart(2, '0')}`;
          const epLeft = entry.episodes_total && entry.episode != null ? `${Math.max(entry.episodes_total - entry.episode, 0)} эп.` : '';
          return (
            <div
              key={entry.id}
              onClick={() => onOpen(entry)}
              style={{ flexShrink: 0, width: 260, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'oklch(0.18 0.006 80)', border: '1px solid oklch(0.24 0.007 80)', transition: 'transform .22s, box-shadow .22s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                {(entry.backdrop_url || entry.poster_url)
                  ? <img src={entry.backdrop_url || entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.78)' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(150deg, oklch(0.26 0.04 285), oklch(0.16 0.015 285))' }} />
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.18 0.006 80) 2%, transparent 60%)' }} />
                <div style={{ position: 'absolute', top: 9, right: 9, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(139,92,246,.92)', padding: '3px 9px', borderRadius: 7 }}>{epLabel}</div>
                <div style={{ position: 'absolute', left: 14, bottom: 10, right: 14, fontSize: 14, fontWeight: 600, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</div>
              </div>
              <div style={{ height: 4, background: 'oklch(0.24 0.007 80)' }}>
                {pct != null && <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${pct}%` }} />}
              </div>
              <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'oklch(0.58 0.007 80)' }}>осталось {epLeft}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#a78bfa"><path d="M8 5v14l11-7z"/></svg>далее
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CinemaDetailModal ─────────────────────────────────────── */
function CinemaDetailModal({ entry, onEdit, onDelete, onClose, onToggleFav, onUpdate }) {
  const [spoilerShown, setSpoilerShown] = useState(false);
  const [rewatchOpen, setRewatchOpen]   = useState(false);
  const [rwDate, setRwDate]             = useState(new Date().toISOString().substring(0, 10));
  const [rwMood, setRwMood]             = useState(null);
  const [localSeason, setLocalSeason]   = useState(entry.season || 1);
  const [localEp, setLocalEp]           = useState(entry.episode || 1);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const isSeries  = SERIES_TYPES.includes(entry.media_type);
  const meta      = STATUS_META[entry.status] || STATUS_META.watched;
  const hasEp     = isSeries && (entry.season || entry.episode);
  const epLabel   = hasEp ? `S${entry.season || 1}·E${String(entry.episode || 1).padStart(2, '0')}` : null;
  const pct       = entry.episodes_total && entry.episode ? Math.round(entry.episode / entry.episodes_total * 100) : null;
  const history   = Array.isArray(entry.watch_history) ? entry.watch_history : [];
  const service   = entry.watch_service ? SERVICES.find(s => s.key === entry.watch_service) : null;
  const infoItems = [
    entry.director && { label: 'Режиссёр', value: entry.director },
    entry.watch_service && { label: 'Где смотрел', value: entry.watch_service },
    entry.countries?.length && { label: 'Страна', value: entry.countries.slice(0, 2).join(', ') },
    (isSeries && entry.seasons_total) && { label: 'Сезонов', value: String(entry.seasons_total) },
    entry.runtime && { label: 'Длительность', value: `${Math.floor(entry.runtime / 60)} ч ${entry.runtime % 60} мин` },
  ].filter(Boolean);

  const addRewatch = () => {
    const newHistory = [...history, { date: rwDate, mood: rwMood }];
    onUpdate({ watch_history: newHistory });
    setRewatchOpen(false);
    setRwMood(null);
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(6,6,10,.74)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }} onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', borderRadius: 22, background: 'oklch(0.17 0.006 80)', border: '1px solid oklch(0.28 0.007 80)', boxShadow: '0 40px 100px rgba(0,0,0,.7)' }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', height: 260, overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
            {(entry.backdrop_url || entry.poster_url)
              ? <img src={entry.backdrop_url || entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 28%' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(150deg, oklch(0.26 0.04 285), oklch(0.16 0.015 285))' }} />
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.17 0.006 80) 2%, oklch(0.17 0.006 80 / .35) 45%, transparent 80%)' }} />

            {/* close */}
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 99, background: 'rgba(8,8,12,.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,8,12,.9)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,8,12,.6)'}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>

            {/* fav */}
            <button onClick={onToggleFav} style={{ position: 'absolute', top: 16, right: 60, width: 36, height: 36, borderRadius: 99, background: 'rgba(8,8,12,.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244,63,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
              <HeartIcon size={15} filled={entry.is_favorite} />
            </button>

            {/* poster + title */}
            <div style={{ position: 'absolute', left: 28, right: 28, bottom: 20, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
              {entry.poster_url && (
                <div style={{ width: 110, flexShrink: 0, aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 34px rgba(0,0,0,.6)', border: '2px solid rgba(255,255,255,.1)' }}>
                  <img src={entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 11px', borderRadius: 99, background: 'rgba(12,12,16,.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.1)', marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color, boxShadow: `0 0 7px ${meta.color}` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.88 0.006 80)' }}>{meta.label}</span>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.08, textShadow: '0 2px 16px rgba(0,0,0,.6)', color: '#fff' }}>{entry.title}</h2>
                {entry.original_title && entry.original_title !== entry.title && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 3 }}>{entry.original_title}</div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '22px 28px 30px' }}>
            {/* meta line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20, fontSize: 13, color: 'oklch(0.66 0.007 80)' }}>
              {entry.year && <span>{entry.year}</span>}
              {entry.year && <span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} />}
              {entry.media_type && <span>{TYPE_LABEL[entry.media_type] || entry.media_type}</span>}
              {entry.runtime && <><span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} /><span>{Math.floor(entry.runtime / 60)} ч {entry.runtime % 60} мин</span></>}
              {entry.countries?.length > 0 && <><span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.42 0.007 80)' }} /><span>{entry.countries.slice(0, 2).join(', ')}</span></>}
            </div>

            {/* ratings */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
              {entry.my_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'rgba(245,197,24,.08)', border: '1px solid rgba(245,197,24,.22)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F5C518' }}>{entry.my_rating}</span>
                    <span style={{ fontSize: 12, color: 'oklch(0.55 0.007 80)' }}>/10</span>
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>моя оценка</div>
                </div>
              )}
              {entry.kp_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FF9000' }}>{entry.kp_rating}</span>
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>кинопоиск</div>
                </div>
              )}
              {entry.imdb_rating != null && (
                <div style={{ padding: '12px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F5C518' }}>{entry.imdb_rating}</span>
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>imdb</div>
                </div>
              )}
            </div>

            {/* series progress — interactive */}
            {isSeries && (
              <div style={{ padding: '16px 18px', borderRadius: 13, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.86 0.006 80)' }}>Прогресс просмотра</span>
                  <button
                    onClick={() => {
                      const nextEp = (localEp || 0) + 1;
                      const nextSeason = entry.episodes_total && nextEp > entry.episodes_total ? localSeason + 1 : localSeason;
                      const finalEp = entry.episodes_total && nextEp > entry.episodes_total ? 1 : nextEp;
                      setLocalEp(finalEp);
                      setLocalSeason(nextSeason);
                      onUpdate({ episode: finalEp, season: nextSeason });
                    }}
                    style={{ height: 28, padding: '0 12px', borderRadius: 7, background: 'rgba(139,92,246,.18)', border: '1px solid rgba(139,92,246,.35)', color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,.18)'}
                  >+ Серия</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'oklch(0.62 0.007 80)', width: 40 }}>Сезон</span>
                    <Stepper value={localSeason} onChange={v => { setLocalSeason(Number(v) || 1); onUpdate({ season: Number(v) || 1, episode: localEp }); }} min={1} placeholder="1" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'oklch(0.62 0.007 80)', width: 36 }}>Серия</span>
                    <Stepper value={localEp} onChange={v => { setLocalEp(Number(v) || 0); onUpdate({ episode: Number(v) || 0, season: localSeason }); }} min={0} placeholder="1" />
                    {entry.episodes_total && <span style={{ fontSize: 12, color: 'oklch(0.46 0.007 80)' }}>/ {entry.episodes_total}</span>}
                  </div>
                </div>
                {entry.episodes_total && localEp ? (
                  <>
                    <div style={{ height: 6, borderRadius: 99, background: 'oklch(0.26 0.007 80)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${Math.min(100, Math.round(localEp / entry.episodes_total * 100))}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'oklch(0.56 0.007 80)' }}>
                      <span>{localEp} из {entry.episodes_total} эпизодов</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.min(100, Math.round(localEp / entry.episodes_total * 100))}%</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 6, borderRadius: 99, background: 'oklch(0.26 0.007 80)' }} />
                )}
              </div>
            )}

            {/* genres */}
            {entry.genres?.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
                {entry.genres.map(g => (
                  <span key={g} style={{ fontSize: 12, color: 'oklch(0.74 0.006 80)', background: 'oklch(0.21 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', padding: '5px 13px', borderRadius: 99 }}>{g}</span>
                ))}
              </div>
            )}

            {/* overview */}
            {entry.overview && (
              <div style={{ position: 'relative', marginBottom: 22 }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'oklch(0.78 0.006 80)', filter: (!spoilerShown && entry.status === 'watchlist') ? 'blur(7px)' : 'none', transition: 'filter 300ms' }}>
                  {entry.overview}
                </p>
                {!spoilerShown && entry.status === 'watchlist' && (
                  <button onClick={() => setSpoilerShown(true)} style={{ position: 'absolute', inset: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'oklch(0.86 0.006 80)', background: 'transparent', cursor: 'pointer', border: 'none', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon name="eye" size={14} /> Показать описание
                  </button>
                )}
              </div>
            )}

            {/* viewing info grid */}
            {infoItems.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 1, background: 'oklch(0.26 0.007 80)', border: '1px solid oklch(0.26 0.007 80)', borderRadius: 13, overflow: 'hidden', marginBottom: 22 }}>
                {infoItems.map(item => (
                  <div key={item.label} style={{ padding: '13px 16px', background: 'oklch(0.18 0.006 80)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.54 0.007 80)', marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'oklch(0.88 0.006 80)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* actors */}
            {entry.actors?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: 'oklch(0.54 0.007 80)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>В ролях</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {entry.actors.map(a => <span key={a} style={{ fontSize: 12, color: 'oklch(0.74 0.006 80)', background: 'oklch(0.21 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', padding: '4px 11px', borderRadius: 99 }}>{a}</span>)}
                </div>
              </div>
            )}

            {/* notes */}
            {entry.my_notes && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: 'oklch(0.54 0.007 80)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Заметки</div>
                <div style={{ fontSize: 13, color: 'oklch(0.78 0.006 80)', lineHeight: 1.65, background: 'oklch(0.20 0.007 80)', padding: '12px 14px', borderRadius: 10, border: '1px solid oklch(0.28 0.007 80)' }}>{entry.my_notes}</div>
              </div>
            )}

            {/* watch service link */}
            {(entry.watch_service || entry.watch_url) && (
              <div style={{ marginBottom: 18 }}>
                {entry.watch_url ? (
                  <a href={entry.watch_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', textDecoration: 'none', background: service?.color ?? '#6366f1', padding: '6px 14px', borderRadius: 20, fontWeight: 500 }}>
                    <Icon name="link" size={11} />{entry.watch_service || 'Смотреть'}
                  </a>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', background: service?.color ?? '#6366f1', padding: '6px 14px', borderRadius: 20, fontWeight: 500 }}>
                    {entry.watch_service}
                  </span>
                )}
              </div>
            )}

            {/* rewatch history */}
            {(history.length > 0 || entry.status === 'watched') && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: 'oklch(0.54 0.007 80)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    История просмотров {history.length > 0 && `(${history.length})`}
                  </div>
                  <button onClick={() => setRewatchOpen(v => !v)} style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(139,92,246,.1)', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid rgba(139,92,246,.2)', fontFamily: 'inherit' }}>
                    + Пересмотрел
                  </button>
                </div>
                {rewatchOpen && (
                  <div style={{ background: 'oklch(0.20 0.007 80)', borderRadius: 10, padding: 12, border: '1px solid oklch(0.28 0.007 80)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label style={{ ...labelSx, marginBottom: 4 }}>Дата</label>
                        <DatePicker value={rwDate} onChange={setRwDate} background="var(--bg-elev-2)" />
                      </div>
                      <div>
                        <label style={{ ...labelSx, marginBottom: 4 }}>Настроение</label>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1,2,3,4,5].map(v => (
                            <button key={v} onClick={() => setRwMood(rwMood === v ? null : v)} style={{ padding: '3px 7px', borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: 'pointer', color: MOOD_COLOR[v], background: rwMood === v ? `${MOOD_COLOR[v]}22` : 'transparent', border: rwMood === v ? `1px solid ${MOOD_COLOR[v]}55` : '1px solid oklch(0.28 0.007 80)', transition: 'all 80ms', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                              {MOOD_LABEL[v]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={addRewatch} style={{ height: 32, padding: '0 14px', borderRadius: 8, background: '#fff', color: 'oklch(0.14 0.005 80)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Добавить
                      </button>
                    </div>
                  </div>
                )}
                {history.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[...history].reverse().map((w, i) => {
                      const realIdx = history.length - 1 - i;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'oklch(0.20 0.007 80)', borderRadius: 7, border: '1px solid oklch(0.28 0.007 80)' }}>
                          <span style={{ fontSize: 12, color: 'oklch(0.66 0.007 80)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                            {w.date ? new Date(w.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Дата не указана'}
                          </span>
                          {w.mood && <span style={{ fontSize: 10, fontWeight: 600, color: MOOD_COLOR[w.mood], background: `${MOOD_COLOR[w.mood]}22`, padding: '1px 6px', borderRadius: 20 }}>{MOOD_LABEL[w.mood]}</span>}
                          <span style={{ fontSize: 10, color: 'oklch(0.48 0.007 80)' }}>#{i + 1}</span>
                          <button
                            onClick={() => onUpdate({ watch_history: history.filter((_, idx) => idx !== realIdx) })}
                            style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'oklch(0.48 0.007 80)', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.background = 'rgba(244,63,94,.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'oklch(0.48 0.007 80)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Удалить запись"
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* footer actions */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 18, borderTop: '1px solid oklch(0.24 0.007 80)', marginTop: 8, alignItems: 'center' }}>
              <button onClick={() => { onDelete(); onClose(); }} style={{ height: 38, padding: '0 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(244,63,94,.1)', color: '#f43f5e', fontSize: 13, cursor: 'pointer', border: '1px solid rgba(244,63,94,.2)', fontFamily: 'inherit' }}>
                <Icon name="trash" size={13} />Удалить
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onEdit} style={{ height: 38, padding: '0 18px', borderRadius: 10, background: '#fff', color: 'oklch(0.14 0.005 80)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Icon name="edit" size={13} />Редактировать
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── AddMovieModal ──────────────────────────────────────────── */
function AddMovieModal({ entry, defaultStatus, onClose, onSave }) {
  const isEdit = !!entry;

  const [title, setTitle]               = useState(entry?.title || '');
  const [origTitle, setOrigTitle]       = useState(entry?.original_title || '');
  const [status, setStatus]             = useState(entry?.status || defaultStatus || 'watchlist');
  const [mediaType, setMediaType]       = useState(entry?.media_type || 'movie');
  const [year, setYear]                 = useState(entry?.year || '');
  const [rating, setRating]             = useState(entry?.my_rating ?? null);
  const [notes, setNotes]               = useState(entry?.my_notes || '');
  const [poster, setPoster]             = useState(entry?.poster_url || '');
  const [tmdbId, setTmdbId]             = useState(entry?.tmdb_id || null);
  const [genres, setGenres]             = useState(entry?.genres || []);
  const [overview, setOverview]         = useState(entry?.overview || '');
  const [isPublic, setIsPublic]         = useState(entry?.is_public ?? true);
  const [isFav, setIsFav]               = useState(entry?.is_favorite ?? false);
  const [saving, setSaving]             = useState(false);
  const [fetchingDet, setFetchingDet]   = useState(false);

  const [kpRating, setKpRating]         = useState(entry?.kp_rating ?? null);
  const [imdbRating, setImdbRating]     = useState(entry?.imdb_rating ?? null);
  const [actors, setActors]             = useState(entry?.actors || []);
  const [director, setDirector]         = useState(entry?.director || '');
  const [backdrop, setBackdrop]         = useState(entry?.backdrop_url || '');
  const [countries, setCountries]       = useState(entry?.countries || []);
  const [seasonsTotal, setSeasonsTotal] = useState(entry?.seasons_total || '');

  const [watchService, setWatchService] = useState(entry?.watch_service || '');
  const [watchUrl, setWatchUrl]         = useState(entry?.watch_url || '');
  const [watchedDate, setWatchedDate]   = useState(entry?.watched_date || '');
  const [mood, setMood]                 = useState(entry?.mood ?? null);
  const [quotes, setQuotes]             = useState(entry?.quotes || '');

  const [season, setSeason]             = useState(entry?.season || '');
  const [episode, setEpisode]           = useState(entry?.episode || '');
  const [epsTotal, setEpsTotal]         = useState(entry?.episodes_total || '');

  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [searching, setSearching]       = useState(false);
  const [showResults, setShowResults]   = useState(false);
  const timerRef = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchMedia(q);
      setResults(res);
      setShowResults(res.length > 0);
      setSearching(false);
    }, 400);
  };

  const handleSelect = async (item) => {
    setTitle(item.name || '');
    setOrigTitle(item.original_name || '');
    setYear(item.year || '');
    setPoster(item.poster_url || '');
    setTmdbId(item.id);
    setOverview(item.overview || '');
    setMediaType(item.type || 'movie');
    setGenres(item.genres || []);
    setQuery('');
    setShowResults(false);
    setFetchingDet(true);
    const d = await getDetails(item.id);
    if (d) {
      if (d.kp_rating   != null) setKpRating(d.kp_rating);
      if (d.imdb_rating != null) setImdbRating(d.imdb_rating);
      if (d.actors?.length)      setActors(d.actors);
      if (d.director)            setDirector(d.director);
      if (d.backdrop_url)        setBackdrop(d.backdrop_url);
      if (d.countries?.length)   setCountries(d.countries);
      if (d.seasons_total)       setSeasonsTotal(d.seasons_total);
      if (d.overview && !item.overview) setOverview(d.overview);
    }
    setFetchingDet(false);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(), original_title: origTitle || null, status, media_type: mediaType,
        year: year ? parseInt(year) : null, my_rating: rating, my_notes: notes || null,
        poster_url: poster || null, tmdb_id: tmdbId, genres: genres.length ? genres : null,
        overview: overview || null, is_public: isPublic, is_favorite: isFav,
        kp_rating: kpRating, imdb_rating: imdbRating,
        actors: actors.length ? actors : null, director: director || null,
        backdrop_url: backdrop || null, countries: countries.length ? countries : null,
        seasons_total: seasonsTotal ? parseInt(seasonsTotal) : null,
        watch_service: watchService || null, watch_url: watchUrl || null,
        watched_date: watchedDate || null, mood, quotes: quotes || null,
        season: season ? parseInt(season) : null,
        episode: episode ? parseInt(episode) : null,
        episodes_total: epsTotal ? parseInt(epsTotal) : null,
      });
    } finally { setSaving(false); }
  };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const isSeries    = SERIES_TYPES.includes(mediaType);
  const isWatchlist = status === 'watchlist';

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 401 }}>
        <div style={{ width: 540, maxHeight: '90vh', background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <style>{`@keyframes cin-spin{to{transform:rotate(360deg)}}`}</style>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать' : 'Добавить фильм'}</span>
            {fetchingDet && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}><div style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: '#8b5cf6', borderRadius: 999, animation: 'cin-spin 0.7s linear infinite' }} />Загружаю…</div>}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', border: 'none' }}><Icon name="x" size={16} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!isEdit && (
              <div style={{ position: 'relative' }}>
                <label style={labelSx}>Поиск фильма или сериала</label>
                <div style={{ position: 'relative' }}>
                  <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Начни вводить название…" style={{ ...inputSx, paddingLeft: 32 }} />
                  {searching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: '#8b5cf6', borderRadius: 999, animation: 'cin-spin 0.7s linear infinite' }} /></div>}
                </div>
                {showResults && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.35)', maxHeight: 260, overflowY: 'auto' }}>
                    {results.map(item => (
                      <button key={item.id} onClick={() => handleSelect(item)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: 'transparent', textAlign: 'left', cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                        {item.thumb_url ? <img src={item.thumb_url} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} /> : <div style={{ width: 32, height: 48, borderRadius: 4, background: 'var(--bg-elev-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="film" size={14} style={{ color: 'var(--text-muted)' }} /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', gap: 6 }}>
                            <span>{item.type_label}</span>
                            {item.year && <span>· {item.year}</span>}
                            {item.kp_rating && <span style={{ color: '#FF6B00' }}>★ {item.kp_rating}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 80, height: 120, flexShrink: 0, borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {poster ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="film" size={24} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={labelSx}>Название *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название фильма…" style={inputSx} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelSx}>Год</label>
                    <SpinInput value={year} onChange={setYear} placeholder="2024" min={1900} style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)' }} />
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2, paddingRight: 2 }}>
                    <button onClick={() => setIsFav(v => !v)} title={isFav ? 'Убрать из избранного' : 'В избранное'} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isFav ? 'rgba(244,63,94,0.15)' : 'var(--bg-elev-2)', border: isFav ? '1px solid rgba(244,63,94,0.3)' : '1px solid var(--border-subtle)', cursor: 'pointer', color: isFav ? '#F43F5E' : 'var(--text-muted)', transition: 'all 120ms' }}>
                      <Icon name={isFav ? 'heart_filled' : 'heart'} size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(kpRating != null || imdbRating != null || director || actors.length > 0) && (
              <div style={{ background: 'var(--bg-elev-2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: actors.length ? 8 : 0 }}>
                  {kpRating != null && <span style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600 }}>★ КП {kpRating}</span>}
                  {imdbRating != null && <span style={{ fontSize: 12, color: '#F5C518', fontWeight: 600 }}>★ IMDb {imdbRating}</span>}
                  {director && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>реж. {director}</span>}
                  {countries.length > 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{countries.slice(0,2).join(', ')}</span>}
                </div>
                {actors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {actors.map(a => <span key={a} style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-elev-3)', padding: '1px 7px', borderRadius: 20 }}>{a}</span>)}
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={labelSx}>Статус</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s.key} onClick={() => setStatus(s.key)} style={{ padding: '5px 11px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: status === s.key ? 'var(--text)' : 'var(--bg-elev-2)', color: status === s.key ? 'var(--bg)' : 'var(--text-2)', border: `1px solid ${status === s.key ? 'transparent' : 'var(--border-subtle)'}`, transition: 'all 80ms', fontFamily: 'inherit' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelSx}>Тип</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[{ key: 'movie', label: 'Фильм' }, { key: 'series', label: 'Сериал' }, { key: 'anime', label: 'Аниме' }, { key: 'cartoon', label: 'Мультфильм' }].map(t => (
                  <button key={t.key} onClick={() => setMediaType(t.key)} style={{ padding: '5px 11px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: mediaType === t.key ? 'var(--text)' : 'var(--bg-elev-2)', color: mediaType === t.key ? 'var(--bg)' : 'var(--text-2)', border: `1px solid ${mediaType === t.key ? 'transparent' : 'var(--border-subtle)'}`, transition: 'all 80ms', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {isSeries && (
              <div>
                <label style={labelSx}>Прогресс сериала</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', width: 44 }}>Сезон</span>
                      <Stepper value={season} onChange={setSeason} min={1} placeholder="1" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', width: 36 }}>Серия</span>
                      <Stepper value={episode} onChange={setEpisode} min={1} placeholder="1" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>из</span>
                      <Stepper value={epsTotal} onChange={setEpsTotal} min={1} placeholder="?" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', width: 44 }}>Сезонов</span>
                    <Stepper value={seasonsTotal} onChange={setSeasonsTotal} min={1} placeholder="?" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={labelSx}>Оценка</label>
              <NumberRating value={rating} onChange={setRating} />
            </div>

            <div>
              <label style={labelSx}>Заметки / впечатление</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Что думаешь о фильме…" rows={3} style={{ ...inputSx, height: 'auto', resize: 'vertical', paddingTop: 8, paddingBottom: 8, lineHeight: 1.5 }} />
            </div>

            {!isWatchlist && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                <div>
                  <label style={labelSx}>Дата просмотра</label>
                  <DatePicker value={watchedDate} onChange={setWatchedDate} background="var(--bg-elev-2)" />
                </div>
                <div>
                  <label style={labelSx}>Настроение</label>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => setMood(mood === v ? null : v)} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer', color: MOOD_COLOR[v], background: mood === v ? `${MOOD_COLOR[v]}22` : 'transparent', border: mood === v ? `1px solid ${MOOD_COLOR[v]}55` : '1px solid var(--border-subtle)', transition: 'all 80ms', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                        {MOOD_LABEL[v]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isWatchlist && (
              <div>
                <label style={labelSx}>Где смотрел</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s.key} onClick={() => setWatchService(watchService === s.key ? '' : s.key)} style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer', background: watchService === s.key ? s.color : 'var(--bg-elev-2)', color: watchService === s.key ? 'white' : 'var(--text-3)', border: `1px solid ${watchService === s.key ? 'transparent' : 'var(--border-subtle)'}`, transition: 'all 80ms', fontWeight: watchService === s.key ? 600 : 400, fontFamily: 'inherit' }}>
                      {s.key}
                    </button>
                  ))}
                </div>
                <input value={watchUrl} onChange={e => setWatchUrl(e.target.value)} placeholder="Ссылка (необязательно)…" style={{ ...inputSx, fontSize: 12 }} />
              </div>
            )}

            <div>
              <label style={labelSx}>Любимые цитаты</label>
              <textarea value={quotes} onChange={e => setQuotes(e.target.value)} placeholder='«Ты смотришь в бездну, и бездна смотрит на тебя»' rows={2} style={{ ...inputSx, height: 'auto', resize: 'vertical', paddingTop: 8, paddingBottom: 8, lineHeight: 1.5 }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setIsPublic(v => !v)} style={{ width: 36, height: 20, borderRadius: 999, flexShrink: 0, background: isPublic ? '#6366f1' : 'var(--bg-elev-3)', border: '1px solid var(--border-subtle)', position: 'relative', transition: 'background 200ms', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 2, left: isPublic ? 17 : 2, width: 14, height: 14, borderRadius: 999, background: 'white', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Показывать в публичном списке</div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <button onClick={onClose} style={{ height: 34, padding: '0 16px', borderRadius: 8, background: 'var(--bg-elev-2)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', border: '1px solid var(--border-subtle)', fontFamily: 'inherit' }}>Отмена</button>
            <button onClick={handleSave} disabled={!title.trim() || saving} style={{ flex: 1, height: 34, borderRadius: 8, background: title.trim() && !saving ? 'var(--text)' : 'var(--bg-elev-2)', color: title.trim() && !saving ? 'var(--bg)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: title.trim() && !saving ? 'pointer' : 'default', transition: 'all 100ms', fontFamily: 'inherit' }}>
              {saving ? 'Сохраняю…' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export default function Cinema() {
  const { data: entries = [], isLoading } = useCinema();
  const { user } = useAuth();
  const createEntry = useCreateCinemaEntry();
  const updateEntry = useUpdateCinemaEntry();
  const deleteEntry = useDeleteCinemaEntry();
  const [searchParams, setSearchParams] = useSearchParams();

  const [modal, setModal]           = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [copied, setCopied]         = useState(false);
  const [q, setQ]                   = useState('');
  const [sort, setSort]             = useState('recent');
  const [favOnly, setFavOnly]       = useState(false);

  const status    = searchParams.get('status') || 'all';
  const mediaType = searchParams.get('type')   || '';

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModal(false);
      setSearchParams({ status }, { replace: true });
    }
  }, [searchParams]);

  const statusCounts = useMemo(() => {
    const c = { all: entries.length };
    STATUSES.forEach(s => { c[s.key] = entries.filter(e => e.status === s.key).length; });
    return c;
  }, [entries]);

  const favCount  = useMemo(() => entries.filter(e => e.is_favorite).length, [entries]);
  const watched   = useMemo(() => entries.filter(e => e.status === 'watched').length, [entries]);
  const ratedList = useMemo(() => entries.filter(e => e.my_rating != null), [entries]);
  const avgRating = ratedList.length ? (ratedList.reduce((s, e) => s + e.my_rating, 0) / ratedList.length).toFixed(1) : '—';

  const filtered = useMemo(() => {
    let list = entries.filter(e =>
      (status === 'all' || e.status === status) &&
      (!mediaType || e.media_type === mediaType) &&
      (!favOnly || e.is_favorite) &&
      (!q.trim() || e.title?.toLowerCase().includes(q.toLowerCase()) || e.original_title?.toLowerCase().includes(q.toLowerCase()) || e.director?.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === 'rating') list = [...list].sort((a, b) => (b.my_rating ?? b.kp_rating ?? 0) - (a.my_rating ?? a.kp_rating ?? 0));
    else if (sort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    else if (sort === 'year') list = [...list].sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [entries, status, mediaType, favOnly, q, sort]);

  const featured = useMemo(() => entries.find(e => e.status === 'watching' && e.episode) || entries.find(e => e.status === 'watching') || null, [entries]);

  const copyShareLink = () => {
    const link = `${window.location.origin}/cinema/public/${user?.id}`;
    navigator.clipboard.writeText(link)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); })
      .catch(() => prompt('Скопируй ссылку:', link));
  };

  const handleSave = async (data) => {
    if (modal) await updateEntry.mutateAsync({ id: modal.id, ...data });
    else       await createEntry.mutateAsync(data);
    setModal(null);
  };

  const handleUpdate = async (data) => {
    if (!detailModal) return;
    await updateEntry.mutateAsync({ id: detailModal.id, ...data });
    setDetailModal(prev => prev ? { ...prev, ...data } : null);
  };

  const handleToggleFav = async (entry) => {
    const next = { ...entry, is_favorite: !entry.is_favorite };
    if (detailModal?.id === entry.id) setDetailModal(next);
    updateEntry.mutate({ id: entry.id, is_favorite: !entry.is_favorite });
  };

  const openDetail = (entry) => setDetailModal(entry);
  const openEdit   = (entry) => { setDetailModal(null); setModal(entry); };

  const collectionSub = `${filtered.length} ${filtered.length === 1 ? 'запись' : (filtered.length % 10 >= 2 && filtered.length % 10 <= 4 && (filtered.length < 12 || filtered.length > 14) ? 'записи' : 'записей')}`;

  const featuredEpLabel = featured && (featured.season || featured.episode)
    ? `S${featured.season || 1}·E${String(featured.episode || 1).padStart(2, '0')}` : null;
  const featuredPct = featured?.episodes_total && featured?.episode
    ? Math.round(featured.episode / featured.episodes_total * 100) : null;

  return (
    <>
      {detailModal && (
        <CinemaDetailModal
          entry={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={() => openEdit(detailModal)}
          onDelete={() => { deleteEntry.mutate(detailModal.id); setDetailModal(null); }}
          onToggleFav={() => handleToggleFav(detailModal)}
          onUpdate={handleUpdate}
        />
      )}
      {modal !== null && (
        <AddMovieModal
          entry={modal || null}
          defaultStatus={status === 'all' ? 'watchlist' : status}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto', background: 'oklch(0.135 0.005 80)', color: 'oklch(0.96 0.004 80)', fontFamily: "'Geist', system-ui, sans-serif", fontFeatureSettings: "'ss01'", WebkitFontSmoothing: 'antialiased' }}>

          {/* ── Cinematic hero ── */}
          {featured && (
            <section style={{ position: 'relative', height: 380, overflow: 'hidden', borderBottom: '1px solid oklch(0.22 0.007 80)', flexShrink: 0 }}>
              {(featured.backdrop_url || featured.poster_url)
                ? <img src={featured.backdrop_url || featured.poster_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
                : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, oklch(0.26 0.04 285), oklch(0.16 0.015 285))' }} />
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, oklch(0.135 0.005 80) 0%, oklch(0.135 0.005 80 / .82) 34%, oklch(0.135 0.005 80 / .2) 64%, transparent 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(0.135 0.005 80) 0%, transparent 42%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 44px 38px', maxWidth: 720 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '.04em', color: '#a78bfa', background: 'rgba(139,92,246,.16)', border: '1px solid rgba(139,92,246,.35)', padding: '5px 12px', borderRadius: 99 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
                    Продолжить просмотр
                  </span>
                  <span style={{ fontSize: 12, color: 'oklch(0.62 0.007 80)' }}>{TYPE_LABEL[featured.media_type] || ''}</span>
                </div>
                <h1 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.02, marginBottom: 12, textShadow: '0 2px 30px rgba(0,0,0,.6)', color: '#fff' }}>{featured.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                  {featured.year && <span style={{ fontSize: 13, color: 'oklch(0.80 0.006 80)' }}>{featured.year}</span>}
                  {featured.year && <span style={{ width: 3, height: 3, borderRadius: 99, background: 'oklch(0.45 0.007 80)' }} />}
                  {featured.my_rating != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#F5C518' }}><span style={{ fontSize: 12 }}>★</span>{featured.my_rating}</span>}
                  {featuredEpLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(139,92,246,.9)', padding: '3px 9px', borderRadius: 7 }}>{featuredEpLabel}</span>}
                </div>
                {featured.overview && (
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'oklch(0.74 0.006 80)', marginBottom: 22, maxWidth: 560, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.overview}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <button onClick={() => openDetail(featured)} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 46, padding: '0 26px', borderRadius: 12, background: '#fff', color: 'oklch(0.14 0.005 80)', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,255,255,.16)', transition: 'transform .15s, box-shadow .15s', fontFamily: 'inherit' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(255,255,255,.26)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,255,255,.16)'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="oklch(0.14 0.005 80)"><path d="M8 5v14l11-7z"/></svg>Продолжить
                  </button>
                  {featuredEpLabel && featuredPct != null && (
                    <div style={{ flex: 1, maxWidth: 240 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'oklch(0.60 0.007 80)', marginBottom: 6 }}>
                        <span>{featuredEpLabel}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{featuredPct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${featuredPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <div style={{ padding: '30px 44px 8px' }}>
            {/* ── Category tabs (future-proof) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26, overflowX: 'auto' }}>
              {CAT_TABS.map(cat => {
                const active = !cat.soon && cat.key === 'cinema';
                return (
                  <button key={cat.key} disabled={cat.soon} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px', flexShrink: 0, borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: cat.soon ? 'default' : 'pointer', transition: 'all .18s', background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'oklch(0.175 0.006 80)', color: active ? '#fff' : (cat.soon ? 'oklch(0.50 0.007 80)' : 'oklch(0.70 0.007 80)'), border: `1px solid ${active ? 'transparent' : 'oklch(0.24 0.007 80)'}`, fontFamily: 'inherit', boxShadow: active ? '0 4px 16px rgba(99,102,241,.3)' : 'none' }}>
                    {cat.svg}{cat.label}
                    {cat.soon && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'oklch(0.55 0.007 80)', background: 'oklch(0.24 0.007 80)', padding: '2px 6px', borderRadius: 5 }}>скоро</span>}
                  </button>
                );
              })}
            </div>

            {/* ── Header + share/add ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Моя коллекция</h2>
                <p style={{ fontSize: 13, color: 'oklch(0.58 0.007 80)', marginTop: 3 }}>{isLoading ? '…' : collectionSub}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={copyShareLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 11, background: 'oklch(0.20 0.007 80)', border: '1px solid oklch(0.28 0.007 80)', color: copied ? '#a78bfa' : 'oklch(0.86 0.006 80)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }} onMouseEnter={e => { if (!copied) { e.currentTarget.style.background = 'oklch(0.25 0.007 80)'; e.currentTarget.style.borderColor = 'oklch(0.38 0.01 80)'; } }} onMouseLeave={e => { e.currentTarget.style.background = 'oklch(0.20 0.007 80)'; e.currentTarget.style.borderColor = 'oklch(0.28 0.007 80)'; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></svg>
                  {copied ? 'Ссылка скопирована' : 'Поделиться'}
                </button>
                <button onClick={() => setModal(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,92,246,.35)', transition: 'transform .15s', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>Добавить
                </button>
              </div>
            </div>

            {/* ── Stats strip ── */}
            {!isLoading && entries.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 26 }}>
                {[
                  { value: String(entries.length), unit: '', label: 'Всего', color: 'oklch(0.96 0.004 80)' },
                  { value: String(statusCounts.watching || 0), unit: '', label: 'Смотрю', color: '#a78bfa' },
                  { value: String(watched), unit: '', label: 'Просмотрено', color: '#34d399' },
                  { value: avgRating, unit: '/10', label: 'Ср. оценка', color: '#F5C518' },
                  { value: String(favCount), unit: '', label: 'Избранное', color: '#f43f5e' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px 18px', borderRadius: 14, background: 'oklch(0.175 0.006 80 / .7)', backdropFilter: 'blur(12px)', border: '1px solid oklch(0.24 0.007 80)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-.02em', color: s.color }}>{s.value}</span>
                      {s.unit && <span style={{ fontSize: 12, color: 'oklch(0.50 0.007 80)' }}>{s.unit}</span>}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: 'oklch(0.56 0.007 80)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Continue watching rail ── */}
            {!isLoading && <ContinueWatchingRail entries={entries} onOpen={openDetail} />}

            {/* ── Sticky toolbar ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', marginBottom: 8, background: 'linear-gradient(oklch(0.135 0.005 80), oklch(0.135 0.005 80 / .92))', backdropFilter: 'blur(8px)', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.52 0.007 80)" strokeWidth="2" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по коллекции…" style={{ width: '100%', height: 42, padding: '0 14px 0 40px', borderRadius: 12, background: 'oklch(0.18 0.006 80)', border: '1px solid oklch(0.26 0.007 80)', color: 'oklch(0.92 0.004 80)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                {[{ key: 'all', label: 'Все', count: statusCounts.all, color: null }, ...STATUSES.map(s => ({ key: s.key, label: s.label, count: statusCounts[s.key] || 0, color: s.color }))].map(t => {
                  const active = status === t.key;
                  return (
                    <button key={t.key} onClick={() => setSearchParams({ status: t.key, ...(mediaType ? { type: mediaType } : {}) })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 15px', borderRadius: 11, fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all .15s', background: active ? 'oklch(0.27 0.007 80)' : 'oklch(0.175 0.006 80)', color: active ? 'oklch(0.96 0.004 80)' : 'oklch(0.66 0.007 80)', border: `1px solid ${active ? 'oklch(0.40 0.01 80)' : 'oklch(0.24 0.007 80)'}`, fontFamily: 'inherit' }}>
                      {t.color && <span style={{ width: 7, height: 7, borderRadius: 99, background: t.color, flexShrink: 0 }} />}
                      {t.label}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: active ? 'oklch(0.70 0.007 80)' : 'oklch(0.48 0.007 80)' }}>{t.count}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
                <button onClick={() => setFavOnly(v => !v)} title="Избранное" style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: favOnly ? 'rgba(244,63,94,.14)' : 'oklch(0.18 0.006 80)', border: `1px solid ${favOnly ? 'rgba(244,63,94,.4)' : 'oklch(0.26 0.007 80)'}`, color: favOnly ? '#f43f5e' : 'oklch(0.6 0.007 80)', transition: 'all .15s' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill={favOnly ? '#f43f5e' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 20s-7-4.4-7-10a4.5 4.5 0 0 1 8.5-2A4.5 4.5 0 0 1 22 10c0 5.6-10 10-10 10Z"/></svg>
                </button>
                <div style={{ position: 'relative', height: 42 }}>
                  <select value={sort} onChange={e => setSort(e.target.value)} style={{ height: 42, padding: '0 34px 0 14px', borderRadius: 11, background: 'oklch(0.18 0.006 80)', border: '1px solid oklch(0.26 0.007 80)', color: 'oklch(0.82 0.006 80)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
                    <option value="recent">Недавние</option>
                    <option value="rating">По оценке</option>
                    <option value="title">По названию</option>
                    <option value="year">По году</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0.007 80)" strokeWidth="2.2" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* ── Type chips ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
              {MEDIA_TYPES.map(t => {
                const active = mediaType === t.key;
                return (
                  <button key={t.key} onClick={() => setSearchParams({ status, ...(t.key ? { type: t.key } : {}) })} style={{ height: 32, padding: '0 14px', borderRadius: 99, fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all .15s', background: active ? 'oklch(0.96 0.004 80)' : 'oklch(0.175 0.006 80)', color: active ? 'oklch(0.16 0.005 80)' : 'oklch(0.64 0.007 80)', border: `1px solid ${active ? 'transparent' : 'oklch(0.24 0.007 80)'}`, fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* ── Grid ── */}
            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 18, paddingBottom: 60 }}>
                <style>{`@keyframes cin-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} style={{ aspectRatio: '2/3', borderRadius: 15, background: 'oklch(0.20 0.006 80)', animation: `cin-pulse 1.4s ease-in-out ${i * 0.08}s infinite` }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '90px 0', color: 'oklch(0.48 0.007 80)' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'oklch(0.62 0.007 80)' }}>Ничего не найдено</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Попробуйте изменить фильтры или добавьте записи</div>
                <button onClick={() => setModal(false)} style={{ marginTop: 16, height: 38, padding: '0 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Добавить запись
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 18, paddingBottom: 60 }}>
                {filtered.map(e => (
                  <PosterCard
                    key={e.id}
                    entry={e}
                    onOpen={openDetail}
                    onEdit={openEdit}
                    onDelete={id => deleteEntry.mutate(id)}
                    onToggleFav={handleToggleFav}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

