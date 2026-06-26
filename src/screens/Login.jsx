import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Icon } from '../icons.jsx';

/* ---- Animated gradient canvas ---- */
// Approximate sRGB for NexoraOS OKLCH palette
const BLOBS = [
  { ox: 0.14, oy: 0.52, r: 0.68, rgb: [55, 198, 182],  sp: [ 0.28,  0.20] }, // teal   --p-openresto
  { ox: 0.83, oy: 0.14, r: 0.58, rgb: [130, 88, 232],   sp: [-0.22,  0.34] }, // purple --p-youmin
  { ox: 0.50, oy: 0.92, r: 0.50, rgb: [68, 118, 228],   sp: [ 0.24, -0.26] }, // blue   --p-sites
  { ox: 0.78, oy: 0.76, r: 0.42, rgb: [222, 146, 62],   sp: [-0.26, -0.18] }, // amber  --p-diploma
  { ox: 0.28, oy: 0.18, r: 0.36, rgb: [236, 100, 148],  sp: [ 0.32, -0.23] }, // pink   --p-bots
];

function GradientCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    function sync() {
      const W = canvas.clientWidth | 0;
      const H = canvas.clientHeight | 0;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
    }

    function tick() {
      sync();
      t += 0.003;
      const W = canvas.width;
      const H = canvas.height;
      if (!W || !H) { raf = requestAnimationFrame(tick); return; }

      ctx.clearRect(0, 0, W, H);

      for (const b of BLOBS) {
        const x = (b.ox + 0.22 * Math.sin(t * b.sp[0] + b.ox * 5.3)) * W;
        const y = (b.oy + 0.18 * Math.cos(t * b.sp[1] + b.oy * 5.3)) * H;
        const r = b.r * Math.min(W, H);

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = b.rgb;
        g.addColorStop(0,    `rgba(${cr},${cg},${cb},0.26)`);
        g.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.09)`);
        g.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block', pointerEvents: 'none',
      }}
    />
  );
}

/* ---- Main screen ---- */
export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        if (!name.trim()) throw new Error('Введи имя');
        const { error } = await signUp(email, password, name.trim());
        if (error) throw error;
        setMode('confirm');
      }
    } catch (err) {
      setError(err.message || 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: 'color-mix(in oklab, var(--bg-elev-2) 78%, transparent)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid color-mix(in oklab, var(--border) 60%, transparent)',
    borderRadius: 18,
    padding: '28px 28px',
    boxShadow: 'var(--shadow-modal), inset 0 1px 0 color-mix(in oklab, var(--text) 6%, transparent)',
    display: 'flex', flexDirection: 'column', gap: 16,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
    }}>
      <GradientCanvas />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 400,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="NexoraOS" style={{
            width: 260,
            display: 'block',
            filter: 'drop-shadow(0 0 28px color-mix(in oklab, var(--p-openresto) 55%, transparent))',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.02em' }}>NexoraOS</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {mode === 'login'    && 'Добро пожаловать'}
              {mode === 'register' && 'Создать аккаунт'}
              {mode === 'confirm'  && 'Проверь почту'}
            </div>
          </div>
        </div>

        {mode === 'confirm' ? (
          <div className="modal-enter" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 16%, transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="check" size={20} stroke={2} />
            </div>
            <div style={{ fontSize: 15, color: 'var(--text)', textAlign: 'center' }}>
              Письмо отправлено на <strong>{email}</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, textAlign: 'center' }}>
              Перейди по ссылке в письме, чтобы подтвердить аккаунт. Потом вернись сюда и войди.
            </div>
            <button onClick={() => setMode('login')} style={{ color: 'var(--text-2)', fontSize: 13, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              Уже подтвердил — войти
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-enter" style={cardStyle}>
            {mode === 'register' && (
              <Field label="Имя" type="text" value={name} onChange={setName} placeholder="Кирилл" autoFocus />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="me@example.com" autoFocus={mode === 'login'} />
            <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="············" />

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                background: 'color-mix(in oklab, var(--danger) 10%, transparent)',
                border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)',
                borderRadius: 8, fontSize: 13, color: 'var(--danger)',
              }}>
                <Icon name="x" size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 4px 24px -4px color-mix(in oklab, var(--text) 45%, transparent)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
              style={{
                height: 40, borderRadius: 10,
                background: loading ? 'var(--bg-elev-3)' : 'var(--text)',
                color: 'var(--bg)',
                fontSize: 14, fontWeight: 500,
                letterSpacing: '-0.005em',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 120ms, box-shadow 150ms',
              }}>
              {loading ? <Spinner /> : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
              {mode === 'login' ? (
                <>Нет аккаунта? <TextBtn onClick={() => { setMode('register'); setError(''); }}>Зарегистрироваться</TextBtn></>
              ) : (
                <>Уже есть аккаунт? <TextBtn onClick={() => { setMode('login'); setError(''); }}>Войти</TextBtn></>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.02em' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
        required
        style={{
          height: 40, padding: '0 14px',
          background: 'color-mix(in oklab, var(--bg-elev-3) 60%, transparent)',
          border: '1px solid color-mix(in oklab, var(--border) 55%, transparent)',
          borderRadius: 8,
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--border-strong)';
          e.target.style.boxShadow = '0 0 0 2.5px color-mix(in oklab, var(--text) 10%, transparent)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'color-mix(in oklab, var(--border) 55%, transparent)';
          e.target.style.boxShadow = '';
        }}
      />
    </div>
  );
}

function TextBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ color: 'var(--text)', fontWeight: 500, fontSize: 'inherit', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  );
}
