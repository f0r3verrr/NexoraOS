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

function KindIcon({ kind, size = 34 }) {
  const isNews = kind === 'news';
  return (
    <span style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isNews ? 'color-mix(in oklab, var(--info) 16%, transparent)' : 'color-mix(in oklab, var(--p-openresto) 16%, transparent)',
      color: isNews ? 'var(--info)' : 'var(--p-openresto)',
    }}>
      <Icon name={isNews ? 'globe' : 'zap'} size={size * 0.47} />
    </span>
  );
}

/* Общая анимированная обёртка модалки: blur-затемнение + scale/fade-in ~250мс */
function ModalShell({ children, onClose, width = 460 }) {
  const mousedownOnBackdrop = useRef(false);
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(6,6,8,0.62)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cgBackdropIn 200ms ease-out',
      }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}
    >
      <style>{`
        @keyframes cgBackdropIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cgModalIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        @keyframes cgGlow { 0%, 100% { opacity: 0.35 } 50% { opacity: 0.75 } }
      `}</style>
      <div style={{
        width, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 20,
        boxShadow: 'var(--shadow-modal)', animation: 'cgModalIn 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function CloseButton({ onClose, floating }) {
  return (
    <button onClick={onClose} style={{
      position: 'absolute', top: 14, right: 14, zIndex: 2,
      width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: floating ? 'rgba(10,10,14,0.55)' : 'var(--bg-elev-3)',
      backdropFilter: floating ? 'blur(6px)' : undefined,
      color: floating ? '#fff' : 'var(--text-3)', border: 'none', cursor: 'pointer',
    }}>
      <Icon name="x" size={15} />
    </button>
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
      {item.cover_image_url ? (
        <div style={{ position: 'relative', width: '100%', height: 190, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
          <img src={item.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 25%, rgba(255,255,255,0.28), transparent 70%)',
            animation: 'cgGlow 4.5s ease-in-out infinite', mixBlendMode: 'overlay',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, color-mix(in oklab, var(--bg-elev-2) 90%, transparent) 100%)' }} />
          <CloseButton onClose={onClose} floating />
        </div>
      ) : (
        <CloseButton onClose={onClose} />
      )}

      <div style={{ padding: '22px 26px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <KindIcon kind={item._kind} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
            {isNews ? item.category : <>🚀 NexoraOS <span style={{ fontFamily: 'var(--font-mono)' }}>{item.version}</span></>}
          </div>
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
          {!isNews && item.button_text && item.button_link ? (
            <a href={normalizeUrl(item.button_link)} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textDecoration: 'none' }}>
              {item.button_text}
            </a>
          ) : (
            <button onClick={openArticle} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-3)', cursor: 'pointer' }}>
              Подробнее
            </button>
          )}
          <Button variant="primary" onClick={onClose}>Понятно</Button>
        </div>
      </div>
    </>
  );
}

function BatchList({ items, onClose }) {
  return (
    <div style={{ padding: '26px' }}>
      <CloseButton onClose={onClose} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="bookmark" size={19} style={{ color: 'var(--bg)' }} />
        </span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 650 }}>Что нового</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Вы пропустили {items.length} обновлени{items.length < 5 ? 'я' : 'й'}, пока вас не было
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '46vh', overflowY: 'auto', margin: '18px 0' }}>
        {items.map(item => {
          const isNews = item._kind === 'news';
          return (
            <div key={`${item._kind}-${item.id}`} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 13, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
              <KindIcon kind={item._kind} size={30} />
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
  );
}

export function ChangelogModalHost() {
  const { open, items, dismiss } = useChangelogModal();
  if (!open || items.length === 0) return null;

  return (
    <ModalShell onClose={dismiss} width={items.length === 1 ? 460 : 500}>
      {items.length === 1 ? <SingleItem item={items[0]} onClose={dismiss} /> : <BatchList items={items} onClose={dismiss} />}
    </ModalShell>
  );
}
