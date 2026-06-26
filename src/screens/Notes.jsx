import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useNotes, useFolders, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes.js';

function Skeleton({ h = 14, w = '100%', radius = 6 }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
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

/* ---- Editor with debounced autosave ---- */
function NoteEditor({ note, onClose }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody]   = useState(note.body ?? '');
  const update = useUpdateNote();
  const deleteNote = useDeleteNote();
  const titleRef = useRef(null);

  // Autosave body after 600ms idle
  const save = useCallback((newTitle, newBody) => {
    update.mutate({ id: note.id, title: newTitle, body: newBody });
  }, [note.id]);

  useEffect(() => {
    const t = setTimeout(() => save(title, body), 600);
    return () => clearTimeout(t);
  }, [title, body]);

  // Reset when note changes
  useEffect(() => {
    setTitle(note.title);
    setBody(note.body ?? '');
  }, [note.id]);

  const handleDelete = () => {
    if (confirm(`Удалить «${note.title}»?`)) {
      deleteNote.mutate(note.id);
      onClose();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {note.project && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${note.project.color_token})` }} />
            {note.project.name}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {update.isPending ? 'сохраняется…' : `сохранено ${fmtDate(note.updated_at)}`}
        </span>
        <IconButton icon="trash" title="Удалить" onClick={handleDelete} style={{ color: 'var(--danger)' }} />
      </div>

      {/* Editor */}
      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 40px 48px' }}>
        <div style={{ maxWidth: 720 }}>
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Заголовок"
            style={{
              display: 'block', width: '100%',
              fontSize: 26, fontWeight: 500, color: 'var(--text)',
              background: 'none', border: 'none', outline: 'none',
              letterSpacing: '-0.02em', marginBottom: 16,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Начни писать…"
            style={{
              display: 'block', width: '100%',
              fontSize: 14, lineHeight: 1.75, color: 'var(--text)',
              background: 'none', border: 'none', outline: 'none',
              resize: 'none', minHeight: 400,
              fontFamily: 'var(--font-sans)',
            }}
            rows={24}
          />
        </div>
      </div>
    </div>
  );
}

/* ---- Empty state ---- */
function EmptyEditor() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Icon name="note" size={28} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Выбери заметку или создай новую</span>
    </div>
  );
}

/* ---- Main screen ---- */
export default function Notes() {
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  const { data: notes = [], isLoading: notesLoading } = useNotes(activeFolder);
  const { data: folders = [] } = useFolders();
  const createNote = useCreateNote();

  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  // Group notes by folder for the tree
  const folderCounts = notes.reduce((acc, n) => {
    acc[n.folder] = (acc[n.folder] ?? 0) + 1;
    return acc;
  }, {});

  const handleNewNote = async () => {
    const n = await createNote.mutateAsync({
      folder: activeFolder ?? (folders[0] ?? 'Личное'),
      title: 'Новая заметка',
      body: '',
    });
    setActiveNoteId(n.id);
  };

  const toggleFolder = (f) => setOpenFolders(prev => ({ ...prev, [f]: !prev[f] }));

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Заметки"
          sub={notesLoading ? '…' : `${notes.length} заметок`}
          right={<>
            <Button variant="ghost" size="sm" icon="search">Поиск</Button>
            <Button variant="secondary" size="sm" icon="plus" onClick={handleNewNote}>Новая заметка</Button>
          </>}
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Folder tree */}
          <div className="ws-scroll" style={{ width: 220, flex: 'none', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '8px' }}>
            <button
              onClick={() => { setActiveFolder(null); setActiveNoteId(null); }}
              onMouseEnter={e => { if (activeFolder !== null) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = !activeFolder ? 'var(--bg-elev-2)' : 'transparent'; }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, background: !activeFolder ? 'var(--bg-elev-2)' : 'transparent', color: !activeFolder ? 'var(--text)' : 'var(--text-2)', fontSize: 13, textAlign: 'left', transition: 'background 80ms' }}
            >
              <Icon name="layers" size={13} style={{ color: 'var(--text-3)' }} />
              <span style={{ flex: 1 }}>Все заметки</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{notes.length}</span>
            </button>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />

            {folders.map(f => (
              <div key={f}>
                <button
                  onClick={() => { toggleFolder(f); setActiveFolder(f); setActiveNoteId(null); }}
                  onMouseEnter={e => { if (activeFolder !== f) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = activeFolder === f ? 'var(--bg-elev-2)' : 'transparent'; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, background: activeFolder === f ? 'var(--bg-elev-2)' : 'transparent', color: activeFolder === f ? 'var(--text)' : 'var(--text-2)', fontSize: 13, textAlign: 'left', transition: 'background 80ms' }}
                >
                  <Icon name={openFolders[f] ? 'chevron_down' : 'chevron_right'} size={12} style={{ color: 'var(--text-muted)', flex: 'none' }} />
                  <Icon name="folder" size={13} style={{ color: 'var(--text-3)', flex: 'none' }} />
                  <span style={{ flex: 1 }}>{f}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{folderCounts[f] ?? 0}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Notes list */}
          <div className="ws-scroll" style={{ width: 280, flex: 'none', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
            <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>{activeFolder ?? 'Все'} · {notes.length}</span>
              <IconButton icon="plus" size="sm" onClick={handleNewNote} title="Новая заметка" />
            </div>

            {notesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton h={13} w="80%" />
                    <Skeleton h={11} w="60%" />
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет заметок</span>
              </div>
            ) : (
              notes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  onMouseEnter={e => { if (n.id !== activeNoteId) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.id === activeNoteId ? 'var(--bg-elev-1)' : 'transparent'; }}
                  style={{ display: 'block', width: '100%', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', background: n.id === activeNoteId ? 'var(--bg-elev-1)' : 'transparent', textAlign: 'left', cursor: 'pointer', transition: 'background 80ms' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {n.project && <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${n.project.color_token})`, flex: 'none' }} />}
                    <span style={{ fontSize: 13, color: n.id === activeNoteId ? 'var(--text)' : 'var(--text-2)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {n.body || 'Пусто'}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6, display: 'block' }}>{fmtDate(n.updated_at)}</span>
                </button>
              ))
            )}
          </div>

          {/* Editor */}
          {activeNote
            ? <NoteEditor note={activeNote} onClose={() => setActiveNoteId(null)} />
            : <EmptyEditor />
          }
        </div>
      </main>
    </div>
  );
}
