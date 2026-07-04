import { Icon } from '../icons.jsx';

export function Button({ variant = 'ghost', size = 'md', icon, trailing, children, style, onClick, disabled = false }) {
  const sizes = {
    sm: { h: 28, padX: 10, fs: 13, gap: 6, iconSize: 14, radius: 8 },
    md: { h: 32, padX: 12, fs: 13, gap: 8, iconSize: 15, radius: 8 },
    lg: { h: 36, padX: 14, fs: 14, gap: 8, iconSize: 16, radius: 10 },
  }[size];

  const variants = {
    primary:   { background: 'var(--text)',    color: 'var(--bg)',    border: '1px solid var(--text)' },
    secondary: { background: 'var(--bg-elev-2)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent',    color: 'var(--text-2)', border: '1px solid transparent' },
    outline:   { background: 'transparent',    color: 'var(--text)',   border: '1px solid var(--border)' },
    danger:    {
      background: 'color-mix(in oklab, var(--danger) 14%, transparent)',
      color: 'var(--danger)',
      border: '1px solid color-mix(in oklab, var(--danger) 35%, transparent)',
    },
  }[variant];

  function handleMouseEnter(e) {
    if (disabled) return;
    if (variant === 'primary')   { e.currentTarget.style.boxShadow = '0 2px 16px -4px color-mix(in oklab, var(--text) 44%, transparent)'; return; }
    if (variant === 'secondary') { e.currentTarget.style.background = 'var(--bg-elev-3)'; return; }
    if (variant === 'ghost')     { e.currentTarget.style.background = 'var(--bg-elev-2)'; return; }
    if (variant === 'outline')   { e.currentTarget.style.background = 'var(--bg-elev-2)'; return; }
    if (variant === 'danger')    { e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 24%, transparent)'; return; }
  }

  function handleMouseLeave(e) {
    if (variant === 'primary') { e.currentTarget.style.boxShadow = ''; return; }
    e.currentTarget.style.background = variants.background;
  }

  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{
      display: 'inline-flex', alignItems: 'center',
      gap: sizes.gap, height: sizes.h,
      padding: `0 ${sizes.padX}px`,
      borderRadius: sizes.radius,
      fontSize: sizes.fs, fontWeight: 500,
      letterSpacing: '-0.005em', whiteSpace: 'nowrap',
      transition: 'background 120ms ease-out, border-color 120ms ease-out, box-shadow 150ms ease-out',
      opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer',
      ...variants, ...style,
    }}>
      {icon && <Icon name={icon} size={sizes.iconSize} />}
      {children}
      {trailing}
    </button>
  );
}

export function IconButton({ icon, size = 'md', title, onClick, style }) {
  const d = { sm: 24, md: 28, lg: 32 }[size];
  const s = { sm: 14, md: 16, lg: 18 }[size];
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{
        width: d, height: d,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, color: 'var(--text-2)', background: 'transparent',
        transition: 'background 120ms ease-out, color 120ms ease-out',
        ...style,
      }}>
      <Icon name={icon} size={s} />
    </button>
  );
}

export function Input({ value, placeholder, icon, trailing, size = 'md', style }) {
  const h = { sm: 28, md: 34, lg: 40 }[size];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: h, padding: '0 12px',
      background: 'var(--bg-elev-2)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8, color: 'var(--text-2)', ...style,
    }}>
      {icon && <Icon name={icon} size={15} />}
      <span style={{
        flex: 1, color: value ? 'var(--text)' : 'var(--text-muted)',
        fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value || placeholder}</span>
      {trailing}
    </div>
  );
}

export function Kbd({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, padding: '0 5px',
      borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11,
      color: 'var(--text-3)', background: 'var(--bg-elev-3)',
      border: '1px solid var(--border-subtle)',
    }}>{children}</span>
  );
}

export function Badge({ tone = 'neutral', variant = 'soft', children, dot, icon }) {
  const toneColors = {
    neutral: 'var(--text-2)', success: 'var(--success)',
    warn: 'var(--warn)',       danger: 'var(--danger)', info: 'var(--info)',
  };
  const c = tone.startsWith('--') ? `var(${tone})` : toneColors[tone];
  const styles = variant === 'soft' ? {
    background: `color-mix(in oklab, ${c} 14%, transparent)`,
    color: c,
    border: `1px solid color-mix(in oklab, ${c} 22%, transparent)`,
  } : {
    background: 'transparent', color: c,
    border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 22, padding: '0 8px', borderRadius: 999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', ...styles,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function ProjectTag({ projectToken, label, size = 'md' }) {
  const s = size === 'sm' ? { fs: 11, dot: 6, gap: 5 } : { fs: 12, dot: 7, gap: 6 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      fontSize: s.fs, color: 'var(--text-3)', fontWeight: 500,
    }}>
      <span style={{ width: s.dot, height: s.dot, borderRadius: 999, background: `var(${projectToken})` }} />
      {label}
    </span>
  );
}

export function Checkbox({ checked, priority }) {
  const ringColor = priority === 1 ? 'var(--danger)'
    : priority === 2 ? 'var(--warn)'
    : priority === 3 ? 'var(--info)'
    : 'var(--border-strong)';
  return (
    <span style={{
      width: 16, height: 16, borderRadius: 5,
      border: `1.5px solid ${ringColor}`,
      background: checked ? ringColor : 'transparent',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flex: 'none', transition: 'background 120ms',
    }}>
      {checked && <Icon name="check" size={11} style={{ color: 'var(--bg)' }} stroke={2.5} />}
    </span>
  );
}

export function Avatar({ initials, color = 'var(--p-openresto)', size = 28 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: `color-mix(in oklab, ${color} 22%, transparent)`,
      color, fontSize: Math.round(size * 0.42), fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      flex: 'none',
    }}>{initials}</span>
  );
}

export function Tabs({ items, active, onSelect }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--bg-elev-2)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
      {items.map((it) => {
        const isActive = it === active;
        return (
          <span key={it} onClick={() => onSelect?.(it)}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'var(--bg-elev-3)' : 'transparent'; }}
            style={{
              height: 26, padding: '0 12px',
              display: 'inline-flex', alignItems: 'center',
              fontSize: 13, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
              color: isActive ? 'var(--text)' : 'var(--text-3)',
              background: isActive ? 'var(--bg-elev-3)' : 'transparent',
              transition: 'background 100ms',
            }}>{it}</span>
        );
      })}
    </div>
  );
}

export function Progress({ value, color = 'var(--text-2)', height = 4 }) {
  return (
    <div style={{ height, width: '100%', background: 'var(--bg-elev-3)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}
