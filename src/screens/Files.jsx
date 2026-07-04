import { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useFiles, useUploadFile, useDeleteFile, getFileUrl } from '../hooks/useFiles.js';
import { ru } from '../lib/plural.js';

const FILE_TYPE_EXTS = {
  docs:   ['pdf', 'doc', 'docx'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  sheets: ['xls', 'xlsx'],
  text:   ['md', 'txt'],
};

const FILE_TYPE_LABELS = {
  docs:   'Документы',
  images: 'Фото и изображения',
  sheets: 'Таблицы',
  text:   'Текстовые файлы',
};

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'только что';
  if (mins < 60) return `${mins} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн`;
  return `${Math.floor(days / 7)} нед`;
}

function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getDisplayName(name) {
  return name.replace(/^\d{10,}_/, '');
}

const EXT_COLOR = {
  pdf:  '--p-diploma',
  doc:  '--p-openresto', docx: '--p-openresto',
  xls:  '--p-health',   xlsx: '--p-health',
  jpg:  '--p-girl',     jpeg: '--p-girl', png: '--p-girl', gif: '--p-girl', webp: '--p-girl',
  md:   '--p-bots',     txt: '--p-bots',
  zip:  '--p-car',      rar: '--p-car',
};

const TYPE_ICONS = {
  pdf: 'file', docx: 'note', doc: 'note',
  xlsx: 'trending_up', xls: 'trending_up',
  jpg: 'star', jpeg: 'star', png: 'star', gif: 'star', webp: 'star',
  md: 'note', txt: 'note',
  zip: 'layers', rar: 'layers',
};

function Skeleton({ h = 14, w = '100%', radius = 6 }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

export default function Files() {
  const { data: result = { items: [], bucketMissing: false }, isLoading } = useFiles('');
  const { items = [], bucketMissing = false } = result;
  const upload     = useUploadFile();
  const deleteFile = useDeleteFile();
  const fileInput  = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') ?? '';
  const activeQ    = (searchParams.get('q') ?? '').toLowerCase().trim();
  const activeSort = searchParams.get('sort') ?? '';

  // Обработка ?upload=1 из сайдбара
  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.delete('upload'); return n; }, { replace: true });
      fileInput.current?.click();
    }
  }, [searchParams.get('upload')]);

  let visibleItems = activeType
    ? items.filter(f => (FILE_TYPE_EXTS[activeType] ?? []).includes(getExt(f.name)))
    : items;

  if (activeQ) {
    visibleItems = visibleItems.filter(f => getDisplayName(f.name).toLowerCase().includes(activeQ));
  }

  if (activeSort === 'name') {
    visibleItems = [...visibleItems].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name), 'ru'));
  } else if (activeSort === 'size') {
    visibleItems = [...visibleItems].sort((a, b) => (b.metadata?.size ?? 0) - (a.metadata?.size ?? 0));
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync({ file, folder: '' });
    } catch (err) {
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('bucket') || err?.statusCode === '404') {
        alert('Хранилище не настроено.\n\nСоздай бакет «user-files» в Supabase Storage:\nSupabase Dashboard → Storage → New bucket → имя: user-files → Public bucket ✓');
      } else {
        alert(`Ошибка загрузки: ${msg}`);
      }
    }
    e.target.value = '';
  };

  const handleDelete = async (fullPath) => {
    if (!confirm('Удалить файл?')) return;
    await deleteFile.mutateAsync(fullPath);
  };

  const handleDownload = (f) => {
    try {
      const url = getFileUrl(f.fullPath);
      const a = document.createElement('a');
      a.href = url;
      a.download = getDisplayName(f.name);
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(getFileUrl(f.fullPath), '_blank');
    }
  };

  const totalSize  = items.reduce((a, f) => a + (f.metadata?.size ?? 0), 0);
  const pdfCount   = items.filter(f => getExt(f.name) === 'pdf').length;
  const photoCount = items.filter(f => ['jpg','jpeg','png','gif','webp'].includes(getExt(f.name))).length;
  const docCount   = items.filter(f => ['doc','docx','md','txt'].includes(getExt(f.name))).length;

  const typeGroups = {};
  for (const f of visibleItems) {
    const ext = getExt(f.name);
    if (ext) typeGroups[ext] = (typeGroups[ext] ?? 0) + 1;
  }
  const topTypes = Object.entries(typeGroups).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Файлы"
          sub={isLoading ? '…' : `${ru.files(items.length)} · ${fmtSize(totalSize)}`}
          right={<input ref={fileInput} type="file" style={{ display: 'none' }} onChange={handleUpload} />}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px' }}>
          {bucketMissing ? (
            <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="file" size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Хранилище не настроено</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360 }}>
                  Создай бакет <code style={{ background: 'var(--bg-elev-2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>user-files</code> в Supabase Storage
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {[
                  { l: 'Всего файлов',      v: isLoading ? '…' : String(items.length), c: 'var(--text)' },
                  { l: 'PDF документы',     v: isLoading ? '…' : String(pdfCount),     c: 'var(--danger)' },
                  { l: 'Фото и изображения',v: isLoading ? '…' : String(photoCount),   c: 'var(--p-girl)' },
                  { l: 'Текстовые файлы',   v: isLoading ? '…' : String(docCount),     c: 'var(--p-openresto)' },
                ].map(s => (
                  <div key={s.l}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    style={{ flex: 1, padding: '14px 16px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, transition: 'box-shadow 150ms, border-color 150ms' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{s.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* File list */}
              <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>
                    {activeType ? FILE_TYPE_LABELS[activeType] : 'Все файлы'}
                    {activeType && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{visibleItems.length} файлов</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {topTypes.map(([ext, count]) => (
                      <Badge key={ext} tone="neutral" dot>{ext.toUpperCase()} · {count}</Badge>
                    ))}
                  </div>
                </div>

                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 80px 72px', padding: '8px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  <div /><div>Имя</div><div>Тип</div><div>Размер</div><div>Добавлен</div><div />
                </div>

                {isLoading ? (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 80px 40px', gap: 12, alignItems: 'center' }}>
                        <Skeleton h={28} w={28} radius={7} />
                        <Skeleton h={13} w="70%" />
                        <Skeleton h={12} w={60} />
                        <Skeleton h={12} w={50} />
                        <Skeleton h={12} w={50} />
                      </div>
                    ))}
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Icon name="file" size={28} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      {activeQ ? `Ничего не найдено по «${activeQ}»` : activeType ? 'Файлов этого типа нет' : 'Нет файлов — загрузи первый'}
                    </span>
                    {!activeType && !activeQ && <Button variant="secondary" icon="paperclip" onClick={() => fileInput.current?.click()}>Загрузить файл</Button>}
                  </div>
                ) : (
                  visibleItems.map(f => {
                    const ext   = getExt(f.name);
                    const color = EXT_COLOR[ext] ?? '--text-3';
                    const icon  = TYPE_ICONS[ext] ?? 'file';
                    const displayName = getDisplayName(f.name);
                    const size  = f.metadata?.size;

                    return (
                      <div
                        key={f.id ?? f.name}
                        style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 80px 72px', padding: '10px 18px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', cursor: 'default', background: 'transparent', transition: 'background 80ms' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.querySelectorAll('.row-action').forEach(b => (b.style.opacity = '1')); }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelectorAll('.row-action').forEach(b => (b.style.opacity = '0')); }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklab, var(${color}) 14%, transparent)`, color: `var(${color})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={icon} size={14} />
                        </span>
                        <span style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }} title={displayName}>
                          {displayName}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{ext || '—'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtSize(size)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtDate(f.created_at)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                          <button
                            className="row-action"
                            onClick={() => handleDownload(f)}
                            title="Скачать"
                            style={{ opacity: 0, transition: 'opacity 120ms', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}
                          >
                            <Icon name="download" size={13} />
                          </button>
                          <button
                            className="row-action"
                            onClick={() => handleDelete(f.fullPath)}
                            title="Удалить"
                            style={{ opacity: 0, transition: 'opacity 120ms', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
