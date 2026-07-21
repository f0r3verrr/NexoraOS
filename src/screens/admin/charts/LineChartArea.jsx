import { useRef, useState } from 'react';

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

function pointsFor(values, w, h, padTop, padBottom) {
  const max = Math.max(...values), min = Math.min(...values, 0);
  const range = (max - min) || 1;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: i * stepX,
    y: padTop + (h - padTop - padBottom) * (1 - (v - min) / range),
    v,
  }));
}

/* Градиентная área-линия с hover-тултипом (значение + подпись под курсором) */
export function LineChartArea({ values, labels, color = 'var(--accent-teal)', height = 100, width = 320 }) {
  const [id] = useState(() => `lc-${uid()}`);
  const [hover, setHover] = useState(null); // { index, x, y }
  const svgRef = useRef(null);

  if (!values?.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        Пока нет данных
      </div>
    );
  }

  const padTop = 8, padBottom = 8;
  const line = buildPath(values, width, height, padTop, padBottom);
  const area = buildArea(values, width, height, padTop, padBottom);
  const points = pointsFor(values, width, height, padTop, padBottom);

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let closest = 0, bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < bestDist) { bestDist = d; closest = i; }
    });
    setHover({ index: closest, ...points[closest] });
  };

  const active = hover ? points[hover.index] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none"
        style={{ overflow: 'visible', cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" />
        {active && (
          <>
            <line x1={active.x} y1={padTop} x2={active.x} y2={height - padBottom} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={active.x} cy={active.y} r="3.5" fill={color} stroke="var(--bg-elev-1)" strokeWidth="2" />
          </>
        )}
      </svg>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: `${Math.min(Math.max((active.x / width) * 100, 12), 88)}%`,
          transform: 'translate(-50%, -100%)', marginTop: -6,
          background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '6px 10px', fontSize: 11.5, whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: 'var(--shadow-2)', zIndex: 5,
        }}>
          {labels?.[hover.index] && <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{labels[hover.index]}</div>}
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{active.v}</div>
        </div>
      )}
    </div>
  );
}
