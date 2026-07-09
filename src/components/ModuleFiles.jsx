import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';
import { Button } from './primitives.jsx';
import { Modal, Field, fieldStyle } from './Modal.jsx';
import { useModuleFiles, useUploadModuleFile, useDeleteModuleFile, moduleFileUrl, isImage, decodeLabel } from '../hooks/useModuleFiles.js';

/* Отображаемое имя: подпись из base64url, иначе имя без таймстампа и расширения */
function cleanName(name) {
  const label = decodeLabel(name);
  if (label) return label;
  return name.replace(/^\d{13}_+/, '').replace(/\.[^.]+$/, '');
}

/* Полноэкранный просмотр фото на сайте (← → листание, Esc закрыть) */
export function Lightbox({ items, index, onClose, onNav }) {
  const item = items[index];

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft'  && items.length > 1) onNav((index - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight' && items.length > 1) onNav((index + 1) % items.length);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [index, items.length, onClose, onNav]);

  if (!item) return null;

  const navBtn = {
    width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flex: 'none',
  };

  return createPortal(
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, boxSizing: 'border-box' }}>

      {/* верхняя панель */}
      <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: 8, zIndex: 2 }}>
        <button onClick={() => window.open(item.url, '_blank')} title="Открыть оригинал" style={navBtn}>
          <Icon name="arrow_up_right" size={16} />
        </button>
        <button onClick={onClose} title="Закрыть (Esc)" style={navBtn}>
          <Icon name="x" size={16} />
        </button>
      </div>

      {items.length > 1 && (
        <button onClick={() => onNav((index - 1 + items.length) % items.length)} title="Назад (←)" style={navBtn}>
          <Icon name="chevron_left" size={18} />
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 'calc(100% - 140px)', maxHeight: '100%' }}>
        <img src={item.url} alt={item.name}
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 130px)', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px -20px rgba(0,0,0,0.9)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
          <span>{item.name}</span>
          {items.length > 1 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {index + 1} / {items.length}
            </span>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <button onClick={() => onNav((index + 1) % items.length)} title="Вперёд (→)" style={navBtn}>
          <Icon name="chevron_right" size={18} />
        </button>
      )}
    </div>,
    document.body
  );
}

/* Модалка подписей: по строке на каждый выбранный файл */
function LabelFilesModal({ files, accent, onConfirm, onClose }) {
  const [labels, setLabels] = useState(() => files.map(f => f.name.replace(/\.[^.]+$/, '')));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(files.map((f, i) => ({ file: f, label: labels[i].trim() || null })));
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <Modal title={files.length === 1 ? 'Подпиши документ' : `Подпиши файлы · ${files.length}`}
      sub="название будет видно на карточке" width={460} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {files.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* мини-превью */}
            <span style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flex: 'none', border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              {isImage(f.name)
                ? <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Icon name="file" size={16} />}
            </span>
            <Field label={files.length > 1 ? f.name : 'Что это за документ?'}>
              <input value={labels[i]} autoFocus={i === 0}
                onChange={e => setLabels(ls => ls.map((l, ix) => ix === i ? e.target.value : l))}
                onKeyDown={e => { if (e.key === 'Enter' && files.length === 1) submit(); }}
                placeholder="СТС · Чек за холодильник · ОСАГО 2026…"
                style={fieldStyle} />
            </Field>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={busy}>
          {busy ? 'Загружаем…' : 'Загрузить'}
        </Button>
      </div>
    </Modal>
  );
}

/*
 * Грид файлов модуля: превью картинок, иконки для PDF,
 * загрузка по клику на «+», удаление и открытие на ховере.
 */
export function ModuleFilesGrid({ module, accent = '--p-home', columns = 3, hint = 'Добавь файлы' }) {
  const { data: files = [], isLoading } = useModuleFiles(module);
  const upload = useUploadModuleFile(module);
  const remove = useDeleteModuleFile(module);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);   // File[] — ждут подписи в модалке
  const [viewer, setViewer] = useState(null);     // индекс фото в лайтбоксе

  const images = files.filter(f => isImage(f.name)).map(f => ({ url: moduleFileUrl(f.fullPath), name: cleanName(f.name) }));

  const openViewer = (file) => {
    const idx = images.findIndex(i => i.name === cleanName(file.name));
    if (idx >= 0) setViewer(idx);
  };

  const onPick = (e) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (list.length) setPending(list);
  };

  const uploadLabeled = async (items) => {
    setBusy(true);
    try {
      for (const it of items) await upload.mutateAsync(it);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {pending && (
        <LabelFilesModal files={pending} accent={accent}
          onConfirm={uploadLabeled}
          onClose={() => setPending(null)} />
      )}
      {viewer != null && (
        <Lightbox items={images} index={viewer} onNav={setViewer} onClose={() => setViewer(null)} />
      )}
      <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onPick} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
        {files.map(f => {
          const url = moduleFileUrl(f.fullPath);
          const img = isImage(f.name);
          return (
            <div key={f.name}
              onClick={() => img ? openViewer(f) : window.open(url, '_blank')}
              onMouseEnter={e => e.currentTarget.querySelector('.mf-actions').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('.mf-actions').style.opacity = '0'}
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', cursor: 'zoom-in' }}>
              {img ? (
                <img src={url} alt={cleanName(f.name)} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', padding: 6, boxSizing: 'border-box' }}>
                  <Icon name="file" size={18} />
                  <span style={{ fontSize: 10, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{cleanName(f.name)}</span>
                </div>
              )}
              {/* подпись поверх картинки */}
              {img && (
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 8px 5px', fontSize: 10, color: '#fff', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cleanName(f.name)}
                </span>
              )}
              <div className="mf-actions" style={{ position: 'absolute', top: 5, right: 5, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 3 }}>
                <button onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }} title="Открыть оригинал"
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon name="arrow_up_right" size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); remove.mutate(f.fullPath); }} title="Удалить"
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon name="trash" size={11} />
                </button>
              </div>
            </div>
          );
        })}

        {/* тайл добавления */}
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in oklab, var(${accent}) 50%, transparent)`; e.currentTarget.style.color = `var(${accent})`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-3)'; }}
          style={{ aspectRatio: '1', borderRadius: 8, border: '1.5px dashed var(--border-subtle)', background: 'transparent', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10, cursor: 'pointer', transition: 'border-color 120ms, color 120ms' }}>
          <Icon name={busy ? 'clock' : 'plus'} size={16} />
          {busy ? 'Загрузка…' : 'Добавить'}
        </button>
      </div>
      {!isLoading && files.length === 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>{hint}</span>
      )}
    </>
  );
}

/*
 * Одиночное фото модуля (аватар партнёра, фото авто).
 * shape: 'circle' | 'rect' | 'fill' (заполняет родителя, левый край
 * растворяется в фон карточки). Новая загрузка заменяет старую.
 */
export function ModulePhoto({ module, shape = 'circle', size = 200, accent = '--p-girl', label = 'фото' }) {
  const { data: files = [] } = useModuleFiles(module);
  const upload = useUploadModuleFile(module);
  const remove = useDeleteModuleFile(module);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const photo = files.find(f => isImage(f.name));
  const url = photo ? moduleFileUrl(photo.fullPath) : null;

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      // одно фото: старые убираем
      for (const old of files) await remove.mutateAsync(old.fullPath);
      await upload.mutateAsync(f);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const isFill = shape === 'fill';
  const radius = shape === 'circle' ? 999 : isFill ? 0 : 12;
  const box = isFill
    ? { width: '100%', height: '100%' }
    : shape === 'circle'
      ? { width: size, height: size }
      : { width: size, aspectRatio: '16/10' };

  // левый край фото плавно уходит в фон карточки
  const fadeMask = 'linear-gradient(90deg, transparent 0%, #000 34%)';

  return (
    <div style={{ position: 'relative', ...box, flex: 'none' }}
      onMouseEnter={e => e.currentTarget.querySelector('.mp-overlay').style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.querySelector('.mp-overlay').style.opacity = '0'}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPick} />
      {viewerOpen && url && (
        <Lightbox items={[{ url, name: label }]} index={0} onNav={() => {}} onClose={() => setViewerOpen(false)} />
      )}

      {url ? (
        <img src={url} alt={label}
          style={isFill
            ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block', maskImage: fadeMask, WebkitMaskImage: fadeMask }
            : { width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius, display: 'block', border: `1px solid color-mix(in oklab, var(${accent}) 40%, transparent)`, boxShadow: `0 8px 32px -12px color-mix(in oklab, var(${accent}) 45%, transparent)`, boxSizing: 'border-box' }} />
      ) : (
        <button onClick={() => inputRef.current?.click()}
          style={{ width: '100%', height: '100%', borderRadius: radius, cursor: 'pointer', border: `1.5px dashed color-mix(in oklab, var(${accent}) 40%, transparent)`, background: `repeating-linear-gradient(135deg, color-mix(in oklab, var(${accent}) 10%, var(--bg-elev-2)) 0 6px, color-mix(in oklab, var(${accent}) 16%, var(--bg-elev-2)) 6px 12px)`, color: `color-mix(in oklab, var(${accent}) 80%, var(--text))`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <Icon name="plus" size={18} />
          {busy ? 'загрузка…' : `добавить ${label}`}
        </button>
      )}

      {/* оверлей действий поверх фото; клик мимо кнопок — полноэкранный просмотр */}
      <div className="mp-overlay"
        onClick={e => { if (e.target === e.currentTarget) setViewerOpen(true); }}
        style={{ position: 'absolute', inset: 0, borderRadius: radius, background: 'rgba(0,0,0,0.45)', opacity: 0, transition: 'opacity 140ms', display: url ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'zoom-in' }}>
        <button onClick={() => inputRef.current?.click()} title="Сменить фото"
          style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="edit" size={12} /> {busy ? '…' : 'Сменить'}
        </button>
        <button onClick={() => photo && remove.mutate(photo.fullPath)} title="Удалить фото"
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.4)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="trash" size={12} />
        </button>
      </div>
    </div>
  );
}
