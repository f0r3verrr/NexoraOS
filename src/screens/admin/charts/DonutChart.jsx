/* Донат-чарт через stroke-dasharray (pathLength=100 — доли считаются в процентах) + легенда */
export function DonutChart({ segments, centerValue, centerLabel, size = 160 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  const arcs = segments.map(s => {
    const pct = (s.value / total) * 100;
    const arc = { ...s, dash: `${pct} ${100 - pct}`, offset: -offset };
    offset += pct;
    return arc;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="0 0 36 36" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--bg-elev-3)" strokeWidth="4" />
          {arcs.map((seg, i) => (
            <circle key={i} cx="18" cy="18" r="15.5" fill="none" stroke={seg.color} strokeWidth="4"
              strokeLinecap="round" pathLength="100" strokeDasharray={seg.dash} strokeDashoffset={seg.offset} />
          ))}
        </svg>
        {(centerValue || centerLabel) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {centerValue && <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{centerValue}</span>}
            {centerLabel && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{centerLabel}</span>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-2)' }}>{s.label}</span>
            {s.display && <span style={{ color: 'var(--text-muted)' }}>{s.display}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
