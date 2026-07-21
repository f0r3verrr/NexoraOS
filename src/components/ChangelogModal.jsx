import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from './Modal.jsx';
import { Button } from './primitives.jsx';
import { useChangelogModal } from '../contexts/ChangelogContext.jsx';

const PRIORITY_LABEL = { low: 'Низкий', normal: 'Обновление', high: 'Важно' };

export function ChangelogModalHost() {
  const { open, unread, dismiss } = useChangelogModal();
  if (!open || unread.length === 0) return null;

  if (unread.length === 1) {
    const c = unread[0];
    return (
      <Modal title={c.title} sub={`${c.version} · ${PRIORITY_LABEL[c.priority] ?? c.priority}`} width={480} onClose={dismiss}>
        {c.cover_image_url && (
          <img src={c.cover_image_url} alt="" style={{ width: '100%', borderRadius: 10, display: 'block' }} />
        )}
        <div className="md-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.description}</ReactMarkdown>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          {c.button_text && c.button_link && (
            <a href={c.button_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">{c.button_text}</Button>
            </a>
          )}
          <Button variant="primary" onClick={dismiss}>Закрыть</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Что нового" sub={`Вы пропустили ${unread.length} обновлени${unread.length < 5 ? 'я' : 'й'}`} width={480} onClose={dismiss}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '50vh', overflowY: 'auto' }}>
        {unread.map(c => (
          <div key={c.id} style={{ paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{c.version}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 550, marginBottom: 4 }}>{c.title}</div>
            <div className="md-preview" style={{ fontSize: 12.5 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.description}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="primary" onClick={dismiss}>Прочитать всё</Button>
      </div>
    </Modal>
  );
}
