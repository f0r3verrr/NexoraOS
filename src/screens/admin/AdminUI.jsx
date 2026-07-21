import { Icon } from '../../icons.jsx';

/* Общие презентационные кусочки для всех страниц админки */

export function Card({ children, style, gap = 14 }) {
  return (
    <div style={{
      padding: 20, borderRadius: 16, background: 'var(--bg-elev-1)',
      border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap, ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14.5, fontWeight: 550 }}>{title}</span>
      {action}
    </div>
  );
}

export function Metric({ label, value, icon, delta, deltaColor, accent = 'var(--p-openresto)' }) {
  return (
    <div style={{
      padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 150,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent,
        }}>
          <Icon name={icon} size={15} />
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{value}</div>
      {delta && <div style={{ fontSize: 11.5, color: deltaColor ?? 'var(--text-muted)' }}>{delta}</div>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const map = {
    neutral: 'var(--text-3)', success: 'var(--success)', warn: 'var(--warn)', danger: 'var(--danger)', info: 'var(--info)',
  };
  const c = map[tone] ?? map.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600, padding: '3px 9px',
      borderRadius: 999, background: `color-mix(in oklab, ${c} 15%, transparent)`, color: c, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

export function StatusDot({ color }) {
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: color, flexShrink: 0 }} />;
}

export function EmptyState({ icon = 'archive', text }) {
  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
      <Icon name={icon} size={22} />
      <span style={{ fontSize: 13 }}>{text}</span>
    </div>
  );
}

export function AdminButton({ children, onClick, variant = 'secondary', danger, style, disabled }) {
  const variants = {
    primary:   { background: 'var(--text)', color: 'var(--bg)', border: 'none' },
    secondary: { background: 'var(--bg-elev-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--text-3)', border: '1px solid transparent' },
  };
  const base = danger
    ? { background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in oklab, var(--danger) 40%, transparent)' }
    : variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 34, padding: '0 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'opacity 100ms', ...base, ...style,
    }}>
      {children}
    </button>
  );
}
