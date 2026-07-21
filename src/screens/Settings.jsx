import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useIsCompact } from '../hooks/useViewport.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { useStorageStats } from '../hooks/useFiles.js';
import { useHiddenPages, useToggleHiddenPage } from '../hooks/useHiddenPages.js';
import { useSetOnboardingStatus } from '../hooks/useOnboarding.js';
import { HIDEABLE_PAGES, PAGE_GROUPS } from '../lib/pages.js';

const BUCKET   = 'user-files';
// аватарки — некритичные данные, живут в публичном бакете (ссылка хранится в профиле)
const AVATAR_BUCKET = 'avatars';
const ZOOM_KEY = 'nexora-zoom';
const NOTIF_KEY = 'nexora-notifications';

function fmtSize(b) {
  if (!b) return '0 Б';
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)} КБ`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} МБ`;
  return `${(b / 1024 ** 3).toFixed(2)} ГБ`;
}

function getInitialZoom() {
  const v = localStorage.getItem(ZOOM_KEY);
  return v ? parseFloat(v) : 1.1;
}

function getInitialNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); }
  catch { return {}; }
}

/* ─── shared UI ──────────────────────────────────────────── */

function Card({ children, gap = 16 }) {
  return (
    <div style={{
      background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

function Sep() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', marginLeft: -22, marginRight: -22 }} />;
}

function FieldRow({ label, hint, children, column }) {
  if (column) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>{label}</label>
        {children}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 0' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: 'none' }}>{children}</div>
    </div>
  );
}

function FieldInput({ value, onChange, placeholder, type = 'text', readOnly, mono }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder} readOnly={readOnly}
      style={{
        width: '100%', height: 36, padding: '0 12px',
        background: readOnly ? 'color-mix(in oklab, var(--bg-elev-2) 70%, transparent)' : 'var(--bg-elev-2)',
        border: `1px solid ${readOnly ? 'var(--border-subtle)' : 'var(--border)'}`,
        borderRadius: 8, fontSize: 13, boxSizing: 'border-box',
        color: readOnly ? 'var(--text-2)' : 'var(--text)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        outline: 'none', cursor: readOnly ? 'default' : 'text',
        transition: 'border-color 120ms, box-shadow 120ms',
      }}
      onFocus={e => { if (!readOnly) { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = '0 0 0 2.5px color-mix(in oklab, var(--text) 10%, transparent)'; }}}
      onBlur={e => { e.target.style.borderColor = readOnly ? 'var(--border-subtle)' : 'var(--border)'; e.target.style.boxShadow = ''; }}
    />
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 999, position: 'relative',
      background: checked ? 'var(--p-openresto)' : 'var(--bg-elev-3)',
      border: `1.5px solid ${checked ? 'color-mix(in oklab, var(--p-openresto) 70%, transparent)' : 'var(--border)'}`,
      cursor: disabled ? 'default' : 'pointer', padding: 0, flex: 'none',
      transition: 'background 160ms, border-color 160ms',
      opacity: disabled ? 0.45 : 1,
    }}>
      <span style={{
        position: 'absolute',
        top: '50%', transform: 'translateY(-50%)',
        left: checked ? 22 : 3,
        width: 12, height: 12, borderRadius: 999,
        background: checked ? 'var(--bg)' : 'var(--text-3)',
        transition: 'left 160ms, background 160ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function StatusMsg({ type, children }) {
  const colors = {
    success: { bg: 'color-mix(in oklab, var(--success) 10%, transparent)', border: 'color-mix(in oklab, var(--success) 28%, transparent)', text: 'var(--success)' },
    error:   { bg: 'color-mix(in oklab, var(--danger)  10%, transparent)', border: 'color-mix(in oklab, var(--danger)  28%, transparent)', text: 'var(--danger)' },
  }[type];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.text }}>
      <Icon name={type === 'success' ? 'check' : 'x'} size={13} />
      {children}
    </div>
  );
}

/* ─── "В разработке" — метка и оверлей для нерабочего пока функционала ─── */

function WipBadge({ text = 'В разработке' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600,
      padding: '3px 9px', borderRadius: 999, letterSpacing: '0.01em', whiteSpace: 'nowrap', flexShrink: 0,
      background: 'color-mix(in oklab, var(--warn) 16%, transparent)', color: 'var(--warn)',
    }}>
      <Icon name="clock" size={10} /> {text}
    </span>
  );
}

function WipLock({ children, message = 'Раздел сейчас в разработке' }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ pointerEvents: 'none', opacity: 0.45, filter: 'grayscale(0.35)' }}>{children}</div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 18,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap',
          padding: '8px 16px', borderRadius: 10, background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--text-2)', boxShadow: 'var(--shadow-2)',
        }}>
          <Icon name="clock" size={13} style={{ color: 'var(--warn)' }} /> {message}
        </span>
      </div>
    </div>
  );
}

/* ─── Crop Modal ─────────────────────────────────────────── */

function CropModal({ src, uploading, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);
  const cropRef      = useRef({ cx: 240, cy: 150, r: 110 });
  const [crop, setCropRaw] = useState({ cx: 240, cy: 150, r: 110 });
  const setCrop = useCallback((v) => { cropRef.current = v; setCropRaw(v); }, []);
  const sizeRef  = useRef({ w: 480, h: 300 });
  const dragRef  = useRef(null);

  const onImgLoad = useCallback(() => {
    const el = containerRef.current, img = imgRef.current;
    if (!el || !img) return;
    const w = el.clientWidth, h = el.clientHeight;
    sizeRef.current = { w, h };
    // Place circle over the visible image area (object-fit: contain)
    const cAspect = w / h, iAspect = img.naturalWidth / img.naturalHeight;
    let rW, rH, rX, rY;
    if (iAspect > cAspect) { rW = w; rH = w / iAspect; rX = 0; rY = (h - rH) / 2; }
    else { rH = h; rW = h * iAspect; rX = (w - rW) / 2; rY = 0; }
    const r = Math.round(Math.min(rW, rH) * 0.44);
    setCrop({ cx: Math.round(rX + rW / 2), cy: Math.round(rY + rH / 2), r });
  }, [setCrop]);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const { w, h } = sizeRef.current;
      const mx = e.clientX, my = e.clientY;
      const c  = cropRef.current;
      if (d.type === 'move') {
        const newCx = Math.max(c.r + 2, Math.min(w - c.r - 2, d.ox + (mx - d.px)));
        const newCy = Math.max(c.r + 2, Math.min(h - c.r - 2, d.oy + (my - d.py)));
        setCrop({ r: c.r, cx: newCx, cy: newCy });
      } else {
        const dist = Math.hypot(mx - d.cl - d.ox, my - d.ct - d.oy);
        const maxR = Math.min(d.ox, w - d.ox, d.oy, h - d.oy) - 4;
        setCrop({ cx: d.ox, cy: d.oy, r: Math.max(44, Math.min(maxR, dist)) });
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [setCrop]);

  const onMouseDown = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const { cx, cy, r } = cropRef.current;
    const dist = Math.hypot(mx - cx, my - cy);
    if (dist > r + 14) return;
    e.preventDefault();
    dragRef.current = {
      type: dist < r - 14 ? 'move' : 'resize',
      px: e.clientX, py: e.clientY,
      ox: cx, oy: cy,
      cl: rect.left, ct: rect.top,
    };
  }, []);

  const confirm = useCallback(() => {
    const img = imgRef.current, cont = containerRef.current;
    if (!img || !cont) return;
    const cW = cont.clientWidth, cH = cont.clientHeight;
    // Compute actual rendered image rect within object-fit: contain
    const cAspect = cW / cH;
    const iAspect = img.naturalWidth / img.naturalHeight;
    let rW, rH, rX, rY;
    if (iAspect > cAspect) {
      rW = cW; rH = cW / iAspect; rX = 0; rY = (cH - rH) / 2;
    } else {
      rH = cH; rW = cH * iAspect; rX = (cW - rW) / 2; rY = 0;
    }
    const sx = img.naturalWidth / rW, sy = img.naturalHeight / rH;
    const { cx, cy, r } = cropRef.current;
    const natCX = (cx - rX) * sx, natCY = (cy - rY) * sy;
    const natR  = r * Math.min(sx, sy);
    const SIZE  = 400;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(img, natCX - natR, natCY - natR, natR*2, natR*2, 0, 0, SIZE, SIZE);
    canvas.toBlob(b => onConfirm(new File([b], 'avatar.png', { type: 'image/png' })), 'image/png', 0.93);
  }, [onConfirm]);

  const { cx, cy, r } = crop;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, width: 520, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Выбери область фото</span>
          <button onClick={onCancel} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Image area */}
        <div ref={containerRef} onMouseDown={onMouseDown}
          style={{ position: 'relative', height: 300, background: '#0a0a0a', overflow: 'hidden', userSelect: 'none', cursor: 'crosshair', flex: 'none' }}>
          <img ref={imgRef} src={src} alt="" onLoad={onImgLoad}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <mask id="ncm">
                <rect width="100%" height="100%" fill="white" />
                <circle cx={cx} cy={cy} r={r} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.58)" mask="url(#ncm)" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeDasharray="6 3" />
            {/* Rule-of-thirds */}
            {[-1, 1].map(n => (
              <g key={n} stroke="rgba(255,255,255,0.16)" strokeWidth="0.5">
                <line x1={cx - r} y1={cy + n*r/3} x2={cx + r} y2={cy + n*r/3} />
                <line x1={cx + n*r/3} y1={cy - r} x2={cx + n*r/3} y2={cy + r} />
              </g>
            ))}
            {/* Edge handles N/E/S/W */}
            {[0, 1, 2, 3].map(i => {
              const a = i * Math.PI / 2 - Math.PI / 2;
              return <circle key={i} cx={cx + Math.cos(a)*r} cy={cy + Math.sin(a)*r} r={5.5} fill="white" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />;
            })}
          </svg>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Тяни круг · за края — изменить размер</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
              style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'var(--bg-elev-2)', color: 'var(--text-2)', fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 100ms' }}>
              Отмена
            </button>
            <button onClick={confirm}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.boxShadow = '0 2px 14px -4px color-mix(in oklab, var(--text) 44%, transparent)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
              style={{ height: 32, padding: '0 14px', borderRadius: 8, background: uploading ? 'var(--bg-elev-3)' : 'var(--text)', color: uploading ? 'var(--text-muted)' : 'var(--bg)', fontSize: 13, fontWeight: 500, border: 'none', cursor: uploading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'box-shadow 150ms' }}>
              {uploading
                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2a10 10 0 1 0 10 10"/></svg>Загрузка…</>
                : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile ────────────────────────────────────────────── */

function ProfileSection({ user }) {
  const [name, setName]       = useState(user?.user_metadata?.display_name || '');
  const [avatarUrl, setAvatar] = useState(user?.user_metadata?.avatar_url   || '');
  const [cropSrc, setCropSrc]  = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]    = useState(false);
  const [status, setStatus]    = useState(null);
  const fileRef  = useRef(null);
  const isDirty  = name.trim() !== (user?.user_metadata?.display_name || '');
  const initials = (name || user?.email || 'U')[0].toUpperCase();

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setStatus({ type: 'error', msg: 'Файл больше 10 МБ' }); return; }
    setCropSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const closeCrop = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }, [cropSrc]);

  const handleCropConfirm = useCallback(async (croppedFile) => {
    setUploading(true);
    try {
      const path = `${user.id}/avatar.png`;
      const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, croppedFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: url }, { onConflict: 'id' });
      setAvatar(url);
      closeCrop();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Ошибка загрузки' });
    } finally {
      setUploading(false);
    }
  }, [user.id, closeCrop]);

  const removeAvatar = async () => {
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    await supabase.from('profiles').upsert({ id: user.id, avatar_url: null }, { onConflict: 'id' });
    setAvatar('');
  };

  const save = async () => {
    setSaving(true); setStatus(null);
    try {
      const trimmed = name.trim();
      await supabase.auth.updateUser({ data: { display_name: trimmed } });
      await supabase.from('profiles').upsert({ id: user.id, display_name: trimmed }, { onConflict: 'id' });
      setStatus({ type: 'success', msg: 'Изменения сохранены' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {cropSrc && <CropModal src={cropSrc} uploading={uploading} onConfirm={handleCropConfirm} onCancel={closeCrop} />}

      {/* Avatar card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {/* Avatar circle */}
          <div style={{ position: 'relative', width: 76, height: 76, flex: 'none' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 76, height: 76, borderRadius: 999, objectFit: 'cover', border: '2px solid var(--border)', display: 'block' }} />
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: 999, background: 'color-mix(in oklab, var(--p-openresto) 20%, var(--bg-elev-3))', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 500, color: 'var(--p-openresto)', userSelect: 'none' }}>
                {initials}
              </div>
            )}
            <div
              onClick={() => fileRef.current?.click()}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 150ms' }}>
              <Icon name="camera" size={18} style={{ color: 'white' }} />
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} style={{ display: 'none' }} onChange={onFileSelect} />
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{name || 'Имя не задано'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', transition: 'background 100ms' }}>
                Изменить фото
              </button>
              {avatarUrl && (
                <button onClick={removeAvatar} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}>
                  Удалить
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>PNG, JPG или WEBP · до 10 МБ</div>
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card gap={14}>
        <CardLabel>Основная информация</CardLabel>
        <FieldRow label="Имя" column>
          <FieldInput value={name} onChange={setName} placeholder="Имя Фамилия" />
        </FieldRow>
        <Sep />
        <FieldRow label="Email" column>
          <FieldInput value={user?.email || ''} readOnly />
        </FieldRow>
        {status && <StatusMsg type={status.type}>{status.msg}</StatusMsg>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={isDirty ? save : undefined}
            style={{
              height: 32, padding: '0 14px', borderRadius: 8,
              background: isDirty ? 'var(--text)' : 'var(--bg-elev-2)',
              color: isDirty ? 'var(--bg)' : 'var(--text-muted)',
              border: `1px solid ${isDirty ? 'var(--text)' : 'var(--border-subtle)'}`,
              fontSize: 13, fontWeight: 500, cursor: isDirty ? 'pointer' : 'default',
              transition: 'all 160ms',
            }}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Appearance ─────────────────────────────────────────── */

const ACCENTS = [
  { token: '--p-openresto', label: 'Бирюза'  },
  { token: '--p-youmin',    label: 'Фиолет'  },
  { token: '--p-sites',     label: 'Синий'   },
  { token: '--p-diploma',   label: 'Янтарь'  },
  { token: '--p-bots',      label: 'Розовый' },
  { token: '--p-health',    label: 'Зелёный' },
];

function AppearanceSection() {
  const [zoomPct, setZoomPct] = useState(() => Math.round(getInitialZoom() * 100));

  const commitZoom = (pct) => {
    document.body.style.zoom = String(pct / 100);
    localStorage.setItem(ZOOM_KEY, String(pct / 100));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card gap={18}>
        <CardLabel>Масштаб интерфейса</CardLabel>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Размер UI</span>
            <span style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {zoomPct}%
            </span>
          </div>
          <input
            type="range" min={85} max={120} step={1} value={zoomPct}
            onChange={e => setZoomPct(+e.target.value)}
            onPointerUp={e => commitZoom(+e.target.value)}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 7px' }}>
            {[85, 90, 95, 100, 105, 110, 115, 120].map(v => (
              <span key={v} onClick={() => { setZoomPct(v); commitZoom(v); }}
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', color: v === zoomPct ? 'var(--text)' : 'var(--text-muted)', fontWeight: v === zoomPct ? 600 : 400 }}>
                {v}%
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="info" size={12} />
          Применяется при отпускании
        </div>
      </Card>

      <Card gap={16}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CardLabel>Акцентный цвет</CardLabel>
          <WipBadge />
        </div>
        <WipLock message="Кастомизация акцента — в разработке">
          <div style={{ display: 'flex', gap: 10 }}>
            {ACCENTS.map(a => (
              <div key={a.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button title={a.label} disabled
                  style={{ width: 34, height: 34, borderRadius: 999, background: `var(${a.token})`, border: '2px solid transparent', cursor: 'default' }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.label}</span>
              </div>
            ))}
          </div>
        </WipLock>
      </Card>

      <Card gap={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CardLabel>Тема оформления</CardLabel>
          <WipBadge />
        </div>
        <FieldRow label="Тёмная тема" hint="Единственная тема в текущей версии">
          <Toggle checked disabled />
        </FieldRow>
        <Sep />
        <FieldRow label="Компактный режим" hint="Уменьшить отступы в списках и карточках">
          <Toggle checked={false} disabled onChange={() => {}} />
        </FieldRow>
      </Card>
    </div>
  );
}

/* ─── Pages: включение/отключение страниц аккаунта ───────── */

function PagesSection() {
  const { data: hidden = [], isLoading } = useHiddenPages();
  const toggle = useToggleHiddenPage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>
        Отключённые страницы исчезают из сайдбара, а прямые ссылки на них ведут на дашборд.
        Данные при этом не удаляются — включи страницу обратно, и всё будет на месте.
        Дашборд, Inbox, Сегодня и Настройки отключить нельзя.
      </div>

      {PAGE_GROUPS.map(group => {
        const pages = HIDEABLE_PAGES.filter(p => p.group === group);
        if (pages.length === 0) return null;
        return (
          <Card key={group} gap={16}>
            <CardLabel>{group}</CardLabel>
            <div style={{ display: 'flex', flexDirection: 'column', margin: '-10px 0' }}>
              {pages.map((p, i) => {
                const isHidden = hidden.includes(p.key);
                return (
                  <div key={p.key}>
                    {i > 0 && <Sep />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: isHidden ? 'var(--text-muted)' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        <Icon name={p.icon} size={15} />
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5, color: isHidden ? 'var(--text-3)' : 'var(--text)' }}>{p.label}</span>
                      <Toggle
                        checked={!isHidden}
                        disabled={isLoading}
                        onChange={(on) => toggle.mutate({ key: p.key, hidden: !on })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Notifications ──────────────────────────────────────── */

function NotificationsSection() {
  const [p, setP] = useState(() => ({
    overdueReminder: true,
    dailyDigest: false,
    inboxAlert: true,
    weeklyReview: false,
    sounds: false,
    ...getInitialNotifs(),
  }));

  const upd = (key, val) => {
    const next = { ...p, [key]: val };
    setP(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  const items = [
    { key: 'overdueReminder', label: 'Просроченные задачи', hint: 'Напомнить, если задача просрочена на день и больше' },
    { key: 'dailyDigest',     label: 'Ежедневный дайджест', hint: 'Сводка дня — каждое утро в 9:00' },
    { key: 'inboxAlert',      label: 'Новое в Inbox',       hint: 'При поступлении новых необработанных задач' },
    { key: 'weeklyReview',    label: 'Еженедельный обзор',  hint: 'Итоги недели — каждое воскресенье в 20:00' },
    { key: 'sounds',          label: 'Звуки',               hint: 'Звуковые сигналы для уведомлений' },
  ];

  return (
    <Card gap={16}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <CardLabel>Уведомления</CardLabel>
        <WipBadge />
      </div>
      <WipLock message="Доставка уведомлений — в разработке">
        <div style={{ display: 'flex', flexDirection: 'column', margin: '-10px 0' }}>
          {items.map((item, i) => (
            <div key={item.key}>
              {i > 0 && <Sep />}
              <FieldRow label={item.label} hint={item.hint}>
                <Toggle checked={!!p[item.key]} onChange={v => upd(item.key, v)} disabled />
              </FieldRow>
            </div>
          ))}
        </div>
      </WipLock>
    </Card>
  );
}

/* ─── Integrations ───────────────────────────────────────── */

function IntegrationsSection() {
  const [tgToken, setTgToken] = useState('');
  const [saved, setSaved] = useState(false);

  const saveTg = () => {
    if (!tgToken.trim()) return;
    localStorage.setItem('nexora-tg-token', tgToken.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>
          Интеграции — в разработке, ничего в этом разделе пока не подключается по-настоящему.
        </div>
        <WipBadge />
      </div>
      <WipLock message="Интеграции сейчас в разработке">
      <Card gap={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'color-mix(in oklab, var(--p-sites) 16%, var(--bg-elev-2))', border: '1px solid color-mix(in oklab, var(--p-sites) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={15} style={{ color: 'var(--p-sites)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Telegram-бот</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Отправляй задачи и заметки из Telegram</div>
          </div>
        </div>
        <Sep />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>Bot Token</label>
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: 'var(--p-openresto)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Создать бота <Icon name="external" size={11} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <FieldInput value={tgToken} onChange={setTgToken} placeholder="1234567890:AAFxxxx…" mono />
            </div>
            <button onClick={saveTg} disabled
              style={{ height: 36, padding: '0 14px', borderRadius: 8, background: saved ? 'color-mix(in oklab, var(--success) 20%, var(--bg-elev-2))' : 'var(--text)', color: saved ? 'var(--success)' : 'var(--bg)', fontSize: 13, fontWeight: 500, cursor: 'default', white: 'nowrap', flex: 'none', border: 'none' }}>
              {saved ? '✓ Сохранено' : 'Сохранить'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Токен хранится локально в браузере</div>
        </div>
      </Card>

      {/* Google Calendar */}
      <Card gap={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" fill="#4285F4" fillOpacity="0.15" stroke="#4285F4" strokeWidth="1.5"/>
              <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5"/>
              <path d="M8 3v4M16 3v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="7" y="12" width="4" height="3" rx="0.5" fill="#EA4335"/>
              <rect x="13" y="12" width="4" height="3" rx="0.5" fill="#34A853"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Google Календарь</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Двусторонняя синхронизация событий</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '3px 10px', flex: 'none' }}>
            Не подключён
          </span>
        </div>
        <Sep />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Импорт из Google', desc: 'Показывать события Google в NexoraOS' },
            { label: 'Экспорт в Google', desc: 'Создавать события NexoraOS в Google' },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.55 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <button
          style={{ height: 36, borderRadius: 8, background: 'white', border: '1px solid #dadce0', cursor: 'not-allowed', opacity: 0.65, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: '#3c4043', width: '100%' }}
          disabled title="Требует настройки Google OAuth"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Войти через Google
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <Icon name="info" size={12} style={{ flex: 'none', marginTop: 1 }} />
          Для активации требуется настройка Google OAuth в консоли разработчика
        </div>
      </Card>

      <Card gap={14}>
        <CardLabel>Другие интеграции</CardLabel>
        {[
          { icon: 'globe',   name: 'Web Clipper',   desc: 'Браузерное расширение для захвата страниц' },
          { icon: 'message', name: 'Email → Inbox', desc: 'Пересылай письма на свой адрес NexoraOS' },
          { icon: 'link',    name: 'Webhooks',      desc: 'Подключи любой внешний сервис через HTTP' },
        ].map((item, i) => (
          <div key={item.name}>
            {i > 0 && <Sep />}
            <FieldRow
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name={item.icon} size={14} style={{ color: 'var(--text-3)' }} />
                  {item.name}
                </div>
              }
              hint={item.desc}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '3px 10px' }}>
                Скоро
              </span>
            </FieldRow>
          </div>
        ))}
      </Card>
      </WipLock>
    </div>
  );
}

/* ─── Security ───────────────────────────────────────────── */

function SecuritySection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirm] = useState('');
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState(null);

  const changePassword = async () => {
    setStatus(null);
    if (!newPwd) { setStatus({ type: 'error', msg: 'Введи новый пароль' }); return; }
    if (newPwd.length < 6) { setStatus({ type: 'error', msg: 'Минимум 6 символов' }); return; }
    if (newPwd !== confirmPwd) { setStatus({ type: 'error', msg: 'Пароли не совпадают' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setStatus({ type: 'success', msg: 'Пароль обновлён' });
      setNewPwd(''); setConfirm('');
      setTimeout(() => setStatus(null), 3500);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Ошибка' });
    } finally {
      setSaving(false);
    }
  };

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card gap={14}>
        <CardLabel>Изменить пароль</CardLabel>
        <FieldRow label="Новый пароль" column>
          <FieldInput type="password" value={newPwd} onChange={setNewPwd} placeholder="············" />
        </FieldRow>
        <FieldRow label="Повтори пароль" column>
          <FieldInput type="password" value={confirmPwd} onChange={setConfirm} placeholder="············" />
        </FieldRow>
        {status && <StatusMsg type={status.type}>{status.msg}</StatusMsg>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={changePassword}>
            {saving ? 'Обновление…' : 'Обновить пароль'}
          </Button>
        </div>
      </Card>

      <Card gap={14}>
        <CardLabel>Сессии</CardLabel>
        <FieldRow label="Текущий вход" hint="Активная сессия в этом браузере">
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', background: 'var(--bg-elev-2)', borderRadius: 6, padding: '3px 8px' }}>
            {new Date().toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </FieldRow>
        <Sep />
        <FieldRow label="Выйти со всех устройств" hint="Завершить все активные сессии, включая текущую">
          <Button variant="danger" onClick={signOutEverywhere}>Выйти везде</Button>
        </FieldRow>
      </Card>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────── */

function DataSection() {
  const navigate = useNavigate();
  const setOnboarding = useSetOnboardingStatus();
  const { data: stats } = useStorageStats();
  const MAX = 500 * 1024 * 1024;
  const used = stats?.size ?? 0;
  const pct  = Math.min(100, (used / MAX) * 100);
  const barColor = pct > 85 ? 'var(--danger)' : pct > 65 ? 'var(--warn)' : 'var(--p-openresto)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card gap={16}>
        <CardLabel>Хранилище файлов</CardLabel>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Использовано</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
              {fmtSize(used)}{' '}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/ {fmtSize(MAX)}</span>
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, minWidth: pct > 0 ? 4 : 0, background: barColor, borderRadius: 999, transition: 'width 400ms ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', marginRight: 4 }}>{stats?.total ?? 0}</span>файлов
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', marginRight: 4 }}>{fmtSize(MAX - used)}</span>свободно
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: pct > 65 ? barColor : 'var(--text)', marginRight: 4 }}>{pct.toFixed(1)}%</span>занято
            </span>
          </div>
        </div>
      </Card>

      <Card gap={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CardLabel>Экспорт данных</CardLabel>
          <WipBadge />
        </div>
        <WipLock message="Экспорт — в разработке">
          <FieldRow label="Все данные" hint="Задачи, заметки, цели, финансы — в формате JSON">
            <Button variant="secondary" icon="download">Скачать</Button>
          </FieldRow>
          <Sep />
          <FieldRow label="Только заметки" hint="Отдельный Markdown-файл для каждой заметки в ZIP">
            <Button variant="secondary" icon="download">Скачать</Button>
          </FieldRow>
          <Sep />
          <FieldRow label="Финансы" hint="Все заказы и транзакции в CSV">
            <Button variant="secondary" icon="download">Скачать</Button>
          </FieldRow>
        </WipLock>
      </Card>

      <Card gap={14}>
        <CardLabel>Обучение</CardLabel>
        <FieldRow label="Интерактивный тур по приложению" hint="Пройти обучение заново — с самого начала, по всем разделам">
          <Button
            variant="secondary" icon="star"
            onClick={() => { setOnboarding.mutate({ status: 'pending', step: 0 }); navigate('/dashboard'); }}
          >
            Пройти заново
          </Button>
        </FieldRow>
      </Card>

      <Card gap={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--danger)' }} />
            <CardLabel>Опасная зона</CardLabel>
          </div>
          <WipBadge />
        </div>
        <WipLock message="Пока недоступно">
          <FieldRow label="Очистить Inbox" hint="Удалить все обработанные элементы из Inbox">
            <Button variant="danger">Очистить</Button>
          </FieldRow>
          <Sep />
          <FieldRow label="Удалить аккаунт" hint="Удаляет все данные безвозвратно. Отменить невозможно.">
            <Button variant="danger">Удалить аккаунт</Button>
          </FieldRow>
        </WipLock>
      </Card>
    </div>
  );
}

/* ─── Screen ─────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'profile',       label: 'Профиль',     icon: 'users'   },
  { id: 'appearance',    label: 'Внешний вид', icon: 'star'    },
  { id: 'pages',         label: 'Страницы',    icon: 'layers'  },
  { id: 'notifications', label: 'Уведомления', icon: 'bell'    },
  { id: 'integrations',  label: 'Интеграции',  icon: 'zap'     },
  { id: 'security',      label: 'Безопасность',icon: 'lock'    },
  { id: 'data',          label: 'Данные',      icon: 'archive' },
];

export default function Settings() {
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionId = searchParams.get('section') || 'profile';
  const active = SECTIONS.find(s => s.id === sectionId) || SECTIONS[0];

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar title="Настройки" sub={active.label} />
        {isCompact && (
          <div className="ws-scroll" style={{ display: 'flex', gap: 6, padding: '10px 14px', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            {SECTIONS.map(s => {
              const isActive = s.id === sectionId;
              return (
                <button key={s.id} onClick={() => setSearchParams({ section: s.id })} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none', padding: '7px 13px', borderRadius: 20,
                  fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap',
                  background: isActive ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)',
                  color: isActive ? 'var(--text)' : 'var(--text-2)',
                  border: `1px solid ${isActive ? 'var(--border)' : 'var(--border-subtle)'}`,
                }}>
                  <Icon name={s.icon} size={13} />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: isCompact ? '16px 14px 28px' : '28px 36px 48px' }}>
          <div style={{ maxWidth: 580 }}>
            {sectionId === 'profile'       && <ProfileSection user={user} />}
            {sectionId === 'appearance'    && <AppearanceSection />}
            {sectionId === 'pages'         && <PagesSection />}
            {sectionId === 'notifications' && <NotificationsSection />}
            {sectionId === 'integrations'  && <IntegrationsSection />}
            {sectionId === 'security'      && <SecuritySection />}
            {sectionId === 'data'          && <DataSection />}
          </div>
        </div>
      </main>
    </div>
  );
}
