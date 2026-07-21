import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Button, Badge } from '../components/primitives.jsx';
import { Modal, Field, fieldStyle } from '../components/Modal.jsx';
import { Icon } from '../icons.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  useMyFeedback, useFeedbackItem, useFeedbackThread, useCreateFeedback, useSendFeedbackReply,
} from '../hooks/useFeedback.js';
import { fmtRel, fmtDateTime } from '../lib/adminFormat.js';
import { uploadFeedbackFiles } from '../lib/feedbackAttachments.js';
import { AttachmentPicker, AttachmentGrid } from '../components/FeedbackAttachments.jsx';

const TYPE_LABEL = { bug: 'Баг', feature: 'Фича', question: 'Вопрос', other: 'Другое' };
const TYPE_TONE = { bug: 'danger', feature: 'success', question: 'info', other: 'neutral' };
const STATUS_LABEL = { open: 'Открыто', in_progress: 'В работе', closed: 'Закрыто' };
const STATUS_TONE = { open: 'danger', in_progress: 'warn', closed: 'success' };
const TYPES = ['bug', 'feature', 'question', 'other'];

function EmptyState({ icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '70px 20px', color: 'var(--text-muted)' }}>
      <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-elev-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} />
      </span>
      <span style={{ fontSize: 13.5 }}>{text}</span>
    </div>
  );
}

function NewTicketModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const create = useCreateFeedback();
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const busy = create.isPending || uploading;

  const submit = async () => {
    if (!title.trim() || !body.trim() || busy) return;
    setError(null);
    const ticketId = crypto.randomUUID();
    try {
      let attachments = [];
      if (files.length) {
        setUploading(true);
        attachments = await uploadFeedbackFiles(files, user.id, ticketId);
      }
      create.mutate({ id: ticketId, type, title: title.trim(), body: body.trim(), attachments }, {
        onSuccess: (row) => onCreated(row.id),
        onError: () => setError('Не удалось отправить, попробуйте позже'),
      });
    } catch (e) {
      setError(e.message || 'Не удалось загрузить вложение');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Новое обращение" sub="Опишите проблему или предложение — мы ответим прямо здесь" width={460} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Тип обращения">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                height: 32, padding: '0 14px', borderRadius: 8,
                border: `1px solid ${type === t ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                background: type === t ? 'var(--bg-elev-3)' : 'var(--bg-elev-1)',
                color: type === t ? 'var(--text)' : 'var(--text-2)', fontSize: 13, cursor: 'pointer',
              }}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Заголовок">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Коротко опишите суть" style={fieldStyle} />
        </Field>
        <Field label="Подробности">
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Расскажите подробнее…"
            style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <Field label="Вложения">
          <AttachmentPicker files={files} onChange={setFiles} disabled={busy} />
        </Field>
        {error && <div style={{ fontSize: 12.5, color: 'var(--danger)' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" disabled={busy || !title.trim() || !body.trim()} onClick={submit}>
            {uploading ? 'Загрузка файлов…' : create.isPending ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TicketRow({ item, onOpen }) {
  return (
    <button onClick={() => onOpen(item.id)} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
      padding: '15px 18px', borderRadius: 14, background: 'var(--bg-elev-1)',
      border: '1px solid var(--border-subtle)', cursor: 'pointer',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'color-mix(in oklab, var(--p-openresto) 14%, transparent)', color: 'var(--p-openresto)',
      }}>
        <Icon name="message" size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Badge tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type]}</Badge>
          <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
        </div>
        <div style={{ fontSize: 14, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
      </div>
      {item.attachments?.length > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          <Icon name="paperclip" size={13} />{item.attachments.length}
        </span>
      )}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtRel(item.updated_at)}</span>
      <Icon name="chevron_right" size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
}

function Bubble({ own, isAdmin, body, attachments, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: own ? 'flex-end' : 'flex-start' }}>
        {isAdmin && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-openresto)' }}>Админ NexoraOS</span>}
        {body && (
          <div style={{
            padding: '10px 14px',
            borderRadius: own ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: own ? 'var(--text)' : 'var(--bg-elev-1)',
            color: own ? 'var(--bg)' : 'var(--text)',
            border: own ? 'none' : '1px solid var(--border-subtle)',
            fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {body}
          </div>
        )}
        <AttachmentGrid files={attachments} />
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{fmtDateTime(time)}</span>
      </div>
    </div>
  );
}

function ThreadView({ ticketId, onBack }) {
  const { user } = useAuth();
  const { data: item } = useFeedbackItem(ticketId);
  const { data: replies = [] } = useFeedbackThread(ticketId);
  const send = useSendFeedbackReply(ticketId);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [replies.length, item?.id]);

  const busy = send.isPending || uploading;

  const submit = async () => {
    const body = text.trim();
    if ((!body && !files.length) || busy) return;
    try {
      let attachments = [];
      if (files.length) {
        setUploading(true);
        attachments = await uploadFeedbackFiles(files, user.id, ticketId);
      }
      send.mutate({ body, attachments }, { onSuccess: () => { setText(''); setFiles([]); } });
    } finally {
      setUploading(false);
    }
  };

  if (!item) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack} title="Назад" style={{
          width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)',
          color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <Icon name="chevron_left" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{TYPE_LABEL[item.type]}</div>
        </div>
        <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
      </div>

      <div className="ws-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Bubble own body={item.body} attachments={item.attachments} time={item.created_at} />
        {replies.map(r => <Bubble key={r.id} own={!r.is_admin} isAdmin={r.is_admin} body={r.body} attachments={r.attachments} time={r.created_at} />)}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 4px 4px', borderTop: '1px solid var(--border-subtle)' }}>
        <AttachmentPicker files={files} onChange={setFiles} disabled={busy} />
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={1} placeholder="Написать сообщение…"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            style={{
              flex: 1, resize: 'none', padding: '10px 14px', background: 'var(--bg-elev-1)',
              border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 13.5, color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none', maxHeight: 120,
            }}
          />
          <Button variant="primary" icon="send" disabled={(!text.trim() && !files.length) || busy} onClick={submit} style={{ alignSelf: 'flex-end' }}>
            {uploading ? 'Загрузка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListView({ onOpen, onNew }) {
  const { data: items = [], isLoading } = useMyFeedback();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Задайте вопрос, сообщите о баге или предложите идею — мы отвечаем здесь же, в этом чате.</div>
        </div>
        <span style={{ flex: 1 }} />
        <Button variant="primary" icon="plus" onClick={onNew}>Новое обращение</Button>
      </div>
      {isLoading ? (
        <EmptyState icon="message" text="Загрузка…" />
      ) : items.length === 0 ? (
        <EmptyState icon="message" text="У вас пока нет обращений" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => <TicketRow key={it.id} item={it} onOpen={onOpen} />)}
        </div>
      )}
    </>
  );
}

export default function Feedback() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket');
  const [showNew, setShowNew] = useState(false);

  const openTicket = id => setSearchParams({ ticket: id });
  const back = () => setSearchParams({});

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Обратная связь" sub={ticketId ? undefined : 'Диалог с командой NexoraOS'} />
        <main className={ticketId ? undefined : 'ws-scroll'} style={{ flex: 1, minHeight: 0, overflowY: ticketId ? 'hidden' : 'auto', padding: ticketId ? '0 28px 20px' : '28px 28px 48px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {ticketId ? <ThreadView ticketId={ticketId} onBack={back} /> : <ListView onOpen={openTicket} onNew={() => setShowNew(true)} />}
          </div>
        </main>
      </div>
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => { setShowNew(false); openTicket(id); }}
        />
      )}
    </div>
  );
}
