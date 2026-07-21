import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Badge } from '../components/primitives.jsx';
import { Icon } from '../icons.jsx';
import { useAllChangelog } from '../hooks/useChangelog.js';
import { useNewsPublic } from '../hooks/useNews.js';
import { normalizeUrl } from '../lib/url.js';
import {
  PRIORITY_TONE, PRIORITY_LABEL, HERO_KEYFRAMES,
  fmtDate, excerpt, checklistComponents, HeroBanner,
} from '../lib/changelogVisuals.jsx';

const PRIORITY_ACCENT = { low: '--text-muted', normal: '--p-openresto', high: '--danger' };
const TABS = [
  { id: 'changelog', label: 'Обновления', icon: 'bookmark' },
  { id: 'news', label: 'Новости', icon: 'globe' },
];

function EmptyState({ icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px', color: 'var(--text-muted)' }}>
      <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-elev-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} />
      </span>
      <span style={{ fontSize: 13.5 }}>{text}</span>
    </div>
  );
}

/* Компактная плитка списка — только заголовок + короткое превью, полный
   текст открывается в ItemDetailModal по клику "Подробнее". */
function Tile({ kind, item, onOpen }) {
  const isNews = kind === 'news';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10, padding: 18, borderRadius: 15,
      background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
      borderLeft: `3px solid var(${isNews ? '--info' : PRIORITY_ACCENT[item.priority]})`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {isNews ? (
          <Badge tone="info">{item.category}</Badge>
        ) : (
          <>
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{item.version}</span>
            <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
          </>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(isNews ? item.created_at : item.release_date)}</span>
      </div>

      <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{item.title}</div>
      <div style={{
        fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {excerpt(item.description, 150)}
      </div>

      <button onClick={() => onOpen(item)} style={{
        alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
        background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: 'var(--p-openresto)', cursor: 'pointer',
      }}>
        Подробнее <Icon name="arrow_right" size={13} />
      </button>
    </div>
  );
}

function ChangelogTab({ onOpen }) {
  const { data: entries = [], isLoading } = useAllChangelog();
  if (isLoading) return <EmptyState icon="bookmark" text="Загрузка…" />;
  if (entries.length === 0) return <EmptyState icon="bookmark" text="Пока нет опубликованных обновлений" />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {entries.map(c => <Tile key={c.id} kind="changelog" item={c} onOpen={onOpen} />)}
    </div>
  );
}

function NewsTab({ onOpen }) {
  const { data: news = [], isLoading } = useNewsPublic();
  if (isLoading) return <EmptyState icon="globe" text="Загрузка…" />;
  if (news.length === 0) return <EmptyState icon="globe" text="Пока нет новостей" />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {news.map(n => <Tile key={n.id} kind="news" item={n} onOpen={onOpen} />)}
    </div>
  );
}

function ItemDetailModal({ item, kind, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const isNews = kind === 'news';
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(6,6,8,0.66)',
        backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cgBackdropIn 220ms ease-out',
      }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}
    >
      <style>{HERO_KEYFRAMES}</style>
      <div style={{
        width: 560, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 22,
        boxShadow: 'var(--shadow-modal)', animation: 'cgModalIn 260ms cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative',
      }}>
        <HeroBanner kind={kind} coverUrl={item.cover_image_url} onClose={onClose} height={200} />
        <div style={{ padding: '20px 28px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>
            {isNews ? item.category : <>🚀 NexoraOS <span style={{ fontFamily: 'var(--font-mono)' }}>{item.version}</span></>}
          </div>
          <div style={{ fontSize: 21, fontWeight: 650, letterSpacing: '-0.015em', marginBottom: 6 }}>{item.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {!isNews && <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(isNews ? item.created_at : item.release_date)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 18 }} />
          <div className="md-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={checklistComponents}>{item.description}</ReactMarkdown>
          </div>
          {!isNews && item.button_text && item.button_link && (
            <>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '20px 0 18px' }} />
              <a href={normalizeUrl(item.button_link)} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--p-openresto)', textDecoration: 'none' }}>
                {item.button_text} <Icon name="arrow_right" size={13} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WhatsNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'news' ? 'news' : 'changelog';
  const itemId = searchParams.get('item');

  const { data: changelog = [] } = useAllChangelog();
  const { data: news = [] } = useNewsPublic();

  const openItem = item => setSearchParams({ tab, item: item.id });
  const closeItem = () => setSearchParams({ tab });

  const active = itemId
    ? (tab === 'news' ? news : changelog).find(i => String(i.id) === String(itemId))
    : null;

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Что нового" sub="Обновления продукта и новости" />
        <main className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 60px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 11, alignSelf: 'flex-start' }}>
              {TABS.map(t => {
                const isActive = t.id === tab;
                return (
                  <button key={t.id} onClick={() => setSearchParams({ tab: t.id })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 16px', borderRadius: 8,
                      border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      background: isActive ? 'var(--bg-elev-3)' : 'transparent',
                      color: isActive ? 'var(--text)' : 'var(--text-3)', transition: 'background 100ms, color 100ms',
                    }}>
                    <Icon name={t.icon} size={14} /> {t.label}
                  </button>
                );
              })}
            </div>
            {tab === 'changelog' ? <ChangelogTab onOpen={openItem} /> : <NewsTab onOpen={openItem} />}
          </div>
        </main>
      </div>
      {active && <ItemDetailModal item={active} kind={tab} onClose={closeItem} />}
    </div>
  );
}
