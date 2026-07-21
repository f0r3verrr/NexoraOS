import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Badge } from '../components/primitives.jsx';
import { Icon } from '../icons.jsx';
import { useAllChangelog } from '../hooks/useChangelog.js';
import { useNewsPublic } from '../hooks/useNews.js';
import { normalizeUrl } from '../lib/url.js';

const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };
const PRIORITY_LABEL = { low: 'Патч', normal: 'Обновление', high: 'Важно' };
const PRIORITY_ACCENT = { low: '--text-muted', normal: '--p-openresto', high: '--danger' };
const TABS = [
  { id: 'changelog', label: 'Обновления', icon: 'bookmark' },
  { id: 'news', label: 'Новости', icon: 'globe' },
];

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

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

function ChangelogTab() {
  const { data: entries = [], isLoading } = useAllChangelog();
  if (isLoading) return <EmptyState icon="bookmark" text="Загрузка…" />;
  if (entries.length === 0) return <EmptyState icon="bookmark" text="Пока нет опубликованных обновлений" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {entries.map(c => (
        <div key={c.id} style={{
          padding: 26, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
          borderLeft: `3px solid var(${PRIORITY_ACCENT[c.priority]})`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, padding: '4px 11px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{c.version}</span>
            <Badge tone={PRIORITY_TONE[c.priority]}>{PRIORITY_LABEL[c.priority]}</Badge>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(c.release_date)}</span>
          </div>
          {c.cover_image_url && <img src={c.cover_image_url} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 16, display: 'block' }} />}
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, letterSpacing: '-0.01em' }}>{c.title}</div>
          <div className="md-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.description}</ReactMarkdown>
          </div>
          {c.button_text && c.button_link && (
            <a href={normalizeUrl(c.button_link)} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, fontWeight: 500, color: 'var(--p-openresto)', textDecoration: 'none' }}>
              {c.button_text} <Icon name="arrow_right" size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function NewsTab() {
  const { data: news = [], isLoading } = useNewsPublic();
  if (isLoading) return <EmptyState icon="globe" text="Загрузка…" />;
  if (news.length === 0) return <EmptyState icon="globe" text="Пока нет новостей" />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
      {news.map(n => (
        <div key={n.id} style={{ padding: 22, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in oklab, var(--info) 16%, transparent)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={n.icon} size={15} />
            </span>
            <Badge tone="info">{n.category}</Badge>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(n.created_at)}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 550 }}>{n.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{n.description}</div>
        </div>
      ))}
    </div>
  );
}

export default function WhatsNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'news' ? 'news' : 'changelog';

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Что нового" sub="Обновления продукта и новости" />
        <main className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 60px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            {tab === 'changelog' ? <ChangelogTab /> : <NewsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
