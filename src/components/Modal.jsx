import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';

/* Общая обёртка модалки: backdrop + карточка + заголовок */
export function Modal({ title, sub, width = 440, onClose, children }) {
  const mousedownOnBackdrop = useRef(false);
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width, maxHeight: '86vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* Стиль инпутов внутри модалок */
export const fieldStyle = {
  height: 36, padding: '0 12px', background: 'var(--bg-elev-1)',
  border: '1px solid var(--border-subtle)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

export function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

/* Подтверждение опасного действия — вместо нативного confirm() */
export function ConfirmModal({ title = 'Удалить?', text, confirmLabel = 'Удалить', onConfirm, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <Modal title={title} width={380} onClose={onClose}>
      {text && <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 100ms' }}>
          Отмена
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} autoFocus
          onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 85%, black)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--danger)'}
          style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 100ms' }}>
          <Icon name="trash" size={13} /> {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
