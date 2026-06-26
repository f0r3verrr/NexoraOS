/* Foundation cards: color tokens, type ramp, project palette, radii, iconography */

const foundationStyles = {
  card: {
    background: "var(--bg-elev-1)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    height: "100%",
    color: "var(--text)",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-3)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  caption: { fontSize: 12, color: "var(--text-3)" },
  mono: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" },
};

/* ---------- Color swatch grid ---------- */
function SwatchRow({ label, items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`, gap: 8 }}>
        {items.map((it) => (
          <div key={it.token} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                background: `var(${it.token})`,
                height: 56,
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{it.name}</span>
              <span style={foundationStyles.mono}>{it.token.replace("--", "")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorTokensCard() {
  return (
    <div style={foundationStyles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={foundationStyles.title}>Палитра — поверхности и текст</div>
        <div style={foundationStyles.caption}>
          Тёплая нейтральная основа (OKLCH, hue 80°). Намеренно тихий, не корпоративный.
        </div>
      </div>

      <SwatchRow
        label="Поверхности"
        items={[
          { name: "Фон страницы", token: "--bg" },
          { name: "Карточка", token: "--bg-elev-1" },
          { name: "Поле / input", token: "--bg-elev-2" },
          { name: "Hover", token: "--bg-hover" },
          { name: "Active", token: "--bg-active" },
          { name: "Контраст", token: "--bg-elev-3" },
        ]}
      />

      <SwatchRow
        label="Границы"
        items={[
          { name: "Subtle", token: "--border-subtle" },
          { name: "Default", token: "--border" },
          { name: "Strong", token: "--border-strong" },
        ]}
      />

      <SwatchRow
        label="Текст"
        items={[
          { name: "Primary", token: "--text" },
          { name: "Secondary", token: "--text-2" },
          { name: "Tertiary", token: "--text-3" },
          { name: "Muted", token: "--text-muted" },
        ]}
      />

      <SwatchRow
        label="Семантика"
        items={[
          { name: "Success", token: "--success" },
          { name: "Warning", token: "--warn" },
          { name: "Danger", token: "--danger" },
          { name: "Info", token: "--info" },
        ]}
      />
    </div>
  );
}

/* ---------- Project palette ---------- */
const PROJECT_COLORS = [
  { token: "--p-youmin",    name: "Youmin",    kind: "QA",     area: "Работа" },
  { token: "--p-openresto", name: "OpenResto", kind: "Dev",    area: "Работа" },
  { token: "--p-diploma",   name: "Дипломы",   kind: "Учёба",  area: "Подработки" },
  { token: "--p-sites",     name: "Сайты",     kind: "Web",    area: "Подработки" },
  { token: "--p-bots",      name: "Боты",      kind: "TG",     area: "Подработки" },
  { token: "--p-girl",      name: "Аня",       kind: "Личное", area: "Жизнь" },
  { token: "--p-family",    name: "Семья",     kind: "Личное", area: "Жизнь" },
  { token: "--p-car",       name: "Машина",    kind: "Авто",   area: "Жизнь" },
  { token: "--p-home",      name: "Дом",       kind: "Быт",    area: "Жизнь" },
  { token: "--p-health",    name: "Здоровье",  kind: "Тело",   area: "Жизнь" },
];

function ProjectPaletteCard() {
  return (
    <div style={foundationStyles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={foundationStyles.title}>Палитра — проекты</div>
        <div style={foundationStyles.caption}>
          Одинаковая светлота и chroma — все 10 цветов «дружат». Используются только как идентификаторы.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {PROJECT_COLORS.map((p) => (
          <div
            key={p.token}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elev-2)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 12, height: 12, borderRadius: 4,
                background: `var(${p.token})`,
                boxShadow: `0 0 0 3px color-mix(in oklab, var(${p.token}) 18%, transparent)`,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 13, color: "var(--text)" }}>{p.name}</span>
              <span style={{ ...foundationStyles.mono, fontSize: 11 }}>{p.area} · {p.kind}</span>
            </div>
            <span style={{ ...foundationStyles.mono, fontSize: 11 }}>
              {p.token.replace("--p-", "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Typography ---------- */
function TypeRow({ label, sample, style, spec }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 140px",
        alignItems: "baseline",
        gap: 16,
        padding: "12px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span style={{ ...foundationStyles.mono, fontSize: 11 }}>{label}</span>
      <span style={style}>{sample}</span>
      <span style={{ ...foundationStyles.mono, fontSize: 11, textAlign: "right" }}>{spec}</span>
    </div>
  );
}

function TypographyCard() {
  return (
    <div style={foundationStyles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={foundationStyles.title}>Типографика</div>
        <div style={foundationStyles.caption}>
          Geist Sans для интерфейса, Geist Mono для чисел и timestamps. Веса 400 / 500, без жирных.
        </div>
      </div>

      <div>
        <TypeRow label="display"   sample="всё под контролем"            style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }} spec="32/40 · 500" />
        <TypeRow label="title"     sample="что мне сейчас важно"          style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }} spec="22/30 · 500" />
        <TypeRow label="heading"   sample="задачи на сегодня"             style={{ fontSize: 17, fontWeight: 500 }} spec="17/24 · 500" />
        <TypeRow label="body"      sample="позвонить Ане завтра в 15:00"   style={{ fontSize: 14, fontWeight: 400, color: "var(--text)" }} spec="14/22 · 400" />
        <TypeRow label="caption"   sample="дедлайн через 3 дня"            style={{ fontSize: 12, fontWeight: 400, color: "var(--text-3)" }} spec="12/18 · 400" />
        <TypeRow label="overline"  sample="ИНБОКС"                         style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "var(--text-3)" }} spec="11 · 500" />
        <TypeRow label="mono.num"  sample="14 240 ₽ · 02:30"               style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }} spec="14 · mono" />
      </div>
    </div>
  );
}

/* ---------- Radii + spacing + shadow ---------- */
function RadiiSpacingCard() {
  return (
    <div style={foundationStyles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={foundationStyles.title}>Скругления, отступы, тени</div>
        <div style={foundationStyles.caption}>Мягкие радиусы 6–16px. Шкала отступов кратна 4.</div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { r: 6,  label: "r-2 · 6" },
          { r: 8,  label: "r-3 · 8" },
          { r: 10, label: "r-4 · 10" },
          { r: 12, label: "r-5 · 12" },
          { r: 16, label: "r-6 · 16" },
          { r: 999,label: "full" },
        ].map((it) => (
          <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div style={{
              width: 64, height: 64,
              background: "var(--bg-elev-2)",
              border: "1px solid var(--border)",
              borderRadius: it.r,
            }} />
            <span style={{ ...foundationStyles.mono, fontSize: 11 }}>{it.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ ...foundationStyles.mono, fontSize: 11, marginBottom: 10 }}>Шкала отступов</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          {[4,8,12,16,20,24,32,40].map((px) => (
            <div key={px} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <div style={{
                width: px, height: 40,
                background: "color-mix(in oklab, var(--p-openresto) 35%, transparent)",
                borderRadius: 4,
              }} />
              <span style={{ ...foundationStyles.mono, fontSize: 11 }}>{px}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...foundationStyles.mono, fontSize: 11, marginBottom: 10 }}>Тени</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { label: "shadow-1", v: "var(--shadow-1)" },
            { label: "shadow-2", v: "var(--shadow-2)" },
            { label: "modal",    v: "var(--shadow-modal)" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <div style={{
                width: 100, height: 64,
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                boxShadow: s.v,
              }} />
              <span style={{ ...foundationStyles.mono, fontSize: 11 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Iconography ---------- */
function IconographyCard() {
  const icons = [
    "home","inbox","sun_today","calendar","layers","note","file","wallet","users","target",
    "archive","settings","lock","search","plus","check","x","flag","clock","bell",
    "mic","paperclip","star","pin","snooze","repeat","trending_up","zap","heart","smile",
    "battery","command","car","music","briefcase","phone","edit","trash","folder","moon",
  ];
  return (
    <div style={foundationStyles.card}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={foundationStyles.title}>Иконографика</div>
        <div style={foundationStyles.caption}>Lucide, stroke 1.5, размер 16/18/20 в UI.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
        {icons.map((n) => (
          <div
            key={n}
            title={n}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 48,
              borderRadius: 8,
              background: "var(--bg-elev-2)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-2)",
            }}
          >
            <Icon name={n} size={18} />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ColorTokensCard, ProjectPaletteCard, TypographyCard, RadiiSpacingCard, IconographyCard,
  PROJECT_COLORS,
});
