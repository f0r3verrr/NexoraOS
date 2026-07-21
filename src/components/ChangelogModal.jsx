import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../icons.jsx';
import { Button, Badge } from './primitives.jsx';
import { useChangelogModal } from '../contexts/ChangelogContext.jsx';
import { normalizeUrl } from '../lib/url.js';

const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };
const PRIORITY_LABEL = { low: 'Патч', normal: 'Обновление', high: 'Важно' };

/* Тонкий шум поверх градиентов — без него плашка "hero" выглядит как плоская
   заливка из стокового UI-кита; с шумом читается как фактурный премиальный фон. */
const GRAIN_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

const HERO_THEME = {
  changelog: {
    a: 'oklch(0.62 0.19 300 / 0.55)',
    b: 'oklch(0.55 0.17 260 / 0.5)',
    icon: 'var(--p-openresto)',
  },
  news: {
    a: 'oklch(0.66 0.16 220 / 0.5)',
    b: 'oklch(0.7 0.13 190 / 0.45)',
    icon: 'var(--info)',
  },
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Списки в описании рендерим как чек-лист с зелёными галочками вместо точек */
const checklistComponents = {
  ul: ({ children }) => <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</ul>,
  li: ({ children }) => (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
      <span style={{
        width: 16, height: 16, borderRadius: 5, background: 'color-mix(in oklab, var(--success) 18%, transparent)',
        color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        <Icon name="check" size={10} stroke={3} />
      </span>
      <span>{children}</span>
    </li>
  ),
};

/* Общая анимированная обёртка модалки: blur-затемнение с лёгким цветным виньеттом + scale/fade-in ~250мс */
function ModalShell({ children, onClose, width = 460, theme }) {
  const mousedownOnBackdrop = useRef(false);
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: `radial-gradient(ellipse 70% 50% at 50% 8%, color-mix(in oklab, ${theme.a} 22%, transparent), transparent 60%), rgba(6,6,8,0.66)`,
        backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cgBackdropIn 220ms ease-out',
      }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}
    >
      <style>{`
        @keyframes cgBackdropIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cgModalIn { from { opacity: 0; transform: scale(0.95) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes cgGlowDrift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.9 }
          50% { transform: translate3d(2%, -3%, 0) scale(1.08); opacity: 1 }
        }
      `}</style>
      <div style={{
        width, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--bg-elev-2)',
        border: '1px solid var(--border)',
        borderRadius: 22,
        boxShadow: `var(--shadow-modal), 0 0 0 1px color-mix(in oklab, ${theme.a} 30%, transparent)`,
        animation: 'cgModalIn 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function CloseButton({ onClose }) {
  return (
    <button onClick={onClose} style={{
      position: 'absolute', top: 14, right: 14, zIndex: 2,
      width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,14,0.5)', backdropFilter: 'blur(6px)',
      color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
    }}>
      <Icon name="x" size={15} />
    </button>
  );
}

/* Hero-плашка сверху: обложка (если есть) ИЛИ фирменный градиентный фон с шумом
   и медленным дрейфом свечения — модалка выглядит "дорого" даже без картинки. */
function Hero({ item, onClose }) {
  const theme = HERO_THEME[item._kind] ?? HERO_THEME.changelog;
  const isNews = item._kind === 'news';

  return (
    <div style={{ position: 'relative', width: '100%', height: 154, borderRadius: '22px 22px 0 0', overflow: 'hidden' }}>
      {item.cover_image_url ? (
        <img src={item.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-elev-3)' }} />
      )}

      <div style={{
        position: 'absolute', inset: '-20%',
        background: `radial-gradient(45% 65% at 20% 15%, ${theme.a}, transparent 65%), radial-gradient(50% 70% at 88% 90%, ${theme.b}, transparent 60%)`,
        animation: 'cgGlowDrift 7s ease-in-out infinite',
        mixBlendMode: item.cover_image_url ? 'overlay' : 'normal',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay',
        backgroundImage: `url("${GRAIN_URL}")`,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--bg-elev-2) 92%, transparent) 100%)' }} />

      <span style={{
        position: 'absolute', left: 20, bottom: 16,
        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(12,12,16,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)',
        color: theme.icon,
      }}>
        <Icon name={isNews ? 'globe' : 'zap'} size={18} />
      </span>

      <CloseButton onClose={onClose} />
    </div>
  );
}

function SingleItem({ item, onClose }) {
  const navigate = useNavigate();
  const isNews = item._kind === 'news';

  const openArticle = () => {
    onClose();
    navigate(`/whats-new?tab=${isNews ? 'news' : 'changelog'}`);
  };

  return (
    <>
      <Hero item={item} onClose={onClose} />

      <div style={{ padding: '18px 26px 26px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>
          {isNews ? item.category : <>🚀 NexoraOS <span style={{ fontFamily: 'var(--font-mono)' }}>{item.version}</span></>}
        </div>

        <div style={{ fontSize: 19, fontWeight: 650, letterSpacing: '-0.015em', marginBottom: 6 }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {!isNews && <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(isNews ? item.created_at : item.release_date)}</span>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 18 }} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.02em', marginBottom: 12 }}>
          ✨ Что нового
        </div>
        <div className="md-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={checklistComponents}>{item.description}</ReactMarkdown>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '20px 0 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {!isNews && item.button_text && item.button_link && (
              <a href={normalizeUrl(item.button_link)} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none' }}>
                {item.button_text}
                <Icon name="external" size={12} />
              </a>
            )}
            <button onClick={openArticle} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-3)', cursor: 'pointer' }}>
              Подробнее
            </button>
          </div>
          <Button variant="primary" onClick={onClose}>Понятно</Button>
        </div>
      </div>
    </>
  );
}

function BatchList({ items, onClose }) {
  const theme = HERO_THEME.changelog;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', padding: '26px 26px 20px', overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
        <div style={{
          position: 'absolute', inset: '-30%',
          background: `radial-gradient(45% 70% at 10% 0%, ${theme.a}, transparent 65%), radial-gradient(45% 70% at 95% 100%, ${theme.b}, transparent 60%)`,
          animation: 'cgGlowDrift 7s ease-in-out infinite',
        }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'overlay', backgroundImage: `url("${GRAIN_URL}")` }} />

        <CloseButton onClose={onClose} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(12,12,16,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="bookmark" size={19} style={{ color: theme.icon }} />
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 650 }}>Что нового</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Вы пропустили {items.length} обновлени{items.length < 5 ? 'я' : 'й'}, пока вас не было
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 26px 26px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '46vh', overflowY: 'auto', margin: '18px 0' }}>
          {items.map(item => {
            const isNews = item._kind === 'news';
            return (
              <div key={`${item._kind}-${item.id}`} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 13, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isNews ? 'color-mix(in oklab, var(--info) 16%, transparent)' : 'color-mix(in oklab, var(--p-openresto) 16%, transparent)',
                  color: isNews ? 'var(--info)' : 'var(--p-openresto)',
                }}>
                  <Icon name={isNews ? 'globe' : 'zap'} size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    {!isNews && <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{item.version}</span>}
                    {isNews && <Badge tone="info">{item.category}</Badge>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(isNews ? item.created_at : item.release_date)}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 550 }}>{item.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>Прочитать всё</Button>
        </div>
      </div>
    </div>
  );
}

export function ChangelogModalHost() {
  const { open, items, dismiss } = useChangelogModal();
  if (!open || items.length === 0) return null;

  const single = items.length === 1;
  const theme = single ? (HERO_THEME[items[0]._kind] ?? HERO_THEME.changelog) : HERO_THEME.changelog;

  return (
    <ModalShell onClose={dismiss} width={single ? 460 : 500} theme={theme}>
      {single ? <SingleItem item={items[0]} onClose={dismiss} /> : <BatchList items={items} onClose={dismiss} />}
    </ModalShell>
  );
}
