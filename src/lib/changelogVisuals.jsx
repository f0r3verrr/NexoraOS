import { Icon } from '../icons.jsx';

/* Общие визуальные куски для тостовой модалки "что нового" (ChangelogModal)
   и архивной страницы (WhatsNew) — чтобы премиальный hero-фон и чек-лист
   выглядели одинаково в обоих местах, а не расходились со временем. */

export const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };
export const PRIORITY_LABEL = { low: 'Патч', normal: 'Обновление', high: 'Важно' };

export const GRAIN_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

export const HERO_THEME = {
  changelog: { a: 'oklch(0.62 0.19 300 / 0.55)', b: 'oklch(0.55 0.17 260 / 0.5)', icon: 'var(--p-openresto)' },
  news: { a: 'oklch(0.66 0.16 220 / 0.5)', b: 'oklch(0.7 0.13 190 / 0.45)', icon: 'var(--info)' },
};

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Плоский текст для превью карточки — без markdown-разметки, обрезанный. */
export function excerpt(md, max = 150) {
  if (!md) return '';
  const plain = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/[*_~>#]/g, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

export const checklistComponents = {
  ul: ({ children }) => <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</ul>,
  li: ({ children }) => (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
      <span style={{
        width: 16, height: 16, borderRadius: 5, background: 'color-mix(in oklab, var(--success) 18%, transparent)',
        color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        <Icon name="check" size={10} stroke={3} />
      </span>
      <span>{children}</span>
    </li>
  ),
};

export function CloseButton({ onClose }) {
  return (
    <button onClick={onClose} style={{
      position: 'absolute', top: 14, right: 14, zIndex: 2,
      width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,14,0.5)', backdropFilter: 'blur(6px)',
      color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
    }}>
      <Icon name="x" size={15} />
    </button>
  );
}

/* Hero-плашка: обложка (если есть) ИЛИ фирменный градиент с шумом и медленным
   дрейфом свечения — читается как премиальный фон даже без картинки. */
export function HeroBanner({ kind, coverUrl, onClose, height = 154, radius = 22 }) {
  const theme = HERO_THEME[kind] ?? HERO_THEME.changelog;
  const isNews = kind === 'news';
  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: `${radius}px ${radius}px 0 0`, overflow: 'hidden' }}>
      {coverUrl ? (
        <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-elev-3)' }} />
      )}
      <div style={{
        position: 'absolute', inset: '-20%',
        background: `radial-gradient(45% 65% at 20% 15%, ${theme.a}, transparent 65%), radial-gradient(50% 70% at 88% 90%, ${theme.b}, transparent 60%)`,
        animation: 'cgGlowDrift 7s ease-in-out infinite',
        mixBlendMode: coverUrl ? 'overlay' : 'normal',
      }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay', backgroundImage: `url("${GRAIN_URL}")` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--bg-elev-2) 92%, transparent) 100%)' }} />
      <span style={{
        position: 'absolute', left: 20, bottom: 16,
        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(12,12,16,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)',
        color: theme.icon,
      }}>
        <Icon name={isNews ? 'globe' : 'zap'} size={18} />
      </span>
      {onClose && <CloseButton onClose={onClose} />}
    </div>
  );
}

export const HERO_KEYFRAMES = `
  @keyframes cgBackdropIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes cgModalIn { from { opacity: 0; transform: scale(0.95) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
  @keyframes cgGlowDrift {
    0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.9 }
    50% { transform: translate3d(2%, -3%, 0) scale(1.08); opacity: 1 }
  }
`;
