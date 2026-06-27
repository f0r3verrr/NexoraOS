import { useParams } from 'react-router-dom';
import { usePublicCinema } from '../hooks/useCinema.js';

const STATUS_ORDER = ['watching', 'watched', 'watchlist', 'waiting', 'dropped'];
const STATUS_LABEL = {
  watching:  'Смотрю сейчас',
  watched:   'Просмотрено',
  watchlist: 'Хочу посмотреть',
  waiting:   'Жду новый сезон',
  dropped:   'Брошено',
};
const STATUS_ICON = {
  watching: '▶',
  watched: '✓',
  watchlist: '♥',
  waiting: '⏳',
  dropped: '✕',
};

/* ---- Single poster card ---- */
function PosterCard({ entry }) {
  return (
    <div
      style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden',
        aspectRatio: '2/3', background: '#161622',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.7)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
      }}
    >
      {entry.poster_url ? (
        <img
          src={entry.poster_url}
          alt={entry.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(145deg, #1e1e2e 0%, #12121a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 10, padding: '0 16px',
        }}>
          <div style={{ fontSize: 28, opacity: 0.2 }}>🎬</div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.4 }}>
            {entry.title}
          </span>
        </div>
      )}

      {/* Bottom gradient with title */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        padding: '28px 10px 10px',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 2,
        }}>
          {entry.title}
        </div>
        {entry.year && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{entry.year}</div>
        )}
      </div>

      {/* Rating badges */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entry.my_rating != null && (
          <div style={{
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
            borderRadius: 7, padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(245,197,24,0.25)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>{entry.my_rating}</span>
            <span style={{ fontSize: 10, color: '#F5C518', lineHeight: 1 }}>★</span>
          </div>
        )}
        {entry.kp_rating != null && entry.my_rating == null && (
          <div style={{
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
            borderRadius: 7, padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(255,144,0,0.25)',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1, marginRight: 1 }}>КП</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>{entry.kp_rating}</span>
            <span style={{ fontSize: 10, color: '#FF9000', lineHeight: 1 }}>★</span>
          </div>
        )}
      </div>

      {/* Genre pills (top-left) */}
      {entry.genres?.length > 0 && (
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {entry.genres.slice(0, 1).map(g => (
            <span key={g} style={{
              fontSize: 9, color: 'rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              padding: '2px 6px', borderRadius: 4, letterSpacing: '0.02em',
            }}>
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Section ---- */
function Section({ statusKey, items }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>{STATUS_ICON[statusKey]}</span>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {STATUS_LABEL[statusKey]}
        </h2>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.06)',
          padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace',
        }}>
          {items.length}
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)', marginLeft: 4 }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 14,
      }}>
        {items.map(e => <PosterCard key={e.id} entry={e} />)}
      </div>
    </section>
  );
}

/* ---- Public page ---- */
export default function CinemaPublic() {
  const { userId } = useParams();
  const { data: entries = [], isLoading, isError } = usePublicCinema(userId);

  const grouped = STATUS_ORDER
    .map(key => ({ key, items: entries.filter(e => e.status === key) }))
    .filter(g => g.items.length > 0);

  const watchedCount   = entries.filter(e => e.status === 'watched').length;
  const avgRating      = (() => {
    const rated = entries.filter(e => e.my_rating);
    if (!rated.length) return null;
    return (rated.reduce((s, e) => s + e.my_rating, 0) / rated.length).toFixed(1);
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c14', color: 'white' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c14; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Hero header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0f2e 50%, #0f1520 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Subtle glow orbs */}
        <div style={{ position: 'absolute', top: -60, left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 40px', position: 'relative' }}>
          {/* Logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flex: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
            }}>
              🎬
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Watchlist
              </h1>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                публичная коллекция
              </div>
            </div>
          </div>

          {/* Stats row */}
          {!isLoading && entries.length > 0 && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1, fontFamily: 'monospace' }}>{entries.length}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>всего записей</div>
              </div>
              {watchedCount > 0 && (
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1, fontFamily: 'monospace' }}>{watchedCount}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>просмотрено</div>
                </div>
              )}
              {avgRating && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#F5C518', fontFamily: 'monospace' }}>{avgRating}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/10</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>средняя оценка</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        {isLoading ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14,
          }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ aspectRatio: '2/3', borderRadius: 12, background: 'rgba(255,255,255,0.05)', animation: `pub-pulse 1.6s ease-in-out ${i * 0.07}s infinite` }} />
            ))}
            <style>{`@keyframes pub-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>
            Не удалось загрузить список
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>
            Список пока пустой
          </div>
        ) : (
          grouped.map(g => <Section key={g.key} statusKey={g.key} items={g.items} />)
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '20px 0 28px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 11, color: 'rgba(255,255,255,0.12)',
        letterSpacing: '0.06em',
      }}>
        NEXORAOS
      </div>
    </div>
  );
}
