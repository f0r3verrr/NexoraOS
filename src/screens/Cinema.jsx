import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCinema, useCreateCinemaEntry, useUpdateCinemaEntry, useDeleteCinemaEntry } from '../hooks/useCinema.js';
import { searchMedia, getDetails } from '../lib/tmdb.js';

/* ─── constants ─────────────────────────────────────────────── */
const STATUSES = [
  { key: 'watching',  label: 'Смотрю' },
  { key: 'watched',   label: 'Просмотрено' },
  { key: 'watchlist', label: 'Хочу посмотреть' },
  { key: 'waiting',   label: 'Жду сезон' },
  { key: 'dropped',   label: 'Брошено' },
];
const STATUS_LABEL = {
  watching: 'Смотрю', watched: 'Просмотрено',
  watchlist: 'Хочу посмотреть', waiting: 'Жду сезон', dropped: 'Брошено',
};
const MEDIA_TYPES = [
  { key: '',         label: 'Все типы' },
  { key: 'movie',    label: 'Фильм' },
  { key: 'series',   label: 'Сериал' },
  { key: 'anime',    label: 'Аниме' },
  { key: 'cartoon',  label: 'Мультфильм' },
];
const ALL_STATUSES = [{ key: 'all', label: 'Все' }, ...STATUSES.map(s => ({ ...s }))];
const MOOD_LABEL = ['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Восторг'];
const MOOD_COLOR = ['', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];
const SERIES_TYPES = ['series', 'anime', 'cartoon'];
const SERVICES = [
  { key: 'Netflix',       color: '#E50914' },
  { key: 'Кинопоиск',    color: '#FF6B00' },
  { key: 'Prime Video',  color: '#00A8E0' },
  { key: 'Disney+',      color: '#0063E5' },
  { key: 'YouTube',      color: '#FF0000' },
  { key: 'Apple TV+',    color: '#555555' },
  { key: 'Иви',          color: '#CC2200' },
  { key: 'Окко',         color: '#E06020' },
  { key: 'Другое',       color: 'var(--text-muted)' },
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
        style={{ width: 72, height: 38, fontSize: 20, fontWeight: 800, textAlign: 'center', background: 'var(--bg-elev-2)', border: '1px solid var(--p-openresto)', borderRadius: 8, color: '#F5C518', fontFamily: 'var(--font-mono)', outline: 'none' }}
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
      <span style={{ fontSize: 22, fontWeight: 800, color: value != null ? '#F5C518' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1, textShadow: value != null ? '0 0 16px rgba(245,197,24,0.35)' : 'none' }}>
        {value != null ? value : '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/10</span>
    </button>
  );
}

/* ─── MetaChip ──────────────────────────────────────────────── */
function MetaChip({ children, muted, color }) {
  return (
    <span style={{ fontSize: 12, color: color ?? (muted ? 'var(--text-3)' : 'var(--text-2)'), background: 'var(--bg-elev-3)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/* ─── ContinueWatchingBar ───────────────────────────────────── */
function ContinueWatchingBar({ entries, onDetail, onNextEpisode }) {
  const watching = entries.filter(e => e.status === 'watching' && (e.season || e.episode));
  if (!watching.length) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', flex: 'none', background: 'var(--bg-elev-1)' }}>
      <div style={{ padding: '10px 24px 0', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Продолжить просмотр
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '8px 24px 12px', overflowX: 'auto' }}>
        <style>{`.cw-scroll::-webkit-scrollbar{display:none}`}</style>
        {watching.map(entry => {
          const pct = entry.episodes_total ? Math.round((entry.episode / entry.episodes_total) * 100) : null;
          return (
            <div
              key={entry.id}
              onClick={() => onDetail(entry)}
              style={{ flex: 'none', width: 200, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              {/* Backdrop/poster thumbnail */}
              <div style={{ height: 80, overflow: 'hidden', position: 'relative', background: 'var(--bg-elev-3)' }}>
                {(entry.backdrop_url || entry.poster_url) && (
                  <img src={entry.backdrop_url || entry.poster_url} alt="" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', filter: 'brightness(0.7)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                <div style={{ position: 'absolute', top: 5, right: 6, background: 'rgba(99,102,241,0.9)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: 'white', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  S{entry.season || '?'}E{String(entry.episode || '?').padStart(2, '0')}
                </div>
              </div>
              {/* Progress bar */}
              {pct !== null && (
                <div style={{ height: 3, background: 'var(--bg-elev-3)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--p-openresto)' }} />
                </div>
              )}
              <div style={{ padding: '7px 10px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{entry.title}</div>
                <button
                  onClick={e => { e.stopPropagation(); onNextEpisode(entry); }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  style={{ width: '100%', height: 24, borderRadius: 6, background: 'var(--p-openresto)', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  + следующая серия
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MovieCard (grid) ──────────────────────────────────────── */
function MovieCard({ entry, onDetail, onEdit, onDelete, onToggleFav }) {
  const [hover, setHover] = useState(false);
  const isSeries  = SERIES_TYPES.includes(entry.media_type);
  const showProg  = isSeries && (entry.season || entry.episode);
  const pct       = entry.episodes_total && entry.episode ? Math.round((entry.episode / entry.episodes_total) * 100) : null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onDetail}
      style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '2/3', background: 'var(--bg-elev-2)', cursor: 'pointer', userSelect: 'none', boxShadow: hover ? '0 8px 24px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)', transition: 'box-shadow 200ms, transform 200ms', transform: hover ? 'translateY(-3px)' : 'translateY(0)' }}
    >
      {entry.poster_url ? (
        <img src={entry.poster_url} alt={entry.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: '0 12px', background: 'linear-gradient(145deg, var(--bg-elev-2), var(--bg-elev-3))' }}>
          <Icon name="film" size={32} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{entry.title}</span>
        </div>
      )}

      {/* Favorite heart */}
      {(entry.is_favorite || hover) && (
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          style={{ position: 'absolute', top: 7, left: 7, width: 26, height: 26, borderRadius: 999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 150ms', transform: hover ? 'scale(1.1)' : 'scale(1)', border: 'none', color: entry.is_favorite ? '#F43F5E' : 'rgba(255,255,255,0.6)' }}
          title={entry.is_favorite ? 'Убрать из избранного' : 'В избранное'}
        >
          <Icon name={entry.is_favorite ? 'heart_filled' : 'heart'} size={13} />
        </button>
      )}

      {/* Rating or progress badge */}
      {showProg ? (
        <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(99,102,241,0.88)', borderRadius: 6, padding: '2px 7px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 10, color: 'white', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            S{entry.season || '?'}E{String(entry.episode || '?').padStart(2, '0')}
          </span>
        </div>
      ) : entry.my_rating != null ? (
        <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(0,0,0,0.82)', borderRadius: 6, padding: '2px 7px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 11, color: '#F5C518', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{entry.my_rating}</span>
          <span style={{ fontSize: 9, color: 'rgba(245,197,24,0.7)', marginLeft: 2 }}>★</span>
        </div>
      ) : entry.kp_rating != null ? (
        <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(0,0,0,0.82)', borderRadius: 6, padding: '2px 7px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,144,0,0.7)', marginRight: 2 }}>КП</span>
          <span style={{ fontSize: 11, color: '#FF9000', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{entry.kp_rating}</span>
        </div>
      ) : null}

      {/* Episode progress bar at bottom */}
      {pct !== null && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--p-openresto)', transition: 'width 300ms' }} />
        </div>
      )}

      {/* Hover overlay */}
      {hover && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, transparent 75%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 10px 14px' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.25, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.title}</span>
          {entry.year && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{entry.year}</span>}
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={e => { e.stopPropagation(); onEdit(); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'} style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.16)', color: 'white', fontSize: 12, cursor: 'pointer', transition: 'background 80ms' }}>
              Изменить
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.6)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.3)'} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(220,38,38,0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 80ms' }}>
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MovieListRow ──────────────────────────────────────────── */
function MovieListRow({ entry, onDetail, onEdit, onDelete, onToggleFav }) {
  const [hover, setHover] = useState(false);
  const isSeries = SERIES_TYPES.includes(entry.media_type);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onDetail}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: hover ? 'var(--bg-elev-2)' : 'transparent', transition: 'background 80ms', cursor: 'pointer' }}
    >
      <div style={{ width: 40, height: 60, flex: 'none', borderRadius: 6, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
        {entry.poster_url ? <img src={entry.poster_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="film" size={16} style={{ color: 'var(--text-muted)' }} /></div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {entry.is_favorite && <Icon name="heart_filled" size={11} style={{ color: '#F43F5E', flexShrink: 0 }} />}
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {entry.year && <span>{entry.year}</span>}
          {entry.director && <span>{entry.director}</span>}
          {isSeries && (entry.season || entry.episode) && <span style={{ color: 'var(--p-openresto)' }}>S{entry.season || '?'}E{String(entry.episode || '?').padStart(2, '0')}</span>}
        </div>
        {entry.my_notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.my_notes}</div>}
      </div>
      {entry.my_rating != null && (
        <div style={{ flex: 'none', display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F5C518', fontFamily: 'var(--font-mono)' }}>{entry.my_rating}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/10</span>
        </div>
      )}
      {hover && (
        <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
          <button onClick={e => { e.stopPropagation(); onToggleFav(); }} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elev-3)', cursor: 'pointer', color: entry.is_favorite ? '#F43F5E' : 'var(--text-muted)' }}><Icon name={entry.is_favorite ? 'heart_filled' : 'heart'} size={13} /></button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elev-3)', color: 'var(--text-2)', cursor: 'pointer' }}><Icon name="edit" size={13} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)', cursor: 'pointer' }}><Icon name="trash" size={13} /></button>
        </div>
      )}
    </div>
  );
}


/* ─── MovieDetailModal ──────────────────────────────────────── */
function MovieDetailModal({ entry, onEdit, onDelete, onClose, onToggleFav, onUpdate }) {
  const [spoilerShown, setSpoilerShown] = useState(false);
  const [rewatchOpen, setRewatchOpen]   = useState(false);
  const [rwDate, setRwDate]             = useState(new Date().toISOString().substring(0, 10));
  const [rwMood, setRwMood]             = useState(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const isSeries     = SERIES_TYPES.includes(entry.media_type);
  const history      = Array.isArray(entry.watch_history) ? entry.watch_history : [];
  const service      = entry.watch_service ? SERVICES.find(s => s.key === entry.watch_service) : null;

  const seasonsInfo = (() => {
    if (!isSeries || !entry.season) return null;
    const prev = (entry.season || 1) - 1;
    return { prev, current: entry.season, episode: entry.episode, total: entry.episodes_total, showTotal: entry.seasons_total };
  })();

  const addRewatch = () => {
    const newHistory = [...history, { date: rwDate, mood: rwMood }];
    onUpdate({ watch_history: newHistory });
    setRewatchOpen(false);
    setRwMood(null);
  };

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 402, background: 'rgba(0,0,0,0.72)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 403 }}>
        <div className="modal-enter" style={{ width: 560, maxHeight: '90vh', background: entry.backdrop_url ? 'rgba(6,6,16,0.95)' : 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Netflix backdrop blur */}
          {entry.backdrop_url && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url(${entry.backdrop_url})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', filter: 'blur(22px) brightness(0.2)', transform: 'scale(1.08)', pointerEvents: 'none' }} />
          )}

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            {entry.poster_url ? (
              <div style={{ position: 'relative', height: 220, flex: 'none', overflow: 'hidden' }}>
                {entry.backdrop_url && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${entry.backdrop_url})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', opacity: 0.5 }} />}
                <img src={entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.5)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(6,6,16,0.97) 100%)' }} />
                <div style={{ position: 'absolute', bottom: 14, left: 20, right: 52, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  <div style={{ width: 58, height: 86, flex: 'none', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={entry.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{entry.title}</div>
                    {entry.original_title && entry.original_title !== entry.title && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>{entry.original_title}</div>
                    )}
                  </div>
                </div>
                {/* Fav + close buttons */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                  <button onClick={onToggleFav} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', color: entry.is_favorite ? '#F43F5E' : 'rgba(255,255,255,0.7)' }} title={entry.is_favorite ? 'Убрать из избранного' : 'В избранное'}>
                    <Icon name={entry.is_favorite ? 'heart_filled' : 'heart'} size={14} />
                  </button>
                  <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
                    <Icon name="x" size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0', flex: 'none' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{entry.title}</div>
                  {entry.original_title && entry.original_title !== entry.title && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{entry.original_title}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 'none', marginLeft: 12 }}>
                  <button onClick={onToggleFav} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: 'none', color: entry.is_favorite ? '#F43F5E' : 'var(--text-muted)' }}><Icon name={entry.is_favorite ? 'heart_filled' : 'heart'} size={14} /></button>
                  <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none' }}><Icon name="x" size={16} /></button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 4px' }}>

              {/* Meta chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {entry.year && <MetaChip>{entry.year}</MetaChip>}
                <MetaChip>{STATUS_LABEL[entry.status]}</MetaChip>
                {entry.runtime && <MetaChip>⏱ {entry.runtime >= 60 ? `${Math.floor(entry.runtime / 60)}ч ` : ''}{entry.runtime % 60}м</MetaChip>}
                {entry.countries?.slice(0, 2).map(c => <MetaChip key={c}>{c}</MetaChip>)}
                {entry.genres?.slice(0, 3).map(g => <MetaChip key={g} muted>{g}</MetaChip>)}
              </div>

              {/* Series progress */}
              {isSeries && seasonsInfo && (
                <div style={{ marginBottom: 14, background: 'rgba(99,102,241,0.1)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(99,102,241,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Icon name="tv" size={13} style={{ color: 'var(--p-openresto)', flexShrink: 0 }} />
                    {seasonsInfo.prev > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {seasonsInfo.prev} {seasonsInfo.prev === 1 ? 'сезон' : seasonsInfo.prev < 5 ? 'сезона' : 'сезонов'} просмотрено ·
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                      Сезон {seasonsInfo.current} · Серия {seasonsInfo.episode || '?'}
                      {seasonsInfo.total ? ` из ${seasonsInfo.total}` : ''}
                    </span>
                    {seasonsInfo.showTotal && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(всего сезонов: {seasonsInfo.showTotal})</span>
                    )}
                  </div>
                  {seasonsInfo.total && seasonsInfo.episode && (
                    <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(seasonsInfo.episode / seasonsInfo.total * 100)}%`, background: 'var(--p-openresto)', borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              )}

              {/* Ratings */}
              {(entry.my_rating != null || entry.kp_rating != null || entry.imdb_rating != null) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {entry.my_rating != null && (
                    <div style={{ padding: '10px 16px', background: 'rgba(245,197,24,0.08)', borderRadius: 10, border: '1px solid rgba(245,197,24,0.18)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 10, color: 'rgba(245,197,24,0.55)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Моя</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#F5C518', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{entry.my_rating}</span>
                        <span style={{ fontSize: 11, color: 'rgba(245,197,24,0.45)' }}>/10</span>
                      </div>
                    </div>
                  )}
                  {entry.kp_rating != null && (
                    <div style={{ padding: '10px 16px', background: 'rgba(255,107,0,0.08)', borderRadius: 10, border: '1px solid rgba(255,107,0,0.18)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,107,0,0.6)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>КП</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#FF6B00', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{entry.kp_rating}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,107,0,0.45)' }}>/10</span>
                      </div>
                    </div>
                  )}
                  {entry.imdb_rating != null && (
                    <div style={{ padding: '10px 16px', background: 'rgba(245,197,24,0.06)', borderRadius: 10, border: '1px solid rgba(245,197,24,0.12)', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 10, color: 'rgba(245,197,24,0.5)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IMDb</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#F5C518', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{entry.imdb_rating}</span>
                        <span style={{ fontSize: 11, color: 'rgba(245,197,24,0.4)' }}>/10</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Director + actors */}
              {(entry.director || entry.actors?.length > 0) && (
                <div style={{ marginBottom: 14 }}>
                  {entry.director && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 7 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Режиссёр</span>
                      <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{entry.director}</span>
                    </div>
                  )}
                  {entry.actors?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>В ролях</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {entry.actors.map(a => (
                          <span key={a} style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-elev-3)', padding: '3px 9px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Viewing info row */}
              {(entry.mood || entry.watched_date || entry.watch_service || entry.watch_url) && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-elev-3)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  {entry.mood && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: MOOD_COLOR[entry.mood], background: `${MOOD_COLOR[entry.mood]}22`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${MOOD_COLOR[entry.mood]}44` }}>{MOOD_LABEL[entry.mood]}</span>
                    </div>
                  )}
                  {entry.watched_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="calendar" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {new Date(entry.watched_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {(entry.watch_service || entry.watch_url) && (
                    <div style={{ marginLeft: 'auto' }}>
                      {entry.watch_url ? (
                        <a href={entry.watch_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'white', textDecoration: 'none', background: service?.color ?? 'var(--p-openresto)', padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>
                          <Icon name="link" size={11} />
                          {entry.watch_service || 'Где смотрел'}
                        </a>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'white', background: service?.color ?? 'var(--bg-elev-2)', padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>
                          {entry.watch_service}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {entry.my_notes && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Заметки</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, background: 'var(--bg-elev-3)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>{entry.my_notes}</div>
                </div>
              )}

              {/* Quotes */}
              {entry.quotes && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Цитаты</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75, background: 'var(--bg-elev-3)', padding: '10px 14px 10px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)', borderLeft: '3px solid rgba(245,197,24,0.35)', fontStyle: 'italic' }}>{entry.quotes}</div>
                </div>
              )}

              {/* Overview + anti-spoiler */}
              {entry.overview && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Описание</div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, filter: (!spoilerShown && entry.status === 'watchlist') ? 'blur(7px)' : 'none', transition: 'filter 300ms', userSelect: (!spoilerShown && entry.status === 'watchlist') ? 'none' : 'text' }}>
                      {entry.overview}
                    </div>
                    {!spoilerShown && entry.status === 'watchlist' && (
                      <button onClick={() => setSpoilerShown(true)} style={{ position: 'absolute', inset: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', cursor: 'pointer', gap: 6, fontSize: 13, color: 'var(--text-2)', border: 'none', borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Icon name="eye" size={14} /> Показать описание
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Rewatch history */}
              {(history.length > 0 || entry.status === 'watched') && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      История просмотров {history.length > 0 && `(${history.length})`}
                    </div>
                    <button onClick={() => setRewatchOpen(v => !v)} style={{ fontSize: 11, color: 'var(--p-openresto)', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.2)' }}>
                      + Пересмотрел
                    </button>
                  </div>

                  {rewatchOpen && (
                    <div style={{ background: 'var(--bg-elev-3)', borderRadius: 10, padding: '12px', border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <label style={{ ...labelSx, marginBottom: 4 }}>Дата</label>
                          <input type="date" value={rwDate} onChange={e => setRwDate(e.target.value)} style={{ ...inputSx, height: 32, fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ ...labelSx, marginBottom: 4 }}>Настроение</label>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {[1,2,3,4,5].map(v => (
                              <button key={v} onClick={() => setRwMood(rwMood === v ? null : v)} style={{ padding: '3px 7px', borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: 'pointer', color: MOOD_COLOR[v], background: rwMood === v ? `${MOOD_COLOR[v]}22` : 'transparent', border: rwMood === v ? `1px solid ${MOOD_COLOR[v]}55` : '1px solid var(--border-subtle)', transform: rwMood === v ? 'scale(1.1)' : 'scale(1)', transition: 'all 80ms', whiteSpace: 'nowrap' }}>
                                {MOOD_LABEL[v]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={addRewatch} style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'var(--text)', color: 'var(--bg)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          Добавить
                        </button>
                      </div>
                    </div>
                  )}

                  {history.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[...history].reverse().map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--bg-elev-3)', borderRadius: 7, border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                            {new Date(w.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {w.mood && <span style={{ fontSize: 10, fontWeight: 600, color: MOOD_COLOR[w.mood], background: `${MOOD_COLOR[w.mood]}22`, padding: '1px 6px', borderRadius: 20 }}>{MOOD_LABEL[w.mood]}</span>}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{history.length - i}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flex: 'none' }}>
              <button onClick={() => { onDelete(); onClose(); }} style={{ height: 34, padding: '0 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in oklab, var(--danger) 10%, transparent)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', border: '1px solid color-mix(in oklab, var(--danger) 18%, transparent)' }}>
                <Icon name="trash" size={13} />Удалить
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onEdit} style={{ height: 34, padding: '0 16px', borderRadius: 8, background: 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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

/* ─── EmptyState ─────────────────────────────────────────────── */
function EmptyState({ status, onAdd }) {
  const label = STATUSES.find(s => s.key === status)?.label || '';
  return (
    <div style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-elev-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="film" size={26} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Пусто в «{label}»</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>Введи название — данные и постер подтянутся автоматически из КиноПоиска</div>
      <button onClick={onAdd} style={{ marginTop: 4, height: 34, padding: '0 18px', borderRadius: 8, background: 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="plus" size={14} />Добавить
      </button>
    </div>
  );
}

/* ─── StatsView ──────────────────────────────────────────────── */
function StatsView({ entries }) {
  const movies  = entries.filter(e => e.media_type === 'movie').length;
  const series  = entries.filter(e => e.media_type !== 'movie').length;
  const watched = entries.filter(e => e.status === 'watched').length;
  const rated   = entries.filter(e => e.my_rating != null);
  const totalH  = Math.round(entries.reduce((s, e) => s + (e.runtime || 0), 0) / 60);
  const avgR    = rated.length ? (rated.reduce((s, e) => s + Number(e.my_rating), 0) / rated.length).toFixed(1) : null;
  const favs    = entries.filter(e => e.is_favorite).length;

  const byYear = {};
  entries.forEach(e => {
    const d = e.watched_date || e.created_at;
    if (!d) return;
    const yr = String(d).substring(0, 4);
    if (!byYear[yr]) byYear[yr] = { m: 0, s: 0 };
    e.media_type === 'movie' ? byYear[yr].m++ : byYear[yr].s++;
  });
  const years = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));
  const maxY = Math.max(...years.map(([, v]) => v.m + v.s), 1);

  const genreMap = {};
  entries.forEach(e => (e.genres || []).forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1; }));
  const topGenres = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const cMap = {};
  entries.forEach(e => (e.countries || []).forEach(c => { cMap[c] = (cMap[c] || 0) + 1; }));
  const topCountries = Object.entries(cMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const moodCounts = [1,2,3,4,5].map(v => ({ v, count: entries.filter(e => e.mood === v).length })).filter(x => x.count > 0);
  const maxMood = Math.max(...moodCounts.map(x => x.count), 1);

  const card = (label, value, color = 'var(--text)') => (
    <div style={{ background: 'var(--bg-elev-2)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 28 }}>
        {card('Фильмов', movies)}
        {card('Сериалов', series)}
        {card('Просмотрено', watched)}
        {totalH > 0 && card('Часов', totalH)}
        {avgR && card('Средняя оценка', avgR, '#F5C518')}
        {favs > 0 && card('Избранное', favs, '#F43F5E')}
      </div>

      {years.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>По годам</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {years.map(([yr, { m, s }]) => {
              const total = m + s;
              const pct = Math.round(total / maxY * 100);
              return (
                <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'right', flex: 'none' }}>{yr}</div>
                  <div style={{ flex: 1, height: 20, background: 'var(--bg-elev-2)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${pct}%`, background: 'linear-gradient(90deg, var(--p-openresto), rgba(139,92,246,0.6))', borderRadius: 5, minWidth: 28, display: 'flex', alignItems: 'center', paddingLeft: 7 }}>
                      <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{total}</span>
                    </div>
                  </div>
                  <div style={{ width: 56, fontSize: 10, color: 'var(--text-muted)', flex: 'none', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {m > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Icon name="film" size={9} />{m}</span>}
                    {s > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Icon name="tv" size={9} />{s}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {topGenres.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Жанры</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topGenres.map(([g, c]) => (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</div>
                  <div style={{ width: 80, height: 5, background: 'var(--bg-elev-2)', borderRadius: 3, overflow: 'hidden', flex: 'none' }}>
                    <div style={{ height: '100%', width: `${Math.round(c / (topGenres[0]?.[1] || 1) * 100)}%`, background: 'linear-gradient(90deg, var(--p-openresto), rgba(139,92,246,0.7))', borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 18, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', flex: 'none' }}>{c}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {topCountries.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Страны</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topCountries.map(([c, n]) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</div>
                  <div style={{ width: 80, height: 5, background: 'var(--bg-elev-2)', borderRadius: 3, overflow: 'hidden', flex: 'none' }}>
                    <div style={{ height: '100%', width: `${Math.round(n / (topCountries[0]?.[1] || 1) * 100)}%`, background: 'linear-gradient(90deg, #FF9000, rgba(255,144,0,0.4))', borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 18, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', flex: 'none' }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {moodCounts.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Настроение от просмотров</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            {moodCounts.map(({ v, count }) => (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}</div>
                <div style={{ width: 36, height: Math.round(count / maxMood * 60) + 4, background: MOOD_COLOR[v], borderRadius: 5, transition: 'height 400ms', opacity: 0.7 }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: MOOD_COLOR[v], textAlign: 'center', maxWidth: 36, lineHeight: 1.2 }}>{MOOD_LABEL[v]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 14 }}>Добавь фильмы, чтобы видеть статистику</div>}
    </div>
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

  // Rich API fields
  const [kpRating, setKpRating]         = useState(entry?.kp_rating ?? null);
  const [imdbRating, setImdbRating]     = useState(entry?.imdb_rating ?? null);
  const [actors, setActors]             = useState(entry?.actors || []);
  const [director, setDirector]         = useState(entry?.director || '');
  const [backdrop, setBackdrop]         = useState(entry?.backdrop_url || '');
  const [countries, setCountries]       = useState(entry?.countries || []);
  const [seasonsTotal, setSeasonsTotal] = useState(entry?.seasons_total || '');

  // User fields
  const [watchService, setWatchService] = useState(entry?.watch_service || '');
  const [watchUrl, setWatchUrl]         = useState(entry?.watch_url || '');
  const [watchedDate, setWatchedDate]   = useState(entry?.watched_date || '');
  const [mood, setMood]                 = useState(entry?.mood ?? null);
  const [quotes, setQuotes]             = useState(entry?.quotes || '');

  // Series progress
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

  const isSeries   = SERIES_TYPES.includes(mediaType);
  const isWatchlist = status === 'watchlist';

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 401 }}>
        <div className="modal-enter" style={{ width: 540, maxHeight: '90vh', background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать' : 'Добавить фильм'}</span>
            {fetchingDet && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}><div style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--p-openresto)', borderRadius: 999, animation: 'cin-spin 0.7s linear infinite' }} />Загружаю детали…</div>}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', border: 'none' }}><Icon name="x" size={16} /></button>
          </div>

          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <style>{`@keyframes cin-spin{to{transform:rotate(360deg)}}`}</style>

            {/* Search */}
            {!isEdit && (
              <div style={{ position: 'relative' }}>
                <label style={labelSx}>Поиск фильма или сериала</label>
                <div style={{ position: 'relative' }}>
                  <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Начни вводить название…" style={{ ...inputSx, paddingLeft: 32 }} />
                  {searching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--p-openresto)', borderRadius: 999, animation: 'cin-spin 0.7s linear infinite' }} /></div>}
                </div>
                {showResults && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', maxHeight: 260, overflowY: 'auto' }}>
                    {results.map(item => (
                      <button key={item.id} onClick={() => handleSelect(item)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: 'transparent', textAlign: 'left', cursor: 'pointer', border: 'none' }}>
                        {item.thumb_url ? <img src={item.thumb_url} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4, flex: 'none' }} /> : <div style={{ width: 32, height: 48, borderRadius: 4, background: 'var(--bg-elev-2)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="film" size={14} style={{ color: 'var(--text-muted)' }} /></div>}
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

            {/* Poster + title */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 80, height: 120, flex: 'none', borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" type="number" style={inputSx} />
                  </div>
                  <div style={{ width: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2 }}>
                    <button onClick={() => setIsFav(v => !v)} title={isFav ? 'Убрать из избранного' : 'В избранное'} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isFav ? 'rgba(244,63,94,0.15)' : 'var(--bg-elev-2)', border: isFav ? '1px solid rgba(244,63,94,0.3)' : '1px solid var(--border-subtle)', cursor: 'pointer', color: isFav ? '#F43F5E' : 'var(--text-muted)', transition: 'all 120ms' }}>
                      <Icon name={isFav ? 'heart_filled' : 'heart'} size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* API info chips */}
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

            {/* Status */}
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

            {/* Media type */}
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

            {/* Series progress */}
            {isSeries && (
              <div>
                <label style={labelSx}>Прогресс сериала</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Сезон</span>
                  <input value={season} onChange={e => setSeason(e.target.value)} type="number" min="1" placeholder="1" style={{ ...inputSx, width: 54, textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Серия</span>
                  <input value={episode} onChange={e => setEpisode(e.target.value)} type="number" min="1" placeholder="1" style={{ ...inputSx, width: 54, textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>из</span>
                  <input value={epsTotal} onChange={e => setEpsTotal(e.target.value)} type="number" min="1" placeholder="?" style={{ ...inputSx, width: 54, textAlign: 'center' }} />
                  {seasonsTotal ? (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {seasonsTotal} сезонов в шоу</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>Всего сезонов:</span>
                      <input value={seasonsTotal} onChange={e => setSeasonsTotal(e.target.value)} type="number" min="1" placeholder="?" style={{ ...inputSx, width: 54, textAlign: 'center' }} />
                    </>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
                  Укажи текущий сезон и серию — предыдущие считаются просмотренными
                </div>
              </div>
            )}

            {/* Rating */}
            <div>
              <label style={labelSx}>Оценка</label>
              <NumberRating value={rating} onChange={setRating} />
            </div>

            {/* Notes */}
            <div>
              <label style={labelSx}>Заметки / впечатление</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Что думаешь о фильме…" rows={3} style={{ ...inputSx, height: 'auto', resize: 'vertical', paddingTop: 8, paddingBottom: 8, lineHeight: 1.5 }} />
            </div>

            {/* Watch date + mood (for any non-watchlist status) */}
            {!isWatchlist && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                <div>
                  <label style={labelSx}>Дата просмотра</label>
                  <input type="date" value={watchedDate} onChange={e => setWatchedDate(e.target.value)} style={inputSx} />
                </div>
                <div>
                  <label style={labelSx}>Настроение</label>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => setMood(mood === v ? null : v)} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer', color: MOOD_COLOR[v], background: mood === v ? `${MOOD_COLOR[v]}22` : 'transparent', border: mood === v ? `1px solid ${MOOD_COLOR[v]}55` : '1px solid var(--border-subtle)', transform: mood === v ? 'scale(1.1)' : 'scale(1)', transition: 'all 80ms', whiteSpace: 'nowrap' }}>
                        {MOOD_LABEL[v]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Where watched — service picker + URL */}
            {!isWatchlist && (
              <div>
                <label style={labelSx}>Где смотрел</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s.key} onClick={() => setWatchService(watchService === s.key ? '' : s.key)} style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer', background: watchService === s.key ? s.color : 'var(--bg-elev-2)', color: watchService === s.key ? 'white' : 'var(--text-3)', border: `1px solid ${watchService === s.key ? 'transparent' : 'var(--border-subtle)'}`, transition: 'all 80ms', fontWeight: watchService === s.key ? 600 : 400 }}>
                      {s.key}
                    </button>
                  ))}
                </div>
                <input value={watchUrl} onChange={e => setWatchUrl(e.target.value)} placeholder="Ссылка (необязательно)…" style={{ ...inputSx, fontSize: 12 }} />
              </div>
            )}

            {/* Quotes */}
            <div>
              <label style={labelSx}>Любимые цитаты</label>
              <textarea value={quotes} onChange={e => setQuotes(e.target.value)} placeholder='«Ты смотришь в бездну, и бездна смотрит на тебя»' rows={2} style={{ ...inputSx, height: 'auto', resize: 'vertical', paddingTop: 8, paddingBottom: 8, lineHeight: 1.5 }} />
            </div>

            {/* Public toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setIsPublic(v => !v)} style={{ width: 36, height: 20, borderRadius: 999, flex: 'none', background: isPublic ? 'var(--p-openresto)' : 'var(--bg-elev-3)', border: '1px solid var(--border-subtle)', position: 'relative', transition: 'background 200ms', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 2, left: isPublic ? 17 : 2, width: 14, height: 14, borderRadius: 999, background: 'white', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Показывать в публичном списке</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flex: 'none' }}>
            <button onClick={onClose} style={{ height: 34, padding: '0 16px', borderRadius: 8, background: 'var(--bg-elev-2)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>Отмена</button>
            <button onClick={handleSave} disabled={!title.trim() || saving} style={{ flex: 1, height: 34, borderRadius: 8, background: title.trim() && !saving ? 'var(--text)' : 'var(--bg-elev-2)', color: title.trim() && !saving ? 'var(--bg)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: title.trim() && !saving ? 'pointer' : 'default', transition: 'all 100ms' }}>
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
  const [viewMode, setViewMode]         = useState('grid'); // 'grid' | 'list'
  const [modal, setModal]               = useState(null);
  const [detailModal, setDetailModal]   = useState(null);
  const [copied, setCopied]             = useState(false);
  const [search, setSearch]             = useState('');

  const status    = searchParams.get('status') || 'watched';
  const mediaType = searchParams.get('type')   || '';
  const favOnly   = searchParams.get('fav')    === '1';
  const isStats   = status === 'stats';

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModal(false);
      setSearchParams({ status }, { replace: true });
    }
  }, [searchParams]);

  const statusCounts = entries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const favCount = entries.filter(e => e.is_favorite).length;

  // Search across all entries
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.original_title?.toLowerCase().includes(q) ||
      e.director?.toLowerCase().includes(q) ||
      e.actors?.some(a => a.toLowerCase().includes(q))
    );
  }, [search, entries]);

  const filtered = useMemo(() => {
    let list = status === 'all'
      ? entries.filter(e => !mediaType || e.media_type === mediaType)
      : entries.filter(e => e.status === status && (!mediaType || e.media_type === mediaType));
    if (favOnly) list = list.filter(e => e.is_favorite);
    return list;
  }, [entries, status, mediaType, favOnly]);

  const copyShareLink = () => {
    const link = `${window.location.origin}/cinema/public/${user?.id}`;
    navigator.clipboard.writeText(link)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); })
      .catch(() => prompt('Скопируй ссылку:', link));
  };

  const handleSave = async (data) => {
    if (modal) await updateEntry.mutateAsync({ id: modal.id, ...data });
    else       await createEntry.mutateAsync({ ...data, status: (isStats || status === 'all') ? 'watched' : status });
    setModal(null);
  };

  const handleUpdate = async (data) => {
    if (detailModal) {
      await updateEntry.mutateAsync({ id: detailModal.id, ...data });
      // Refresh detail modal with updated data
      setDetailModal(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const handleToggleFav = async (entry) => {
    const updated = { ...entry, is_favorite: !entry.is_favorite };
    await updateEntry.mutateAsync({ id: entry.id, is_favorite: !entry.is_favorite });
    if (detailModal?.id === entry.id) setDetailModal(updated);
  };

  const handleNextEpisode = async (entry) => {
    const next = (entry.episode || 0) + 1;
    const overflow = entry.episodes_total && next > entry.episodes_total;
    await updateEntry.mutateAsync({
      id: entry.id,
      episode: overflow ? 1 : next,
      season: overflow ? (entry.season || 1) + 1 : entry.season,
    });
  };

  const openDetail = (entry) => setDetailModal(entry);
  const openEdit   = (entry) => { setDetailModal(null); setModal(entry); };

  const displayList = search.trim() ? searchResults : filtered;
  const isSearching = search.trim().length > 0;

  const viewCycle = () => setViewMode(v => v === 'grid' ? 'list' : 'grid');
  const viewIcon = viewMode === 'grid' ? 'list' : 'grid';

  return (
    <>
      {detailModal && (
        <MovieDetailModal
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
          defaultStatus={isStats ? 'watched' : status}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Watchlist"
            sub={isLoading ? '…' : `${entries.length} записей`}
            right={
              <>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Icon name="search" size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Поиск…"
                    style={{ height: 32, paddingLeft: 30, paddingRight: search ? 28 : 10, width: 160, borderRadius: 7, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', transition: 'width 200ms' }}
                    onFocus={e => e.target.style.width = '220px'}
                    onBlur={e => e.target.style.width = '160px'}
                  />
                  {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>}
                </div>
                {!isStats && (
                  <button onClick={viewCycle} title={`Режим: ${viewMode === 'grid' ? 'список' : viewMode === 'list' ? 'стена постеров' : 'сетка'}`} style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elev-2)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                    <Icon name={viewIcon} size={15} />
                  </button>
                )}
                <button onClick={copyShareLink} style={{ height: 32, padding: '0 12px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elev-2)', color: copied ? 'var(--p-openresto)' : 'var(--text-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: 13, transition: 'color 150ms' }}>
                  <Icon name={copied ? 'check' : 'link'} size={14} />
                  {copied ? 'Скопировано' : 'Поделиться'}
                </button>
                <button onClick={() => setModal(false)} style={{ height: 32, padding: '0 14px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--text)', color: 'var(--bg)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  <Icon name="plus" size={14} />Добавить
                </button>
              </>
            }
          />

          {/* Continue watching bar */}
          {!isStats && !isSearching && (
            <ContinueWatchingBar
              entries={entries}
              onDetail={openDetail}
              onNextEpisode={handleNextEpisode}
            />
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', flex: 'none', overflowX: 'auto' }}>
            {ALL_STATUSES.map(s => {
              const count = s.key === 'all' ? entries.length : (statusCounts[s.key] || 0);
              const active = status === s.key;
              return (
                <button key={s.key} onClick={() => { setSearch(''); setSearchParams({ status: s.key, ...(mediaType ? { type: mediaType } : {}) }); }} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', color: active ? 'var(--text)' : 'var(--text-3)', borderBottom: active ? '2px solid var(--p-openresto)' : '2px solid transparent', fontWeight: active ? 500 : 400, transition: 'color 120ms', whiteSpace: 'nowrap', position: 'relative', top: 1, background: 'none', border: 'none' }}>
                  {s.label}
                  {count > 0 && <span style={{ marginLeft: 5, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}</span>}
                </button>
              );
            })}
            <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: 'auto 6px' }} />
            {favCount > 0 && (
              <button onClick={() => setSearchParams({ status, fav: favOnly ? undefined : '1', ...(mediaType ? { type: mediaType } : {}) })} style={{ padding: '11px 14px', fontSize: 13, cursor: 'pointer', color: favOnly ? 'var(--text)' : 'var(--text-3)', borderBottom: favOnly ? '2px solid #F43F5E' : '2px solid transparent', fontWeight: favOnly ? 500 : 400, transition: 'color 120ms', whiteSpace: 'nowrap', position: 'relative', top: 1, background: 'none', border: 'none' }}>
                <Icon name="heart_filled" size={12} style={{ color: '#F43F5E', marginRight: 3 }} /> <span>{favCount}</span>
              </button>
            )}
            <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: 'auto 6px' }} />
            <button onClick={() => { setSearch(''); setSearchParams({ status: 'stats' }); }} style={{ padding: '11px 14px', fontSize: 13, cursor: 'pointer', color: isStats ? 'var(--text)' : 'var(--text-3)', borderBottom: isStats ? '2px solid var(--p-openresto)' : '2px solid transparent', fontWeight: isStats ? 500 : 400, transition: 'color 120ms', whiteSpace: 'nowrap', position: 'relative', top: 1, background: 'none', border: 'none' }}>
              Статистика
            </button>
          </div>

          {/* Media type filter */}
          {!isStats && !isSearching && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 24px', flex: 'none', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
              {MEDIA_TYPES.map(t => (
                <button key={t.key} onClick={() => setSearchParams({ status, ...(t.key ? { type: t.key } : {}), ...(favOnly ? { fav: '1' } : {}) })} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', background: mediaType === t.key ? 'var(--text)' : 'var(--bg-elev-2)', color: mediaType === t.key ? 'var(--bg)' : 'var(--text-3)', border: `1px solid ${mediaType === t.key ? 'transparent' : 'var(--border-subtle)'}`, transition: 'all 80ms', fontFamily: 'inherit', fontWeight: mediaType === t.key ? 500 : 400 }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px' }}>
            {isStats ? (
              <StatsView entries={entries} />
            ) : isSearching ? (
              searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  Ничего не найдено по «{search}»
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, paddingTop: 4 }}>
                    Найдено {searchResults.length} {searchResults.length === 1 ? 'запись' : searchResults.length < 5 ? 'записи' : 'записей'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
                    {searchResults.map(e => (
                      <MovieCard key={e.id} entry={e}
                        onDetail={() => openDetail(e)}
                        onEdit={() => setModal(e)}
                        onDelete={() => deleteEntry.mutate(e.id)}
                        onToggleFav={() => handleToggleFav(e)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, paddingTop: 4 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} style={{ aspectRatio: '2/3', borderRadius: 10, background: 'var(--bg-elev-2)', animation: 'cin-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.08}s` }}>
                    <style>{`@keyframes cin-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState status={status === 'all' ? 'watched' : status} onAdd={() => setModal(false)} />
            ) : viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, paddingTop: 4 }}>
                {filtered.map(e => (
                  <MovieCard key={e.id} entry={e}
                    onDetail={() => openDetail(e)}
                    onEdit={() => setModal(e)}
                    onDelete={() => deleteEntry.mutate(e.id)}
                    onToggleFav={() => handleToggleFav(e)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4 }}>
                {filtered.map(e => (
                  <MovieListRow key={e.id} entry={e}
                    onDetail={() => openDetail(e)}
                    onEdit={() => setModal(e)}
                    onDelete={() => deleteEntry.mutate(e.id)}
                    onToggleFav={() => handleToggleFav(e)}
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
