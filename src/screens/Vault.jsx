import { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useIsCompact } from '../hooks/useViewport.js';
import { Icon } from '../icons.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  useVaultNotes, useCreateVaultNote, useUpdateVaultNote, useDeleteVaultNote,
  useVaultCreds, useCreateVaultCred, useUpdateVaultCred, useDeleteVaultCred,
} from '../hooks/useVault.js';

/* ─── Crypto helpers ─────────────────────────────────────── */

async function hashPw(password, salt) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(salt + password)
  );
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function makeSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_KEY = 'nexora_vault_session';

/* ─── Layout helpers ─────────────────────────────────────── */

const LIST_W = 260;

function timeAgo(dateStr) {
  const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

const ACCENTS = [
  'var(--p-openresto)', 'var(--p-youmin)', 'var(--p-diploma)',
  'var(--p-sites)', 'var(--p-bots)', 'var(--p-health)', 'var(--p-home)',
];
function accentFor(str = '') {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return ACCENTS[Math.abs(h) % ACCENTS.length];
}

/* ─── Shared UI atoms ────────────────────────────────────── */

function SaveBadge({ status }) {
  return (
    <span style={{
      fontSize: 11,
      color: status === 'saving' ? 'var(--text-muted)' : status === 'saved' ? 'var(--success)' : 'transparent',
      transition: 'color 200ms', minWidth: 84, textAlign: 'right',
    }}>
      {status === 'saving' ? 'Сохранение…' : 'Сохранено'}
    </span>
  );
}

function DeleteBtn({ onClick, label = 'Удалить' }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 16%, transparent)'}
      onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 8%, transparent)'}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
        color: 'var(--danger)',
        background: 'color-mix(in oklab, var(--danger) 8%, transparent)',
        border: '1px solid color-mix(in oklab, var(--danger) 22%, transparent)',
        borderRadius: 6, padding: '5px 11px', cursor: 'pointer',
        transition: 'background 120ms', flex: 'none',
      }}>
      <Icon name="trash" size={12} />
      {label}
    </button>
  );
}

function CredField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldStyle = {
  flex: 1, height: 36, padding: '0 12px',
  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 120ms, box-shadow 120ms',
  fontFamily: 'var(--font-sans)',
};

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 8,
  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-3)', flex: 'none', transition: 'background 120ms',
};

function EmptyDetail({ icon, text }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
      <Icon name={icon} size={30} />
      <span style={{ fontSize: 13 }}>{text}</span>
    </div>
  );
}

/* ─── Lock screens ───────────────────────────────────────── */

function PwInput({ value, onChange, onEnter, placeholder = 'Пароль', autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', height: 42, padding: '0 42px 0 14px',
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          borderRadius: 10, fontSize: 14, color: 'var(--text)', outline: 'none',
          boxSizing: 'border-box', letterSpacing: show ? 'normal' : '0.08em',
          fontFamily: show ? 'var(--font-sans)' : 'var(--font-mono)',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-3)', display: 'flex', padding: 4,
        }}>
        <Icon name={show ? 'eye_off' : 'eye'} size={15} />
      </button>
    </div>
  );
}

/* Setup — first time setting a vault password */
function SetupPassword({ user, onDone }) {
  const [pw,   setPw]   = useState('');
  const [pw2,  setPw2]  = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 4)       { setErr('Минимум 4 символа'); return; }
    if (pw !== pw2)          { setErr('Пароли не совпадают'); return; }
    setBusy(true); setErr('');
    try {
      const salt = makeSalt();
      const hash = await hashPw(pw, salt);
      await supabase.auth.updateUser({ data: { vault_hash: hash, vault_salt: salt } });
      sessionStorage.setItem(SESSION_KEY, user.id);
      onDone();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'color-mix(in oklab, var(--p-openresto) 14%, var(--bg-elev-2))',
          border: '1px solid color-mix(in oklab, var(--p-openresto) 28%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--p-openresto)',
        }}>
          <Icon name="lock" size={30} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Создай пароль Vault
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.55 }}>
            Защити личные заметки и пароли.<br />
            Хранилище будет заблокировано при каждом входе.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PwInput value={pw} onChange={setPw} onEnter={() => document.querySelector('#pw2')?.focus()} placeholder="Новый пароль" autoFocus />
          <div id="pw2">
            <PwInput value={pw2} onChange={setPw2} onEnter={submit} placeholder="Повтори пароль" />
          </div>
          {err && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</span>}
        </div>

        <button
          onClick={submit}
          disabled={busy}
          onMouseEnter={e => { if (!busy) e.currentTarget.style.boxShadow = '0 2px 16px -4px color-mix(in oklab, var(--text) 36%, transparent)'; }}
          onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
          style={{
            width: '100%', height: 42, borderRadius: 10,
            background: busy ? 'var(--bg-elev-3)' : 'var(--text)',
            color: busy ? 'var(--text-muted)' : 'var(--bg)',
            fontSize: 14, fontWeight: 600, border: 'none',
            cursor: busy ? 'default' : 'pointer',
            transition: 'box-shadow 150ms, background 150ms',
          }}>
          {busy ? 'Сохранение…' : 'Создать пароль'}
        </button>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Пароль хранится в виде хэша и не передаётся на сервер в открытом виде
        </span>
      </div>
    </div>
  );
}

/* Reset modal */
function ResetModal({ onClose, onReset }) {
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const doReset = async () => {
    if (confirm.toLowerCase() !== 'удалить') return;
    setBusy(true);
    await onReset();
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}>
      <div className="modal-enter" style={{ width: 400, maxWidth: '100%', boxSizing: 'border-box', background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'color-mix(in oklab, var(--danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 24%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flex: 'none' }}>
            <Icon name="trash" size={17} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Сбросить пароль Vault</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5, lineHeight: 1.6 }}>
              Все данные хранилища — заметки и сохранённые пароли — будут удалены безвозвратно. Пароль Vault будет сброшен.
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 14px', background: 'color-mix(in oklab, var(--danger) 7%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 18%, transparent)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>
            Это действие необратимо. Восстановить данные будет невозможно.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Введи <strong style={{ color: 'var(--text-2)' }}>удалить</strong> для подтверждения
          </label>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doReset()}
            autoFocus
            placeholder="удалить"
            style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-3)', border: `1px solid ${confirm.toLowerCase() === 'удалить' ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', transition: 'border-color 150ms' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{ height: 36, padding: '0 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', transition: 'background 100ms' }}>
            Отмена
          </button>
          <button
            onClick={doReset}
            disabled={confirm.toLowerCase() !== 'удалить' || busy}
            style={{
              height: 36, padding: '0 16px', borderRadius: 8,
              background: confirm.toLowerCase() === 'удалить' && !busy ? 'var(--danger)' : 'color-mix(in oklab, var(--danger) 30%, var(--bg-elev-3))',
              color: confirm.toLowerCase() === 'удалить' && !busy ? 'white' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, border: 'none',
              cursor: confirm.toLowerCase() === 'удалить' && !busy ? 'pointer' : 'default',
              transition: 'background 150ms',
            }}>
            {busy ? 'Удаление…' : 'Сбросить и удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Unlock — vault has password, enter it */
function UnlockVault({ user, onUnlock }) {
  const [pw,       setPw]       = useState('');
  const [err,      setErr]      = useState('');
  const [busy,     setBusy]     = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const tryUnlock = async () => {
    if (!pw) return;
    setBusy(true); setErr('');
    try {
      const { vault_hash, vault_salt } = user.user_metadata;
      const hash = await hashPw(pw, vault_salt);
      if (hash === vault_hash) {
        sessionStorage.setItem(SESSION_KEY, user.id);
        onUnlock();
      } else {
        setErr('Неверный пароль');
        setBusy(false);
      }
    } catch (e) {
      setErr(e.message || 'Ошибка');
      setBusy(false);
    }
  };

  const handleReset = async () => {
    // Delete all vault data and clear password
    const uid = user.id;
    await supabase.from('vault_notes').delete().eq('user_id', uid);
    await supabase.from('vault_credentials').delete().eq('user_id', uid);
    await supabase.auth.updateUser({ data: { vault_hash: null, vault_salt: null } });
    sessionStorage.removeItem(SESSION_KEY);
    onUnlock(); // Will re-check and go to setup
    window.location.reload();
  };

  return (
    <>
      {resetOpen && <ResetModal onClose={() => setResetOpen(false)} onReset={handleReset} />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          {/* Lock icon with pulse */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)',
          }}>
            <Icon name="lock" size={30} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Vault заблокирован
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
              Введи пароль для доступа к хранилищу
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PwInput value={pw} onChange={v => { setPw(v); setErr(''); }} onEnter={tryUnlock} autoFocus />
            {err && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)' }}>
                <Icon name="info" size={12} />
                {err}
              </div>
            )}
          </div>

          <button
            onClick={tryUnlock}
            disabled={busy || !pw}
            onMouseEnter={e => { if (!busy && pw) e.currentTarget.style.boxShadow = '0 2px 16px -4px color-mix(in oklab, var(--text) 36%, transparent)'; }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            style={{
              width: '100%', height: 42, borderRadius: 10,
              background: busy || !pw ? 'var(--bg-elev-3)' : 'var(--text)',
              color: busy || !pw ? 'var(--text-muted)' : 'var(--bg)',
              fontSize: 14, fontWeight: 600, border: 'none',
              cursor: busy || !pw ? 'default' : 'pointer',
              transition: 'box-shadow 150ms, background 150ms',
            }}>
            {busy ? 'Проверка…' : 'Открыть'}
          </button>

          <button
            onClick={() => setResetOpen(true)}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--border)', textUnderlineOffset: 3 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Забыл пароль — сбросить хранилище
          </button>
        </div>
      </div>
    </>
  );
}

/* VaultGuard — wraps content with auth state machine */
function VaultGuard({ user, children }) {
  const [state, setState] = useState('checking'); // checking | setup | locked | open

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    if (!meta.vault_hash) {
      setState('setup');
    } else if (sessionStorage.getItem(SESSION_KEY) === user.id) {
      setState('open');
    } else {
      setState('locked');
    }
  }, [user?.id]);

  if (state === 'checking') return null;
  if (state === 'setup')  return <SetupPassword user={user} onDone={() => setState('open')} />;
  if (state === 'locked') return <UnlockVault   user={user} onUnlock={() => setState('open')} />;
  return children;
}

/* ─── Notes pane ─────────────────────────────────────────── */

function NotesPane() {
  const isCompact = useIsCompact();
  const { data: notes = [], isLoading } = useVaultNotes();
  const create = useCreateVaultNote();
  const update = useUpdateVaultNote();
  const del    = useDeleteVaultNote();

  const [selId,  setSelId] = useState(null);
  const [lTitle, setLT]    = useState('');
  const [lBody,  setLB]    = useState('');
  const [save,   setSave]  = useState(null);
  const timer = useRef(null);

  const selected = notes.find(n => n.id === selId) ?? null;

  useEffect(() => {
    if (notes.length && !selId) setSelId(notes[0].id);
  }, [notes.length]);

  useEffect(() => {
    if (selected) { setLT(selected.title); setLB(selected.content); }
  }, [selId]);

  const schedSave = useCallback((id, title, content) => {
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update.mutateAsync({ id, title, content }).then(() => {
        setSave('saved'); setTimeout(() => setSave(null), 2000);
      });
    }, 700);
  }, [update]);

  const onT = v => { setLT(v); if (selected) schedSave(selected.id, v, lBody); };
  const onB = v => { setLB(v); if (selected) schedSave(selected.id, lTitle, v); };

  const add = async () => { const n = await create.mutateAsync({}); setSelId(n.id); };
  const del_ = async () => {
    if (!selected) return;
    clearTimeout(timer.current);
    await del.mutateAsync(selected.id);
    setSelId(null);
  };

  const n = notes.length;
  const plural = n === 1 ? 'заметка' : n < 5 ? 'заметки' : 'заметок';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* List — на compact на весь экран, пока запись не открыта */}
      {(!isCompact || !selected) && (
      <div style={{ width: isCompact ? '100%' : LIST_W, flex: isCompact ? 1 : 'none', minWidth: 0, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {isLoading ? '…' : `${n} ${plural}`}
          </span>
          <button onClick={add}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 120ms, color 120ms' }}>
            <Icon name="plus" size={15} />
          </button>
        </div>

        {notes.length === 0 && !isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', padding: 20 }}>
            <Icon name="note" size={24} />
            <span style={{ fontSize: 12, textAlign: 'center' }}>Нет заметок — создай первую</span>
          </div>
        ) : (
          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {notes.map(note => (
              <div key={note.id} onClick={() => setSelId(note.id)}
                onMouseEnter={e => { if (note.id !== selId) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (note.id !== selId) e.currentTarget.style.background = 'transparent'; }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderLeft: `2px solid ${note.id === selId ? 'var(--p-openresto)' : 'transparent'}`, background: note.id === selId ? 'var(--bg-elev-2)' : 'transparent', transition: 'background 100ms' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
                    {note.title || 'Без названия'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 'none' }}>{timeAgo(note.updated_at)}</span>
                </div>
                {note.content && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {note.content.replace(/\n/g, ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Editor — на compact рендерится только когда заметка открыта */}
      {(!isCompact || selected) && (selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isCompact && (
                <button onClick={() => setSelId(null)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chevron_left" size={15} />
                </button>
              )}
              <SaveBadge status={save} />
            </div>
            <DeleteBtn onClick={del_} />
          </div>
          <input value={lTitle} onChange={e => onT(e.target.value)} placeholder="Без названия"
            style={{ padding: '22px 26px 8px', fontSize: 20, fontWeight: 600, color: 'var(--text)', background: 'transparent', border: 'none', outline: 'none', flex: 'none', letterSpacing: '-0.02em' }} />
          <textarea value={lBody} onChange={e => onB(e.target.value)} placeholder="Начни писать…"
            className="ws-scroll"
            style={{ flex: 1, padding: '4px 26px 24px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.75, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)' }} />
        </div>
      ) : (
        <EmptyDetail icon="note" text="Выбери заметку или создай новую" />
      ))}
    </div>
  );
}

/* ─── Credentials pane ───────────────────────────────────── */

function CredsPane() {
  const isCompact = useIsCompact();
  const { data: creds = [], isLoading } = useVaultCreds();
  const create = useCreateVaultCred();
  const update = useUpdateVaultCred();
  const del    = useDeleteVaultCred();

  const [selId,  setSelId] = useState(null);
  const [form,   setForm]  = useState({ title: '', url: '', login: '', password: '', notes: '' });
  const [showPw, setSP]    = useState(false);
  const [copied, setCop]   = useState(null);
  const [save,   setSave]  = useState(null);
  const timer = useRef(null);

  const selected = creds.find(c => c.id === selId) ?? null;

  useEffect(() => {
    if (selected) {
      setForm({ title: selected.title ?? '', url: selected.url ?? '', login: selected.login ?? '', password: selected.password ?? '', notes: selected.notes ?? '' });
      setSP(false);
    }
  }, [selId]);

  const schedSave = useCallback((id, data) => {
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update.mutateAsync({ id, ...data }).then(() => {
        setSave('saved'); setTimeout(() => setSave(null), 2000);
      });
    }, 700);
  }, [update]);

  const setField = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    if (selected) schedSave(selected.id, next);
  };

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCop(key);
    setTimeout(() => setCop(null), 1800);
  };

  const add = async () => { const c = await create.mutateAsync({ title: 'Новый аккаунт' }); setSelId(c.id); };
  const del_ = async () => {
    if (!selected) return;
    clearTimeout(timer.current);
    await del.mutateAsync(selected.id);
    setSelId(null);
  };

  const n = creds.length;
  const plural = n === 1 ? 'аккаунт' : n < 5 ? 'аккаунта' : 'аккаунтов';
  const accent = accentFor(form.title);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* List — на compact на весь экран, пока запись не открыта */}
      {(!isCompact || !selected) && (
      <div style={{ width: isCompact ? '100%' : LIST_W, flex: isCompact ? 1 : 'none', minWidth: 0, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {isLoading ? '…' : `${n} ${plural}`}
          </span>
          <button onClick={add}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 120ms, color 120ms' }}>
            <Icon name="plus" size={15} />
          </button>
        </div>

        {creds.length === 0 && !isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', padding: 20 }}>
            <Icon name="lock" size={24} />
            <span style={{ fontSize: 12, textAlign: 'center' }}>Нет паролей — добавь первый</span>
          </div>
        ) : (
          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {creds.map(c => {
              const color = accentFor(c.title);
              return (
                <div key={c.id} onClick={() => setSelId(c.id)}
                  onMouseEnter={e => { if (c.id !== selId) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (c.id !== selId) e.currentTarget.style.background = 'transparent'; }}
                  style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `2px solid ${c.id === selId ? 'var(--p-openresto)' : 'transparent'}`, background: c.id === selId ? 'var(--bg-elev-2)' : 'transparent', transition: 'background 100ms' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flex: 'none', background: `color-mix(in oklab, ${color} 16%, var(--bg-elev-3))`, border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>
                    {(c.title || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.title || 'Без названия'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.login || c.url || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Detail — на compact рендерится только когда запись открыта */}
      {(!isCompact || selected) && (selected ? (
        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 520, padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              {isCompact && (
                <button onClick={() => setSelId(null)} style={{ width: 32, height: 32, flex: 'none', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chevron_left" size={16} />
                </button>
              )}
              <div style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', background: `color-mix(in oklab, ${accent} 16%, var(--bg-elev-3))`, border: `1px solid color-mix(in oklab, ${accent} 28%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: accent }}>
                {(form.title || '?')[0].toUpperCase()}
              </div>
              <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Название сервиса"
                style={{ flex: 1, fontSize: 18, fontWeight: 600, color: 'var(--text)', background: 'transparent', border: 'none', outline: 'none', letterSpacing: '-0.01em' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SaveBadge status={save} />
                <DeleteBtn onClick={del_} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CredField label="Сайт">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.url} onChange={e => setField('url', e.target.value)} placeholder="https://example.com" style={fieldStyle} />
                  {form.url && (
                    <button onClick={() => window.open(form.url.startsWith('http') ? form.url : `https://${form.url}`, '_blank')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                      style={iconBtnStyle} title="Открыть сайт">
                      <Icon name="external" size={13} />
                    </button>
                  )}
                </div>
              </CredField>

              <CredField label="Логин / Email">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.login} onChange={e => setField('login', e.target.value)} placeholder="user@example.com" style={fieldStyle} />
                  <button onClick={() => copy(form.login, 'login')}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                    style={{ ...iconBtnStyle, color: copied === 'login' ? 'var(--success)' : 'var(--text-3)', transition: 'background 120ms, color 150ms' }} title="Скопировать">
                    <Icon name={copied === 'login' ? 'check' : 'copy'} size={13} />
                  </button>
                </div>
              </CredField>

              <CredField label="Пароль">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.password} onChange={e => setField('password', e.target.value)}
                    type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    style={{ ...fieldStyle, letterSpacing: showPw ? 'normal' : '0.12em', fontFamily: showPw ? 'var(--font-sans)' : 'var(--font-mono)' }} />
                  <button onClick={() => setSP(v => !v)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                    style={iconBtnStyle} title={showPw ? 'Скрыть' : 'Показать'}>
                    <Icon name={showPw ? 'eye_off' : 'eye'} size={13} />
                  </button>
                  <button onClick={() => copy(form.password, 'password')}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                    style={{ ...iconBtnStyle, color: copied === 'password' ? 'var(--success)' : 'var(--text-3)', transition: 'background 120ms, color 150ms' }} title="Скопировать">
                    <Icon name={copied === 'password' ? 'check' : 'copy'} size={13} />
                  </button>
                </div>
              </CredField>

              <CredField label="Заметки">
                <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
                  placeholder="PIN, секретный вопрос, ключ восстановления…"
                  rows={4} className="ws-scroll"
                  style={{ ...fieldStyle, height: 'auto', resize: 'vertical', padding: '10px 12px', lineHeight: 1.65 }} />
              </CredField>
            </div>
          </div>
        </div>
      ) : (
        <EmptyDetail icon="lock" text="Выбери аккаунт или добавь новый" />
      ))}
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────── */

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ height: 28, padding: '0 13px', borderRadius: 7, fontSize: 12, fontWeight: active ? 500 : 400, background: active ? 'var(--bg-elev-3)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-3)', border: active ? '1px solid var(--border)' : '1px solid transparent', cursor: 'pointer', transition: 'all 140ms' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)'; }}>
      {children}
    </button>
  );
}

/* ─── Screen ─────────────────────────────────────────────── */

export default function Vault() {
  const { user } = useAuth();
  const [tab, setTab] = useState('notes');

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Vault"
          sub="Приватное хранилище"
          right={
            <div style={{ display: 'flex', gap: 4, padding: '3px', background: 'var(--bg-elev-2)', borderRadius: 9, border: '1px solid var(--border-subtle)' }}>
              <TabBtn active={tab === 'notes'} onClick={() => setTab('notes')}>Заметки</TabBtn>
              <TabBtn active={tab === 'creds'} onClick={() => setTab('creds')}>Пароли</TabBtn>
            </div>
          }
        />
        <VaultGuard user={user}>
          {tab === 'notes' ? <NotesPane key="notes" /> : <CredsPane key="creds" />}
        </VaultGuard>
      </main>
    </div>
  );
}
