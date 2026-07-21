import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../icons.jsx';
import { Modal } from './Modal.jsx';
import { Button, Badge } from './primitives.jsx';
import { useChangelogModal } from '../contexts/ChangelogContext.jsx';
import { normalizeUrl } from '../lib/url.js';

const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };
const PRIORITY_LABEL = { low: 'Патч', normal: 'Обновление', high: 'Важно' };

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

function KindIcon({ kind }) {
  const isNews = kind === 'news';
  return (
    <span style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isNews ? 'color-mix(in oklab, var(--info) 16%, transparent)' : 'color-mix(in oklab, var(--p-openresto) 16%, transparent)',
      color: isNews ? 'var(--info)' : 'var(--p-openresto)',
    }}>
      <Icon name={isNews ? 'globe' : 'bookmark'} size={16} />
    </span>
  );
}

export function ChangelogModalHost() {
  const { open, items, dismiss } = useChangelogModal();
  if (!open || items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0];
    const isNews = item._kind === 'news';
    return (
      <Modal onClose={dismiss} width={480} title="">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {item.cover_image_url && (
            <img src={item.cover_image_url} alt=""
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <KindIcon kind={item._kind} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {!isNews && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{item.version}</span>}
                {isNews && <Badge tone="info">{item.category}</Badge>}
                {!isNews && <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>}
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(isNews ? item.created_at : item.release_date)}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em' }}>{item.title}</div>
            </div>
          </div>
          <div className="md-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {!isNews && item.button_text && item.button_link && (
              <a href={normalizeUrl(item.button_link)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">{item.button_text}</Button>
              </a>
            )}
            <Button variant="primary" onClick={dismiss}>Понятно</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={dismiss} width={500} title="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bookmark" size={18} style={{ color: 'var(--bg)' }} />
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Что нового</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Вы пропустили {items.length} обновлени{items.length < 5 ? 'я' : 'й'}, пока вас не было</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '48vh', overflowY: 'auto', marginTop: 14 }}>
          {items.map(item => {
            const isNews = item._kind === 'news';
            return (
              <div key={`${item._kind}-${item.id}`} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
                <KindIcon kind={item._kind} />
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="primary" onClick={dismiss}>Прочитать всё</Button>
        </div>
      </div>
    </Modal>
  );
}
