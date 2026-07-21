import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../icons.jsx';
import { Button, Badge } from './primitives.jsx';
import { useChangelogModal } from '../contexts/ChangelogContext.jsx';
import { normalizeUrl } from '../lib/url.js';
import {
  PRIORITY_TONE, PRIORITY_LABEL, HERO_THEME, HERO_KEYFRAMES, GRAIN_URL,
  fmtDate, checklistComponents, HeroBanner, CloseButton,
} from '../lib/changelogVisuals.jsx';

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
      <style>{HERO_KEYFRAMES}</style>
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

function SingleItem({ item, onClose }) {
  const navigate = useNavigate();
  const isNews = item._kind === 'news';

  const openArticle = () => {
    onClose();
    navigate(`/whats-new?tab=${isNews ? 'news' : 'changelog'}&item=${item.id}`);
  };

  return (
    <>
      <HeroBanner kind={item._kind} coverUrl={item.cover_image_url} onClose={onClose} />

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
  const navigate = useNavigate();
  const theme = HERO_THEME.changelog;

  const openItem = item => {
    onClose();
    navigate(`/whats-new?tab=${item._kind === 'news' ? 'news' : 'changelog'}&item=${item.id}`);
  };

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
              <button key={`${item._kind}-${item.id}`} onClick={() => openItem(item)} style={{
                display: 'flex', gap: 12, padding: 14, borderRadius: 13, background: 'var(--bg-elev-1)',
                border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer', width: '100%',
              }}>
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
                <Icon name="chevron_down" size={14} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)', flexShrink: 0, marginTop: 6 }} />
              </button>
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
