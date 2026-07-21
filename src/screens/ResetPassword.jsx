import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { Icon } from '../icons.jsx';
import { GradientCanvas } from './Login.jsx';

/*
 * Страница из письма восстановления: supabase-js сам обменивает токен
 * из ссылки на сессию (detectSessionInUrl), здесь задаём новый пароль.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady]     = useState(null);   // null — проверяем, true — есть сессия, false — ссылка мертва
  const [pw, setPw]           = useState('');
  const [pw2, setPw2]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    let cancelled = false;

    // сессия может появиться не мгновенно: supabase-js обрабатывает токен из URL
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setReady(true);
    });

    const timer = setTimeout(() => { if (!cancelled) setReady(r => r === null ? false : r); }, 4000);

    return () => { cancelled = true; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6) { setError('Пароль — минимум 6 символов'); return; }
    if (pw !== pw2)    { setError('Пароли не совпадают'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: 'color-mix(in oklab, var(--bg-elev-2) 78%, transparent)',
    backdropFilter: 'blur(28px)',
    border: '1px solid color-mix(in oklab, var(--border) 60%, transparent)',
    borderRadius: 18, padding: '28px 28px',
    boxShadow: 'var(--shadow-modal)',
    display: 'flex', flexDirection: 'column', gap: 16,
  };
  const inputStyle = {
    height: 40, padding: '0 14px',
    background: 'color-mix(in oklab, var(--bg-elev-3) 60%, transparent)',
    border: '1px solid color-mix(in oklab, var(--border) 55%, transparent)',
    borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      <GradientCanvas />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, boxSizing: 'border-box', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <img src="/favicon.png" alt="NexoraOS" style={{ width: 72, borderRadius: 18, filter: 'drop-shadow(0 0 24px color-mix(in oklab, var(--p-openresto) 50%, transparent))' }} />
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>Новый пароль</div>
        </div>

        {ready === null && (
          <div className="modal-enter" style={{ ...cardStyle, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Проверяем ссылку…</span>
          </div>
        )}

        {ready === false && (
          <div className="modal-enter" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: 'color-mix(in oklab, var(--danger) 14%, transparent)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="x" size={20} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', textAlign: 'center' }}>Ссылка устарела или уже использована</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
              Запроси восстановление ещё раз — пришлём новое письмо.
            </div>
            <Link to="/login" style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>← Ко входу</Link>
          </div>
        )}

        {ready === true && (done ? (
          <div className="modal-enter" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 16%, transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="check" size={20} stroke={2} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', textAlign: 'center' }}>Пароль обновлён — входим…</div>
          </div>
        ) : (
          <form onSubmit={submit} className="modal-enter" style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>Новый пароль</label>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="············" autoFocus autoComplete="new-password" required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>Ещё раз</label>
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="············" autoComplete="new-password" required style={inputStyle} />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'color-mix(in oklab, var(--danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                <Icon name="x" size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ height: 40, borderRadius: 10, background: loading ? 'var(--bg-elev-3)' : 'var(--text)', color: loading ? 'var(--text-3)' : 'var(--bg)', fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer', border: 'none' }}>
              {loading ? 'Сохраняем…' : 'Сохранить пароль'}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
