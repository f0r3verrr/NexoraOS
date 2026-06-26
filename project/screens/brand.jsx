/* Brand · 4 концепции логотипа NexoraOS */

/* ===== Concept 1 — «N — якорь»: N с цветной точкой-якорем ===== */
function MarkAnchor({ size = 80, color = "var(--text)", dotColor = "var(--p-openresto)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Left stem */}
      <rect x="14" y="14" width="9" height="52" rx="2" fill={color} />
      {/* Right stem — truncated, dot replaces bottom */}
      <rect x="49" y="14" width="9" height="36" rx="2" fill={color} />
      {/* Diagonal band */}
      <polygon points="23,14 32,14 58,50 49,50" fill={color} />
      {/* Anchor dot */}
      <circle cx="53.5" cy="62" r="8" fill={dotColor} />
    </svg>
  );
}

/* ===== Concept 2 — «Слои»: N как стопка ступенчатых блоков между двумя стойками ===== */
function MarkLayers({ size = 80, color = "var(--text)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="14" y="14" width="9" height="52" rx="2" fill={color} />
      <rect x="57" y="14" width="9" height="52" rx="2" fill={color} />
      <rect x="23" y="18" width="20" height="8" rx="2" fill={color} opacity="0.95" />
      <rect x="30" y="36" width="20" height="8" rx="2" fill={color} opacity="0.78" />
      <rect x="37" y="54" width="20" height="8" rx="2" fill={color} opacity="0.95" />
    </svg>
  );
}

/* ===== Concept 3 — «Брекет»: ⟨ N ⟩ command-line style ===== */
function MarkBracket({ size = 80, color = "var(--text)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {/* Brackets */}
      <polyline points="20,18 8,40 20,62" fill="none" />
      <polyline points="60,18 72,40 60,62" fill="none" />
      {/* N */}
      <line x1="30" y1="22" x2="30" y2="58" />
      <line x1="50" y1="22" x2="50" y2="58" />
      <line x1="30" y1="22" x2="50" y2="58" />
    </svg>
  );
}

/* ===== Concept 4 — «Орбита»: dot at center, colored orbiting dots ===== */
function MarkOrbit({ size = 80 }) {
  const dots = [
    { r: 28, angle: 0,   color: "--p-openresto" },
    { r: 28, angle: 60,  color: "--p-youmin" },
    { r: 28, angle: 120, color: "--p-diploma" },
    { r: 28, angle: 180, color: "--p-girl" },
    { r: 28, angle: 240, color: "--p-home" },
    { r: 28, angle: 300, color: "--p-health" },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="28" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2 3" />
      {dots.map((d, i) => {
        const x = 40 + Math.cos(d.angle * Math.PI / 180) * d.r;
        const y = 40 + Math.sin(d.angle * Math.PI / 180) * d.r;
        return <circle key={i} cx={x} cy={y} r="4.5" fill={`var(${d.color})`} />;
      })}
      <circle cx="40" cy="40" r="9" fill="var(--text)" />
    </svg>
  );
}

/* ===== Concept 5 — «Монограмма NX»: две буквы, общая ось ===== */
function MarkMonogram({ size = 80, color = "var(--text)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* N portion */}
      <rect x="6"  y="16" width="7" height="48" rx="2" fill={color} />
      <rect x="29" y="16" width="7" height="48" rx="2" fill={color} />
      <polygon points="13,16 20,16 36,64 29,64" fill={color} />
      {/* X portion */}
      <line x1="46" y1="20" x2="72" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="72" y1="20" x2="46" y2="60" stroke={color} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/* ===== Concept 6 — «Граф»: N как 4 узла + рёбра ===== */
function MarkGraph({ size = 80, color = "var(--text)", nodeColor = "var(--p-openresto)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Edges of the N */}
      <line x1="20" y1="18" x2="20" y2="62" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="18" x2="60" y2="62" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="18" x2="60" y2="62" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Nodes — top-left highlighted as "you" */}
      <circle cx="20" cy="18" r="6.5" fill={nodeColor} />
      <circle cx="20" cy="62" r="6.5" fill={color} />
      <circle cx="60" cy="18" r="6.5" fill={color} />
      <circle cx="60" cy="62" r="6.5" fill={color} />
    </svg>
  );
}

/* ===== Concept 7 — «Окно (OS)»: N внутри окна с заголовочной полосой ===== */
function MarkWindow({ size = 80, color = "var(--text)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="8" y="12" width="64" height="56" rx="8" stroke={color} strokeWidth="3.5" fill="none" />
      {/* Title bar circles */}
      <circle cx="16" cy="22" r="2" fill={color} />
      <circle cx="23" cy="22" r="2" fill={color} />
      <circle cx="30" cy="22" r="2" fill={color} />
      {/* Title bar divider */}
      <line x1="8" y1="30" x2="72" y2="30" stroke={color} strokeWidth="1.5" opacity="0.45" />
      {/* N inside */}
      <rect x="22" y="36" width="6" height="26" rx="1.5" fill={color} />
      <rect x="52" y="36" width="6" height="26" rx="1.5" fill={color} />
      <polygon points="28,36 34,36 58,62 52,62" fill={color} />
    </svg>
  );
}

/* ===== Concept 8 — «Пиксель»: N из 5×5 сетки квадратов ===== */
function MarkPixel({ size = 80, color = "var(--text)" }) {
  const grid = [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ];
  const cell = 11;
  const off = (80 - cell * 5) / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {grid.flatMap((row, ri) =>
        row.map((v, ci) =>
          v ? (
            <rect
              key={`${ri}-${ci}`}
              x={off + ci * cell}
              y={off + ri * cell}
              width={cell - 2}
              height={cell - 2}
              rx="1.6"
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

/* ===== Concept 9 — «Сфера / клетка»: N внутри гексагона ===== */
function MarkHex({ size = 80, color = "var(--text)", accent = "var(--p-girl)" }) {
  // Hexagon points (flat-top)
  const cx = 40, cy = 40, r = 30;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <polygon
        points={pts.map((p) => p.join(",")).join(" ")}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      {/* N */}
      <rect x="24" y="26" width="6" height="28" rx="1.5" fill={color} />
      <rect x="50" y="26" width="6" height="28" rx="1.5" fill={color} />
      <polygon points="30,26 36,26 56,54 50,54" fill={color} />
      {/* tiny accent dot */}
      <circle cx="62" cy="58" r="3" fill={accent} />
    </svg>
  );
}

/* ===== Concept 10 — «Поток»: N одной непрерывной лентой ===== */
function MarkFlow({ size = 80, color = "var(--text)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path
        d="M 16 14 L 16 66 M 16 14 L 64 66 M 64 14 L 64 66"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="14" r="4.5" fill="var(--bg)" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

/* ===== Concept card layout ===== */
function ConceptCard({ name, tag, description, Mark, gradientColor = "--p-openresto" }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "var(--font-sans)", color: "var(--text)",
      boxSizing: "border-box",
    }}>
      {/* hero */}
      <div style={{
        flex: 1,
        background: `linear-gradient(135deg, color-mix(in oklab, var(${gradientColor}) 14%, var(--bg)) 0%, var(--bg) 65%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        minHeight: 220,
      }}>
        <div style={{
          padding: "24px 26px",
          background: "var(--bg)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 18,
          display: "flex", alignItems: "center", gap: 18,
        }}>
          <Mark size={88} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text)", lineHeight: 1 }}>
              nexoraos
            </span>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{tag}</span>
          </div>
        </div>
      </div>

      {/* meta */}
      <div style={{ padding: "18px 22px 14px 22px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{name}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{tag}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)", lineHeight: 1.55 }}>{description}</p>
      </div>

      {/* variations strip */}
      <div style={{
        padding: "16px 22px 22px",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
        borderTop: "1px solid var(--border-subtle)",
      }}>
        {/* Mark on dark */}
        <div style={{
          aspectRatio: "1",
          background: "var(--bg-elev-3)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mark size={42} />
        </div>
        {/* Mark on light */}
        <div style={{
          aspectRatio: "1",
          background: "oklch(0.96 0.005 80)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mark size={42} color="oklch(0.18 0.005 80)" />
        </div>
        {/* App tile */}
        <div style={{
          aspectRatio: "1",
          background: `var(${gradientColor})`,
          borderRadius: 11,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mark size={42} color="var(--bg)" />
        </div>
        {/* Favicon size */}
        <div style={{
          aspectRatio: "1",
          background: "var(--bg-elev-2)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mark size={22} />
        </div>
      </div>
    </div>
  );
}

function BrandCanvas() {
  return (
    <div style={{
      width: "100%", height: "100%",
      padding: 28, background: "var(--bg)",
      display: "flex", flexDirection: "column", gap: 24,
      fontFamily: "var(--font-sans)", color: "var(--text)",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>brand · набор 1 / 2 · 4 направления</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
          Логотип NexoraOS · базовый набор
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)", maxWidth: 720, lineHeight: 1.5 }}>
          Знак — буква N (или абстрактная форма из палитры). Работает в трёх размерах: 88px (брендинг),
          32px (sidebar в продукте), 22px (favicon). Цветной акцент берётся из палитры проектов.
          Wordmark всегда в нижнем регистре, моноширинно-сдержанный.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, flex: 1 }}>
        <ConceptCard
          name="01 · Якорь"
          tag="N + dot"
          description="Капитальная N с точкой-якорем вместо нижней правой ножки. Точка окрашена в цвет активного проекта — мета-индикатор «где ты сейчас»."
          Mark={MarkAnchor}
          gradientColor="--p-openresto"
        />
        <ConceptCard
          name="02 · Слои"
          tag="layers"
          description="N из трёх ступенчатых слоёв между двумя стойками. Метафора — слои жизни, сложенные в одну стопку. Хорошо читается даже на 16px."
          Mark={MarkLayers}
          gradientColor="--p-diploma"
        />
        <ConceptCard
          name="03 · Брекет"
          tag="⟨ N ⟩"
          description="N в угловых скобках. Командно-строчная эстетика — подмигивание QA/dev-бэкграунду. Тонкие штрихи в Geist Mono."
          Mark={MarkBracket}
          gradientColor="--p-youmin"
        />
        <ConceptCard
          name="04 · Орбита"
          tag="constellation"
          description="Без буквы — кольцо из шести цветных точек вокруг центра. Прямая визуальная цитата из палитры проектов. Самый «личный» вариант, без отсылки к имени."
          Mark={MarkOrbit}
          gradientColor="--p-girl"
        />
      </div>
    </div>
  );
}

/* ====== Second canvas — 6 more concepts ====== */
function BrandCanvasMore() {
  return (
    <div style={{
      width: "100%", height: "100%",
      padding: 28, background: "var(--bg)",
      display: "flex", flexDirection: "column", gap: 24,
      fontFamily: "var(--font-sans)", color: "var(--text)",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>brand · набор 2 / 2 · 6 направлений</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
          Логотип NexoraOS · расширенный набор
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)", maxWidth: 720, lineHeight: 1.5 }}>
          Ещё шесть направлений — от типографических монограмм до пиксельных и геометрических знаков.
          Можно микшировать с базовым набором или взять один как продолжение бренда.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, flex: 1 }}>
        <ConceptCard
          name="05 · Монограмма NX"
          tag="N + X"
          description="Двухбуквенная монограмма NX — сокращение от Nexora. Острые засечки, читается как самостоятельный знак-эмблема. Хорошо работает как фавикон и watermark."
          Mark={MarkMonogram}
          gradientColor="--p-openresto"
        />
        <ConceptCard
          name="06 · Граф"
          tag="nodes + edges"
          description="N из четырёх узлов с рёбрами. Метафора связанности — задачи, заметки и контакты в одной сети. Один узел выделен цветом — «ты»."
          Mark={MarkGraph}
          gradientColor="--p-sites"
        />
        <ConceptCard
          name="07 · Окно (OS)"
          tag="N in window"
          description="N внутри стилизованного окна с тремя точками заголовка. Прямая отсылка к суффиксу «OS» — система, в которой ты живёшь."
          Mark={MarkWindow}
          gradientColor="--p-bots"
        />
        <ConceptCard
          name="08 · Пиксель"
          tag="5×5 grid"
          description="N набрана пиксельной сеткой 5×5 — ретро-tech-стиль. Брат-близнец иконки приложения на homescreen. Заявка на «product mark»."
          Mark={MarkPixel}
          gradientColor="--p-health"
        />
        <ConceptCard
          name="09 · Сота"
          tag="hexagon"
          description="N внутри шестиугольника с маленькой цветной точкой-акцентом. Геометричный, нейтральный — без эмоциональной нагрузки. Хорош для B2B-выхода."
          Mark={MarkHex}
          gradientColor="--p-home"
        />
        <ConceptCard
          name="10 · Поток"
          tag="ribbon"
          description="N толстым непрерывным штрихом с круглой «головой» на старте. Метафора жизни как одной линии. Самый дружелюбный из всех."
          Mark={MarkFlow}
          gradientColor="--p-family"
        />
      </div>
    </div>
  );
}

window.BrandCanvas = BrandCanvas;
window.BrandCanvasMore = BrandCanvasMore;
window.MarkAnchor = MarkAnchor;
window.MarkLayers = MarkLayers;
window.MarkBracket = MarkBracket;
window.MarkOrbit = MarkOrbit;
window.MarkMonogram = MarkMonogram;
window.MarkGraph = MarkGraph;
window.MarkWindow = MarkWindow;
window.MarkPixel = MarkPixel;
window.MarkHex = MarkHex;
window.MarkFlow = MarkFlow;
