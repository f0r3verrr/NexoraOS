import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../icons.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useIsCompact } from '../hooks/useViewport.js';
import {
  useNotes, useAllNotes, useFolders,
  useCreateNote, useUpdateNote, useDeleteNote,
  useNoteAttachments, useAddAttachment, useDeleteAttachment,
} from '../hooks/useNotes.js';
import { supabase } from '../lib/supabase.js';

/* ── Helpers ─────────────────────────────────────────────────── */
function Skeleton({ h = 14, w = '100%', radius = 6 }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'только что';
  if (mins < 60) return `${mins} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days === 1) return 'вчера';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/* Strip markdown symbols for plain-text preview in note cards */
function stripMd(text = '') {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/* Shared markdown renderer */
const MD_PLUGINS = [remarkGfm];
function MdView({ children, style }) {
  return (
    <div className="md-preview" style={style}>
      <ReactMarkdown
        remarkPlugins={MD_PLUGINS}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}
      >
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}

/* ── Delete confirmation modal ───────────────────────────────── */
function DeleteModal({ title, onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto', width: '100%', maxWidth: 380, background: 'var(--bg-elev-1)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-modal)', animation: 'scalein 140ms ease-out', overflow: 'hidden' }}>
          <div style={{ padding: '22px 24px 18px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Удалить заметку?</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
              «<span style={{ color: 'var(--text-2)' }}>{title}</span>» будет удалена без возможности восстановления.
            </div>
          </div>
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel}
              style={{ height: 32, padding: '0 16px', borderRadius: 8, fontSize: 13, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}>
              Отмена
            </button>
            <button onClick={onConfirm}
              style={{ height: 32, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'color-mix(in oklab, var(--danger) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 35%, transparent)', color: 'var(--danger)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 22%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 15%, transparent)'}>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Attachment chip ─────────────────────────────────────────── */
function AttachChip({ att, onDelete }) {
  const [loading, setLoading] = useState(false);
  const isImg = att.mime_type?.startsWith('image/');

  const handleOpen = async () => {
    setLoading(true);
    const { data } = await supabase.storage
      .from('note-attachments')
      .createSignedUrl(att.storage_path, 3600);
    setLoading(false);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 4px 0 8px', borderRadius: 7, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
      <button onClick={handleOpen} disabled={loading} title={att.name}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', cursor: loading ? 'wait' : 'pointer', padding: 0, maxWidth: 160 }}>
        <span style={{ fontSize: 13 }}>{isImg ? '🖼' : '📎'}</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{att.name}</span>
        {att.size && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtSize(att.size)}</span>}
      </button>
      <button onClick={() => onDelete(att)} title="Удалить"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 15%, transparent)'; e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
        <Icon name="x" size={10} />
      </button>
    </div>
  );
}

/* ── Toolbar button ──────────────────────────────────────────── */
function TBtn({ icon, label, active, activeColor, danger, onClick, title }) {
  const baseColor = danger ? 'var(--danger)' : active && activeColor ? activeColor : active ? 'var(--text)' : 'var(--text-3)';
  return (
    <button onClick={onClick} title={title ?? label}
      style={{ display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background 80ms, color 80ms', background: active ? 'var(--bg-elev-3)' : 'transparent', color: baseColor, border: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'color-mix(in oklab, var(--danger) 12%, transparent)' : 'var(--bg-elev-3)'; e.currentTarget.style.color = danger ? 'var(--danger)' : active && activeColor ? activeColor : 'var(--text)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--bg-elev-3)' : 'transparent'; e.currentTarget.style.color = baseColor; }}>
      {icon && <Icon name={icon} size={13} />}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ── Note editor ─────────────────────────────────────────────── */
function NoteEditor({ note, onClose, focusMode, onToggleFocus }) {
  const isCompact = useIsCompact();
  const [title,     setTitle]     = useState(note.title);
  const [body,      setBody]      = useState(note.body ?? '');
  const [preview,   setPreview]   = useState(false);
  const [showDel,   setShowDel]   = useState(false);
  const [attError,  setAttError]  = useState(null);

  const update     = useUpdateNote();
  const deleteNote = useDeleteNote();
  const addAtt     = useAddAttachment();
  const delAtt     = useDeleteAttachment();
  const { data: attachments = [] } = useNoteAttachments(note.id);

  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  // Autosave 600ms
  const save = useCallback((t, b) => {
    update.mutate({ id: note.id, title: t, body: b });
  }, [note.id]);

  useEffect(() => {
    const timer = setTimeout(() => save(title, body), 600);
    return () => clearTimeout(timer);
  }, [title, body]);

  // Reset when switching notes
  useEffect(() => {
    setTitle(note.title);
    setBody(note.body ?? '');
    setPreview(false);
    setShowDel(false);
    setAttError(null);
  }, [note.id]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(240, el.scrollHeight) + 'px';
  }, [body]);

  const handleDelete = () => {
    deleteNote.mutate(note.id);
    onClose();
  };

  const handleExport = () => {
    const blob = new Blob([`# ${title}\n\n${body}`], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title || 'заметка'}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = () => {
    onClose('duplicate', { title: note.title + ' (копия)', body: note.body, folder: note.folder });
  };

  const handleFileUpload = async (e) => {
    setAttError(null);
    const files = Array.from(e.target.files ?? []);
    // Remember cursor position before async work
    const cursorPos = textareaRef.current?.selectionStart ?? body.length;

    for (const file of files) {
      try {
        const result = await addAtt.mutateAsync({ noteId: note.id, file });
        // Get long-lived signed URL for inline embedding
        const { data: signed } = await supabase.storage
          .from('note-attachments')
          .createSignedUrl(result.storage_path, 315360000); // ~10 years
        if (signed?.signedUrl) {
          const isImg = result.mime_type?.startsWith('image/');
          const md    = isImg
            ? `![${result.name}](${signed.signedUrl})`
            : `[${result.name}](${signed.signedUrl})`;
          setBody(prev => {
            const before = prev.slice(0, cursorPos);
            const after  = prev.slice(cursorPos);
            const sep    = before.length && !before.endsWith('\n') ? '\n' : '';
            return before + sep + md + '\n' + after;
          });
        }
      } catch (err) {
        const msg = err?.message ?? '';
        if (msg.includes('Bucket not found') || msg.includes('404')) {
          setAttError('Создайте bucket «note-attachments» в Supabase Storage и примените 012_notes_storage_policy.sql');
        } else {
          setAttError('Ошибка загрузки: ' + msg);
        }
      }
    }
    e.target.value = '';
  };

  const words    = body.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(words / 200));

  return (
    <>
      {showDel && (
        <DeleteModal
          title={title}
          onConfirm={handleDelete}
          onCancel={() => setShowDel(false)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          {isCompact && !focusMode && (
            <button onClick={() => onClose()} title="Назад к списку"
              style={{ width: 28, height: 28, marginRight: 2, borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron_left" size={15} />
            </button>
          )}
          {note.project && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: `var(${note.project.color_token})` }} />
              {note.project.name}
            </span>
          )}

          {/* Pin */}
          <TBtn
            icon={note.pinned ? 'star_filled' : 'star'}
            label={note.pinned ? 'Закреплено' : 'Закрепить'}
            active={note.pinned}
            activeColor="#F5C518"
            title={note.pinned ? 'Открепить' : 'Закрепить'}
            onClick={() => update.mutate({ id: note.id, pinned: !note.pinned })}
          />

          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

          <TBtn icon={preview ? 'edit' : 'eye'} label={preview ? 'Редактировать' : 'Просмотр'} active={preview} onClick={() => setPreview(p => !p)} title="Переключить режим (Ctrl+E)" />
          <TBtn icon="maximize" label="Фокус" active={focusMode} onClick={onToggleFocus} title="Режим концентрации (Ctrl+Shift+F)" />
          <TBtn icon="download" label="Скачать" onClick={handleExport} title="Экспорт в .md" />
          <TBtn icon="copy"     label="Дублировать" onClick={handleDuplicate} />

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: 8 }}>
            {update.isPending ? 'сохраняется…' : `сохранено ${fmtDate(note.updated_at)}`}
          </span>

          <TBtn icon="trash" danger onClick={() => setShowDel(true)} title="Удалить заметку" />
        </div>

        {/* Editor area */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {preview ? (
            /* Full-width preview */
            <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 48px 20px' }}>
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1.3 }}>
                  {title || <span style={{ color: 'var(--text-muted)' }}>Без заголовка</span>}
                </div>
                <MdView>{body || '*Нет содержимого*'}</MdView>
              </div>
            </div>
          ) : (
            /* Split: textarea + live preview */
            <>
              <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 20px', borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ maxWidth: 660, margin: '0 auto' }}>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Заголовок"
                    className="no-ring"
                    style={{ display: 'block', width: '100%', fontSize: 22, fontWeight: 600, color: 'var(--text)', background: 'none', border: 'none', outline: 'none', letterSpacing: '-0.02em', marginBottom: 18, fontFamily: 'var(--font-sans)' }}
                  />
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder={'Начни писать…\n\nПоддерживается Markdown:\n**жирный** _курсив_ # Заголовок\n- список\n> цитата\n```код```'}
                    className="ws-scroll no-ring"
                    style={{ display: 'block', width: '100%', fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)', background: 'none', border: 'none', outline: 'none', resize: 'none', minHeight: 240, fontFamily: 'var(--font-mono)', overflow: 'hidden', letterSpacing: '0.01em' }}
                  />
                </div>
              </div>
              <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 20px', background: 'var(--bg-elev-1)' }}>
                <div style={{ maxWidth: 660, margin: '0 auto' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 18, lineHeight: 1.3, minHeight: 33 }}>
                    {title || <span style={{ color: 'var(--text-muted)' }}>Заголовок</span>}
                  </div>
                  {body
                    ? <MdView>{body}</MdView>
                    : <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>Предпросмотр появится здесь…</p>
                  }
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ padding: '5px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {words} {words === 1 ? 'слово' : words >= 2 && words <= 4 ? 'слова' : 'слов'} · {body.length} симв. · ~{readMins} мин чтения
            </span>
          </div>

          <div style={{ padding: '5px 20px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {attachments.map(att => (
              <AttachChip key={att.id} att={att} onDelete={a => delAtt.mutate({ id: a.id, noteId: note.id, storagePath: a.storage_path })} />
            ))}
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={addAtt.isPending}
              title="Прикрепить файл"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 7, fontSize: 12, cursor: addAtt.isPending ? 'wait' : 'pointer', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-3)', transition: 'all 80ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--p-openresto)'; e.currentTarget.style.color = 'var(--p-openresto)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}>
              <Icon name="paperclip" size={12} />
              {addAtt.isPending ? 'Загрузка…' : 'Прикрепить'}
            </button>
            {attError && (
              <span style={{ fontSize: 11, color: 'var(--danger)', flex: 1 }}>{attError}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */
function EmptyEditor({ onNew }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="note" size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>Выбери заметку</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>или создай новую</div>
      </div>
      <button onClick={onNew}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'var(--text)', color: 'var(--bg)', border: 'none' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <Icon name="plus" size={14} />
        Новая заметка
      </button>
    </div>
  );
}

/* ── Folder row ──────────────────────────────────────────────── */
function FolderRow({ label, icon, badge, active, onClick }) {
  return (
    <button onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--bg-elev-2)' : 'transparent'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, background: active ? 'var(--bg-elev-2)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-2)', fontSize: 13, textAlign: 'left', transition: 'background 80ms', border: 'none', cursor: 'pointer' }}>
      <Icon name={icon} size={13} style={{ color: active ? 'var(--text-2)' : 'var(--text-3)', flex: 'none' }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
    </button>
  );
}

/* ── Note card ───────────────────────────────────────────────── */
function NoteCard({ note, active, searchQuery, onClick }) {
  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const idx = text.toLowerCase().indexOf(searchQuery);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'color-mix(in oklab, var(--p-openresto) 28%, transparent)', color: 'inherit', borderRadius: 2 }}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  const preview = stripMd(note.body);

  return (
    <button onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--bg-elev-1)' : 'transparent'; }}
      style={{ display: 'block', width: '100%', padding: '11px 14px', background: active ? 'var(--bg-elev-1)' : 'transparent', textAlign: 'left', cursor: 'pointer', transition: 'background 80ms', border: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        {note.project && <span style={{ width: 7, height: 7, borderRadius: 2, background: `var(${note.project.color_token})`, flex: 'none' }} />}
        {note.pinned && <Icon name="star_filled" size={10} style={{ color: '#F5C518', flex: 'none' }} />}
        <span style={{ fontSize: 13, color: active ? 'var(--text)' : 'var(--text-2)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {highlight(note.title)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{fmtDate(note.updated_at)}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {preview ? highlight(preview) : <em>Пусто</em>}
      </p>
    </button>
  );
}

/* ── Main Notes screen ───────────────────────────────────────── */
export default function Notes() {
  const [activeFolder,  setActiveFolder]  = useState(null);
  const [activeNoteId,  setActiveNoteId]  = useState(null);
  const [localFolders,  setLocalFolders]  = useState([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [focusMode,     setFocusMode]     = useState(false);
  const isCompact = useIsCompact();

  const { data: notes = [],      isLoading } = useNotes(activeFolder);
  const { data: allNotes = [] }              = useAllNotes();
  const { data: dbFolders = [] }             = useFolders();
  const createNote = useCreateNote();

  const folders      = [...new Set([...dbFolders, ...localFolders])];
  const folderCounts = allNotes.reduce((acc, n) => { acc[n.folder] = (acc[n.folder] ?? 0) + 1; return acc; }, {});

  const q            = searchQuery.toLowerCase();
  const visibleNotes = q
    ? notes.filter(n => n.title.toLowerCase().includes(q) || stripMd(n.body).toLowerCase().includes(q))
    : notes;

  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  const handleNewNote = async () => {
    const n = await createNote.mutateAsync({
      folder: activeFolder ?? (folders[0] ?? 'Личное'),
      title: 'Без названия',
      body: '',
    });
    setActiveNoteId(n.id);
  };

  const handleEditorClose = async (reason, data) => {
    if (reason === 'duplicate' && data) {
      const n = await createNote.mutateAsync(data);
      setActiveNoteId(n.id);
    } else {
      setActiveNoteId(null);
    }
  };

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    setLocalFolders(prev => [...new Set([...prev, name])]);
    setActiveFolder(name);
    setActiveNoteId(null);
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key === 'n') { e.preventDefault(); handleNewNote(); }
      if (mod && e.shiftKey && e.key === 'F')  { e.preventDefault(); setFocusMode(m => !m); }
      if (e.key === 'Escape' && focusMode)       setFocusMode(false);

    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [focusMode, activeFolder, folders]);

  useEffect(() => { if (!searchOpen) setSearchQuery(''); }, [searchOpen]);

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      {!focusMode && <Sidebar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Заметки"
          sub={isLoading ? '…' : `${allNotes.length} заметок`}
          right={
            <button onClick={handleNewNote}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'var(--bg-elev-2)', color: 'var(--text-2)', border: '1px solid var(--border-subtle)', transition: 'all 80ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--text)'; e.currentTarget.style.color = 'var(--bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elev-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
              <Icon name="plus" size={14} />
              Новая заметка
            </button>
          }
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* ── Left panel: folders — на compact прячем (папки доступны как
              горизонтальные чипы над списком заметок ниже) ── */}
          {!focusMode && !isCompact && (
            <div className="ws-scroll" style={{ width: 220, flex: 'none', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FolderRow label="Все заметки" icon="layers" badge={allNotes.length} active={activeFolder === null} onClick={() => { setActiveFolder(null); setActiveNoteId(null); }} />

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />

              {/* Folders header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '2px 10px 4px', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, flex: 1 }}>Папки</span>
                <button onClick={() => setNewFolderOpen(o => !o)} title="Создать папку"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elev-3)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  <Icon name="plus" size={11} />
                </button>
              </div>

              {/* New folder input */}
              {newFolderOpen && (
                <div style={{ padding: '4px 8px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Название папки…"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setNewFolderOpen(false); setNewFolderName(''); } }}
                    style={{ width: '100%', height: 26, padding: '0 8px', background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleAddFolder} style={{ flex: 1, height: 22, borderRadius: 5, background: 'var(--text)', color: 'var(--bg)', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none' }}>Создать</button>
                    <button onClick={() => { setNewFolderOpen(false); setNewFolderName(''); }} style={{ height: 22, padding: '0 8px', borderRadius: 5, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer', border: 'none' }}>✕</button>
                  </div>
                </div>
              )}

              {folders.map(f => (
                <FolderRow key={f} label={f} icon="folder" badge={folderCounts[f] ?? 0} active={activeFolder === f} onClick={() => { setActiveFolder(f); setActiveNoteId(null); }} />
              ))}
              {folders.length === 0 && !newFolderOpen && (
                <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет папок</div>
              )}
            </div>
          )}

          {/* ── Center panel: notes list — на compact на весь экран, пока не
              открыта заметка (тогда список прячется, редактор занимает всё) ── */}
          {!focusMode && (!isCompact || !activeNoteId) && (
            <div className="ws-scroll" style={{ width: isCompact ? '100%' : 280, flex: isCompact ? 1 : 'none', minWidth: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Папки — на compact горизонтальные чипы вместо отдельной колонки */}
              {isCompact && (
                <div style={{ display: 'flex', gap: 6, padding: '10px 10px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', flexShrink: 0 }}>
                  <button onClick={() => setActiveFolder(null)} style={{ flex: 'none', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: activeFolder === null ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', color: activeFolder === null ? 'var(--text)' : 'var(--text-2)', border: `1px solid ${activeFolder === null ? 'var(--border)' : 'var(--border-subtle)'}` }}>
                    Все · {allNotes.length}
                  </button>
                  {folders.map(f => (
                    <button key={f} onClick={() => setActiveFolder(f)} style={{ flex: 'none', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: activeFolder === f ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', color: activeFolder === f ? 'var(--text)' : 'var(--text-2)', border: `1px solid ${activeFolder === f ? 'var(--border)' : 'var(--border-subtle)'}` }}>
                      {f} · {folderCounts[f] ?? 0}
                    </button>
                  ))}
                </div>
              )}
              {/* Search bar */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {searchOpen ? (
                  <>
                    <Icon name="search" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Поиск…"
                      autoFocus
                      style={{ flex: 1, height: 24, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text)' }}
                    />
                    <button onClick={() => setSearchOpen(false)} style={{ display: 'flex', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', flexShrink: 0, border: 'none' }}>
                      <Icon name="x" size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>{activeFolder ?? 'Все'} · {visibleNotes.length}</span>
                    <button onClick={() => setSearchOpen(true)} title="Поиск"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, background: 'none', color: 'var(--text-3)', cursor: 'pointer', border: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elev-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                      <Icon name="search" size={13} />
                    </button>
                    <button onClick={handleNewNote} title="Новая заметка"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, background: 'none', color: 'var(--text-3)', cursor: 'pointer', border: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elev-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                      <Icon name="plus" size={13} />
                    </button>
                  </>
                )}
              </div>

              {isLoading ? (
                <div style={{ padding: '8px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={13} w="80%" /><Skeleton h={11} w="60%" /></div>)}
                </div>
              ) : visibleNotes.length === 0 ? (
                <div style={{ padding: '32px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Icon name="note" size={22} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{searchQuery ? 'Ничего не найдено' : 'Нет заметок'}</span>
                  {!searchQuery && <button onClick={handleNewNote} style={{ fontSize: 12, color: 'var(--p-openresto)', background: 'none', cursor: 'pointer', padding: 0, border: 'none' }}>+ Создать заметку</button>}
                </div>
              ) : (
                visibleNotes.map(n => (
                  <NoteCard key={n.id} note={n} active={n.id === activeNoteId} searchQuery={q} onClick={() => setActiveNoteId(n.id)} />
                ))
              )}
            </div>
          )}

          {/* ── Editor — на compact рендерится только когда заметка открыта ── */}
          {(!isCompact || activeNoteId) && (
            activeNote
              ? <NoteEditor note={activeNote} onClose={handleEditorClose} focusMode={focusMode} onToggleFocus={() => setFocusMode(m => !m)} />
              : <EmptyEditor onNew={handleNewNote} />
          )}
        </div>
      </main>
    </div>
  );
}
