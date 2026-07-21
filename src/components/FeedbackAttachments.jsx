import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';
import { MAX_FILES, isVideo, feedbackSignedUrl } from '../lib/feedbackAttachments.js';

/* Полноэкранный просмотр внутри самого приложения (не новая вкладка) —
   стрелки/Esc для навигации, если во вложениях несколько файлов. */
function Lightbox({ files, index, onClose, onNav }) {
  const file = files[index];
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    feedbackSignedUrl(file.path).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [file.path]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < files.length - 1) onNav(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, files.length, onClose, onNav]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,6,8,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={onClose} title="Закрыть" style={{
        position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <Icon name="x" size={17} />
      </button>

      {index > 0 && (
        <button onClick={e => { e.stopPropagation(); onNav(index - 1); }} style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: 999,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="chevron_left" size={20} />
        </button>
      )}
      {index < files.length - 1 && (
        <button onClick={e => { e.stopPropagation(); onNav(index + 1); }} style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: 999,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="chevron_right" size={20} />
        </button>
      )}

      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '88vh' }}>
        {!url ? (
          <div style={{ width: 320, height: 220, borderRadius: 14, background: 'var(--bg-elev-3)' }} />
        ) : isVideo(file.mime) ? (
          <video src={url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 14, display: 'block' }} />
        ) : (
          <img src={url} alt={file.name} style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 14, display: 'block' }} />
        )}
      </div>
    </div>,
    document.body
  );
}

/* Уже загруженное вложение (path в сторадже) — подгружает signed url лениво,
   по клику открывает Lightbox вместо перехода на отдельную вкладку. */
export function AttachmentThumb({ file, size = 96, onClick }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    feedbackSignedUrl(file.path).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [file.path]);

  if (!url) {
    return <div style={{ width: size, height: size, borderRadius: 10, background: 'var(--bg-elev-3)', flexShrink: 0 }} />;
  }

  const video = isVideo(file.mime);
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: size, height: size, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
        border: '1px solid var(--border-subtle)', cursor: onClick ? 'pointer' : 'default', background: '#000',
      }}
    >
      {video ? (
        <>
          <video src={url} muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{
              width: 30, height: 30, borderRadius: 999, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="video" size={14} style={{ color: '#fff' }} />
            </span>
          </span>
        </>
      ) : (
        <img src={url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
    </div>
  );
}

export function AttachmentGrid({ files, size = 96 }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!files?.length) return null;
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {files.map((f, i) => (
          <AttachmentThumb key={f.path ?? i} file={f} size={size} onClick={() => setOpenIndex(i)} />
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox files={files} index={openIndex} onClose={() => setOpenIndex(null)} onNav={setOpenIndex} />
      )}
    </>
  );
}

/* Ещё не отправленный File — локальный object URL, без сети.
   Создаём/освобождаем URL строго внутри эффекта (не в useState-инициализаторе):
   под React StrictMode (dev) эффекты монтируются дважды (mount→cleanup→mount),
   и revoke, привязанный к уже закоммиченному url, отзывал бы его до отрисовки —
   превью показывалось как битая картинка. Эффект с [file] в зависимостях
   создаёт и отзывает URL атомарно на каждый реальный маунт. */
function PendingChip({ file, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const video = isVideo(file.type);

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      {!url ? (
        <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--bg-elev-3)' }} />
      ) : video ? (
        <video src={url} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, background: '#000' }} />
      ) : (
        <img src={url} alt={file.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-subtle)' }} />
      )}
      <button onClick={onRemove} title="Убрать" style={{
        position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 999,
        background: 'var(--danger)', color: '#fff', border: '2px solid var(--bg-elev-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
      }}>
        <Icon name="x" size={9} />
      </button>
    </div>
  );
}

/* Кнопка-триггер (скрепка) — предназначена стоять слева от поля ввода
   сообщения, отдельно от рядa превью уже выбранных файлов. */
export function AttachmentButton({ files, onChange, disabled }) {
  const inputRef = useRef(null);

  const onSelect = e => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    onChange([...files, ...picked].slice(0, MAX_FILES));
  };

  const full = files.length >= MAX_FILES;
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={onSelect} />
      <button
        type="button" onClick={() => inputRef.current?.click()}
        disabled={disabled || full}
        title={full ? `Максимум ${MAX_FILES} файлов` : 'Прикрепить фото/видео'}
        style={{
          width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)',
          color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          cursor: disabled || full ? 'default' : 'pointer', opacity: disabled || full ? 0.5 : 1,
        }}
      >
        <Icon name="paperclip" size={16} />
      </button>
    </>
  );
}

/* Ряд превью уже выбранных (ещё не отправленных) файлов. */
export function PendingAttachments({ files, onChange }) {
  if (!files.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {files.map((f, i) => <PendingChip key={i} file={f} onRemove={() => onChange(files.filter((_, idx) => idx !== i))} />)}
    </div>
  );
}

/* Комбинированный пикер (кнопка + превью в один ряд) — для форм без
   отдельного однострочного поля ввода (например, "Новое обращение"). */
export function AttachmentPicker({ files, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <AttachmentButton files={files} onChange={onChange} disabled={disabled} />
      <PendingAttachments files={files} onChange={onChange} />
    </div>
  );
}
