import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Tabs, Badge } from '../components/primitives.jsx';
import { Icon } from '../icons.jsx';
import { useAllChangelog } from '../hooks/useChangelog.js';
import { useNewsPublic } from '../hooks/useNews.js';

const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };
const TABS = ['Обновления', 'Новости'];

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ChangelogTab() {
  const { data: entries = [], isLoading } = useAllChangelog();
  if (isLoading) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Загрузка…</div>;
  if (entries.length === 0) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Пока нет опубликованных обновлений</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {entries.map(c => (
        <div key={c.id} style={{ padding: 22, borderRadius: 12, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{c.version}</span>
            <Badge tone={PRIORITY_TONE[c.priority]}>{c.priority === 'high' ? 'Важно' : c.priority === 'low' ? 'Патч' : 'Обновление'}</Badge>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(c.release_date)}</span>
          </div>
          {c.cover_image_url && <img src={c.cover_image_url} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />}
          <div style={{ fontSize: 16, fontWeight: 550, marginBottom: 8 }}>{c.title}</div>
          <div className="md-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.description}</ReactMarkdown>
          </div>
          {c.button_text && c.button_link && (
            <a href={c.button_link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--p-openresto)' }}>{c.button_text} →</a>
          )}
        </div>
      ))}
    </div>
  );
}

function NewsTab() {
  const { data: news = [], isLoading } = useNewsPublic();
  if (isLoading) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Загрузка…</div>;
  if (news.length === 0) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Пока нет новостей</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
      {news.map(n => (
        <div key={n.id} style={{ padding: 20, borderRadius: 12, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-elev-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={n.icon} size={14} />
            </span>
            <Badge tone="info">{n.category}</Badge>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(n.created_at)}</span>
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 550 }}>{n.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{n.description}</div>
        </div>
      ))}
    </div>
  );
}

export default function WhatsNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'Новости' ? 'Новости' : 'Обновления';

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Что нового" sub="Обновления продукта и новости" />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 60px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Tabs items={TABS} active={tab} onSelect={(t) => setSearchParams({ tab: t })} />
            {tab === 'Обновления' ? <ChangelogTab /> : <NewsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
