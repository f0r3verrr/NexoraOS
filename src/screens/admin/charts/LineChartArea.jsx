const uid = () => Math.random().toString(36).slice(2, 9);

function buildPath(values, w, h, padTop, padBottom) {
  if (!values.length) return '';
  const max = Math.max(...values), min = Math.min(...values, 0);
  const range = (max - min) || 1;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  return values.map((v, i) => {
    const x = i * stepX;
    const y = padTop + (h - padTop - padBottom) * (1 - (v - min) / range);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function buildArea(values, w, h, padTop, padBottom) {
  const line = buildPath(values, w, h, padTop, padBottom);
  if (!line) return '';
  return `${line} L${w},${h} L0,${h} Z`;
}

/* Градиентная área-линия — используется на дашборде и в аналитике */
export function LineChartArea({ values, color = 'var(--accent-teal)', height = 120, width = 320 }) {
  const id = `lc-${uid()}`;
  if (!values?.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        Пока нет данных
      </div>
    );
  }
  const line = buildPath(values, width, height, 8, 8);
  const area = buildArea(values, width, height, 8, 8);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
