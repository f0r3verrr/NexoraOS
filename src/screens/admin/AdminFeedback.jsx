import { useEffect, useRef, useState } from 'react';
import { Modal, Field, fieldStyle } from '../../components/Modal.jsx';
import { AttachmentButton, PendingAttachments, AttachmentGrid } from '../../components/FeedbackAttachments.jsx';
import { uploadFeedbackFiles } from '../../lib/feedbackAttachments.js';
import {
  useFeedbackAdmin, useSetFeedbackStatus, useSetFeedbackPriority, useSetFeedbackArchived,
  useReplyFeedback, useFeedbackThread,
} from '../../hooks/admin/useFeedbackAdmin.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { Icon } from '../../icons.jsx';
import { fmtRel, fmtDateTime } from '../../lib/adminFormat.js';

const TYPE_LABEL = { bug: 'Баг', feature: 'Фича', question: 'Вопрос', other: 'Другое' };
const TYPE_TONE = { bug: 'danger', feature: 'success', question: 'info', other: 'neutral' };
const PRIORITY_LABEL = { low: 'Низкий', normal: 'Средний', high: 'Высокий', urgent: 'Срочно' };
const COLUMNS = [
  { status: 'open', label: 'Открыто', dot: 'var(--danger)' },
  { status: 'in_progress', label: 'В работе', dot: 'var(--warn)' },
  { status: 'closed', label: 'Закрыто', dot: 'var(--success)' },
];

function Bubble({ own, body, attachments, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: own ? 'flex-end' : 'flex-start' }}>
        {!own && <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Пользователь</span>}
        {body && (
          <div style={{
            padding: '9px 13px',
            borderRadius: own ? '13px 13px 4px 13px' : '13px 13px 13px 4px',
            background: own ? 'var(--p-openresto)' : 'var(--bg-elev-3)',
            color: own ? 'var(--bg)' : 'var(--text)',
            fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {body}
          </div>
        )}
        <AttachmentGrid files={attachments} size={84} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDateTime(time)}</span>
      </div>
    </div>
  );
}

function FeedbackDetail({ item, onClose }) {
  const setStatus = useSetFeedbackStatus();
  const setPriority = useSetFeedbackPriority();
  const setArchived = useSetFeedbackArchived();
  const reply = useReplyFeedback();
  const { data: thread = [] } = useFeedbackThread(item.id);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);

  const busy = reply.isPending || uploading;

  const send = async () => {
    const text = body.trim();
    if ((!text && !files.length) || busy) return;
    try {
      let attachments = [];
      if (files.length) {
        setUploading(true);
        attachments = await uploadFeedbackFiles(files, item.user_id, item.id);
      }
      reply.mutate({ id: item.id, body: text, attachments }, { onSuccess: () => { setBody(''); setFiles([]); } });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={item.title} sub={item.user_email} width={540} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Статус">
            <select defaultValue={item.status} onChange={e => setStatus.mutate({ id: item.id, status: e.target.value })} style={fieldStyle}>
              {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Приоритет">
            <select defaultValue={item.priority} onChange={e => setPriority.mutate({ id: item.id, priority: e.target.value })} style={fieldStyle}>
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <span style={{ flex: 1 }} />
          <AdminButton
            variant="ghost"
            onClick={() => { setArchived.mutate({ id: item.id, archived: !item.archived }); onClose(); }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="archive" size={14} /> {item.archived ? 'Из архива' : 'В архив'}
            </span>
          </AdminButton>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto',
          padding: '4px 4px 2px', background: 'var(--bg-elev-1)', borderRadius: 12, border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ padding: '10px 10px 0' }}><Bubble body={item.body} attachments={item.attachments} time={item.created_at} /></div>
          <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {thread.map(r => <Bubble key={r.id} own={r.is_admin} body={r.body} attachments={r.attachments} time={r.created_at} />)}
          </div>
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PendingAttachments files={files} onChange={setFiles} />
          <div style={{ display: 'flex', gap: 8 }}>
            <AttachmentButton files={files} onChange={setFiles} disabled={busy} />
            <textarea
              value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder="Написать пользователю…"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              style={{ ...fieldStyle, flex: 1, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
            />
            <AdminButton variant="primary" disabled={(!body.trim() && !files.length) || busy} onClick={send} style={{ alignSelf: 'flex-end' }}>
              {uploading ? 'Загрузка…' : 'Отправить'}
            </AdminButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function FeedbackColumn({ col, items, dragId, onDragStart, onDrop, onOpen, onArchive }) {
  const [isDragOver, setIsDragOver] = useState(false);
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(col.status); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: col.dot }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{items.length}</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10, minHeight: 60, borderRadius: 14, padding: 4,
        background: isDragOver ? 'color-mix(in oklab, var(--p-openresto) 8%, transparent)' : 'transparent',
        border: isDragOver ? '1.5px dashed color-mix(in oklab, var(--p-openresto) 45%, transparent)' : '1.5px dashed transparent',
        transition: 'background 120ms, border-color 120ms',
      }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 8px' }}>Пусто</div>
        ) : items.map(it => (
          <div
            key={it.id}
            draggable
            onDragStart={() => onDragStart(it.id)}
            onClick={() => onOpen(it)}
            style={{
              position: 'relative', cursor: 'grab', padding: 15, borderRadius: 13, background: 'var(--bg-elev-1)',
              border: `1px solid ${dragId === it.id ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
              display: 'flex', flexDirection: 'column', gap: 9,
              opacity: dragId === it.id ? 0.5 : 1, userSelect: 'none',
            }}
          >
            <button
              onClick={e => { e.stopPropagation(); onArchive(it.id); }}
              title="В архив"
              style={{
                position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 7, border: 'none',
                background: 'var(--bg-elev-3)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Icon name="archive" size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 24 }}>
              <Badge tone={TYPE_TONE[it.type]}>{TYPE_LABEL[it.type]}</Badge>
              <span style={{ flex: 1 }} />
              <Badge tone="neutral">{PRIORITY_LABEL[it.priority]}</Badge>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{it.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{it.user_email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.attachments?.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="paperclip" size={11} />{it.attachments.length}</span>
                )}
                {fmtRel(it.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchiveList({ items, isLoading, onOpen, onRestore }) {
  if (isLoading) return <EmptyState icon="archive" text="Загрузка..." />;
  if (items.length === 0) return <EmptyState icon="archive" text="Архив пуст" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(it => (
        <div key={it.id} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 13,
          background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
        }} onClick={() => onOpen(it)}>
          <Badge tone={TYPE_TONE[it.type]}>{TYPE_LABEL[it.type]}</Badge>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{it.user_email}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtRel(it.created_at)}</span>
          <AdminButton variant="secondary" onClick={e => { e.stopPropagation(); onRestore(it.id); }}>
            Восстановить
          </AdminButton>
        </div>
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [view, setView] = useState('board');
  const { data: items = [], isLoading } = useFeedbackAdmin(null, false);
  const { data: archivedItems = [], isLoading: archivedLoading } = useFeedbackAdmin(null, true);
  const setStatus = useSetFeedbackStatus();
  const setArchived = useSetFeedbackArchived();
  const [selected, setSelected] = useState(null);
  const [dragId, setDragId] = useState(null);

  const byStatus = (status) => items.filter(i => i.status === status);

  const handleDrop = (status) => {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const item = items.find(i => i.id === id);
    if (!item || item.status === status) return;
    setStatus.mutate({ id, status });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selected && <FeedbackDetail item={selected} onClose={() => setSelected(null)} />}

      <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, alignSelf: 'flex-start' }}>
        {[{ id: 'board', label: 'Доска' }, { id: 'archive', label: `Архив${archivedItems.length ? ` (${archivedItems.length})` : ''}` }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            height: 30, padding: '0 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
            background: view === t.id ? 'var(--bg-elev-3)' : 'transparent',
            color: view === t.id ? 'var(--text)' : 'var(--text-3)',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'board' ? (
        isLoading ? (
          <EmptyState icon="message" text="Загрузка..." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <FeedbackColumn
                key={col.status} col={col} items={byStatus(col.status)}
                dragId={dragId} onDragStart={setDragId} onDrop={handleDrop} onOpen={setSelected}
                onArchive={id => setArchived.mutate({ id, archived: true })}
              />
            ))}
          </div>
        )
      ) : (
        <ArchiveList
          items={archivedItems} isLoading={archivedLoading} onOpen={setSelected}
          onRestore={id => setArchived.mutate({ id, archived: false })}
        />
      )}
    </div>
  );
}
