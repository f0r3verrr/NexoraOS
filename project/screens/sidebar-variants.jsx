/* 4 альтернативных направления навигации */

/* shared faux content edge — намёк, что справа основная область */
function ContentEdge({ width = 60 }) {
  return (
    <div style={{
      flex: 1,
      minWidth: width,
      background: "var(--bg)",
      borderLeft: "1px solid var(--border-subtle)",
      backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--text) 2%, transparent), transparent 80%)",
    }} />
  );
}

/* ====== Variant 1: Rail + контекстная панель (Linear / Mail.app) ====== */

const V1_RAIL = [
  { i: "home",      l: "Главная",   active: true },
  { i: "inbox",     l: "Inbox",     badge: 12 },
  { i: "sun_today", l: "Сегодня",   badge: 8 },
  { i: "calendar",  l: "Календарь" },
  { i: "layers",    l: "Проекты" },
  { i: "note",      l: "Заметки" },
  { i: "wallet",    l: "Финансы" },
  { i: "target",    l: "Цели" },
];

function V1RailItem({ item }) {
  return (
    <button title={item.l} style={{
      width: 40, height: 40,
      borderRadius: 10,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: item.active ? "var(--text)" : "var(--text-3)",
      background: item.active ? "var(--bg-elev-3)" : "transparent",
      position: "relative",
    }}>
      <Icon name={item.i} size={18} />
      {item.badge && (
        <span style={{
          position: "absolute", top: 4, right: 4,
          minWidth: 16, height: 16, padding: "0 4px",
          borderRadius: 999,
          background: "var(--danger)",
          color: "white",
          fontSize: 10, fontWeight: 500, fontFamily: "var(--font-mono)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "2px solid var(--bg-elev-1)",
        }}>{item.badge}</span>
      )}
    </button>
  );
}

function SidebarV1() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      {/* icon rail */}
      <div style={{
        width: 60, flex: "none",
        background: "var(--bg-elev-1)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "12px 0",
        gap: 6,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 60%, var(--bg)), color-mix(in oklab, var(--p-youmin) 60%, var(--bg)))",
          color: "var(--text)", fontSize: 13, fontWeight: 500,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 6,
        }} title="NexoraOS">N</div>
        <div style={{ height: 1, width: 24, background: "var(--border-subtle)", margin: "2px 0 6px" }} />
        {V1_RAIL.map((it) => <V1RailItem key={it.l} item={it} />)}
        <div style={{ flex: 1 }} />
        <V1RailItem item={{ i: "lock", l: "Vault" }} />
        <V1RailItem item={{ i: "settings", l: "Настройки" }} />
      </div>

      {/* contextual panel */}
      <div style={{
        width: 260, flex: "none",
        background: "var(--bg)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Главная</span>
          <IconButton icon="search" />
        </div>

        <div style={{ padding: "0 12px 8px" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", height: 32, padding: "0 10px",
            borderRadius: 8, background: "var(--text)", color: "var(--bg)",
            fontSize: 13, fontWeight: 500,
          }}>
            <Icon name="plus" size={15} />
            <span style={{ flex: 1, textAlign: "left" }}>Быстро добавить</span>
            <span style={{ fontSize: 11, opacity: 0.6, fontFamily: "var(--font-mono)" }}>⌘N</span>
          </button>
        </div>

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 12px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 8px 6px" }}>
            Закреплено
          </div>
          {[
            { d: "--p-openresto", l: "OpenResto · MVP", s: "Sprint 7" },
            { d: "--p-diploma",   l: "Диплом Анны",       s: "до 28 мая" },
            { d: "--p-girl",       l: "Аня",                s: "годовщина 12.07" },
          ].map((p) => (
            <button key={p.l} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "8px 8px", borderRadius: 6, marginBottom: 2,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(${p.d})`, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{p.l}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{p.s}</span>
              </span>
              <Icon name="pin" size={11} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}

          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "16px 8px 6px" }}>
            Недавнее
          </div>
          {[
            { i: "note", l: "Архитектура нового меню", s: "час назад" },
            { i: "check",l: "Прозвонить лидов",        s: "2 ч" },
            { i: "file", l: "Договор-Анна-2026.pdf",   s: "5 мин" },
            { i: "note", l: "Daily journal · 20 мая",  s: "вчера" },
          ].map((r) => (
            <button key={r.l} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "8px 8px", borderRadius: 6,
            }}>
              <Icon name={r.i} size={14} style={{ color: "var(--text-3)" }} />
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>{r.l}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{r.s}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials="К" color="var(--p-openresto)" size={24} />
          <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>Кирилл</span>
          <IconButton icon="moon" size="sm" />
        </div>
      </div>

      <ContentEdge />
    </div>
  );
}

/* ====== Variant 2: Карточки областей жизни ====== */

const V2_AREAS = [
  {
    title: "Работа",
    colors: ["--p-openresto", "--p-youmin"],
    projects: [
      { token: "--p-openresto", l: "OpenResto · MVP", count: 14, urgent: 2 },
      { token: "--p-youmin",    l: "Youmin · QA",     count: 7,  urgent: 1 },
    ],
    summary: "21 задача · 3 срочных",
  },
  {
    title: "Подработки",
    colors: ["--p-diploma", "--p-sites", "--p-bots"],
    income: "124 800 ₽",
    projects: [
      { token: "--p-diploma", l: "Диплом Анны",   count: 4, urgent: 1 },
      { token: "--p-sites",   l: "Лендинг студии", count: 6, urgent: 0 },
      { token: "--p-bots",    l: "TG-бот #3",      count: 1, urgent: 0 },
    ],
    summary: "11 задач · доход 124 800",
  },
  {
    title: "Жизнь",
    colors: ["--p-girl", "--p-family", "--p-car", "--p-home", "--p-health"],
    projects: [
      { token: "--p-girl",   l: "Аня",      count: 3, urgent: 0 },
      { token: "--p-car",    l: "Машина",   count: 1, urgent: 1, urgentLabel: "ОСАГО через 6 дней" },
      { token: "--p-home",   l: "Дом",      count: 5, urgent: 0 },
    ],
    summary: "12 пунктов · 1 дедлайн",
  },
];

function AreaCard({ a, expanded }) {
  return (
    <div style={{
      borderRadius: 10,
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 14px 10px",
        position: "relative",
      }}>
        {/* gradient color strip showing the area's palette */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(${a.colors.map((c, i) => `var(${c}) ${(i/(a.colors.length))*100}%, var(${c}) ${((i+1)/(a.colors.length))*100}%`).join(", ")})`,
        }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{a.title}</span>
          <Icon name={expanded ? "chevron_down" : "chevron_right"} size={14} style={{ color: "var(--text-muted)" }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{a.summary}</span>
      </div>
      {expanded && (
        <div style={{ padding: "2px 6px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
          {a.projects.map((p) => (
            <button key={p.l} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "7px 10px", borderRadius: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(${p.token})`, flex: "none" }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text)", textAlign: "left" }}>{p.l}</span>
              {p.urgent > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: "var(--danger)",
                }} title={p.urgentLabel || "срочное"} />
              )}
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{p.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarV2() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <aside style={{
        width: 288, flex: "none",
        background: "var(--bg)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column",
        padding: "14px 12px",
        gap: 6,
      }}>
        {/* workspace */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px" }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 60%, var(--bg)), color-mix(in oklab, var(--p-youmin) 60%, var(--bg)))",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "var(--text)", fontSize: 13, fontWeight: 500,
          }}>N</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>NexoraOS</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>среда · 21 мая</span>
          </div>
          <IconButton icon="more" size="sm" />
        </div>

        {/* command bar */}
        <button style={{
          display: "flex", alignItems: "center", gap: 10,
          height: 36, padding: "0 12px",
          background: "var(--bg-elev-2)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 10,
          color: "var(--text-3)",
          fontSize: 13,
          marginTop: 4,
        }}>
          <Icon name="search" size={15} />
          <span style={{ flex: 1, textAlign: "left" }}>Найти или создать</span>
          <Kbd>⌘K</Kbd>
        </button>

        {/* fast nav row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginTop: 4 }}>
          {[
            { i: "home",      l: "Глав." },
            { i: "inbox",     l: "12",    sub: "Inbox", active: true },
            { i: "sun_today", l: "8",     sub: "Сег." },
            { i: "calendar",  l: "5",     sub: "Кал." },
          ].map((q, i) => (
            <button key={i} style={{
              padding: "10px 6px",
              borderRadius: 8,
              background: q.active ? "var(--bg-elev-2)" : "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: "var(--text-2)",
            }}>
              <Icon name={q.i} size={15} style={{ color: q.active ? "var(--text)" : "var(--text-3)" }} />
              <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{q.sub || q.l}</span>
            </button>
          ))}
        </div>

        {/* areas */}
        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {V2_AREAS.map((a, i) => (
            <AreaCard key={a.title} a={a} expanded={i < 2} />
          ))}

          {/* meta */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
            marginTop: 4,
          }}>
            {[
              { i: "note", l: "Заметки" },
              { i: "file", l: "Файлы" },
              { i: "users", l: "CRM" },
              { i: "archive", l: "Архив" },
            ].map((m) => (
              <button key={m.l} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                color: "var(--text-2)", fontSize: 12,
              }}>
                <Icon name={m.i} size={14} style={{ color: "var(--text-3)" }} />
                <span>{m.l}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar initials="К" color="var(--p-openresto)" size={24} />
          <span style={{ fontSize: 12, color: "var(--text-3)", flex: 1 }}>Inbox Zero · 12</span>
          <IconButton icon="settings" size="sm" />
        </div>
      </aside>
      <ContentEdge />
    </div>
  );
}

/* ====== Variant 3: Чистая иконочная рейка ====== */

const V3_RAIL = [
  { i: "home", l: "Главная", active: true },
  { i: "inbox", l: "Inbox", badge: "12" },
  { i: "sun_today", l: "Сегодня", badge: "8" },
  { i: "calendar", l: "Календарь" },
  { i: "layers", l: "Проекты" },
  { i: "note", l: "Заметки" },
  { i: "wallet", l: "Финансы" },
  { i: "users", l: "CRM" },
  { i: "target", l: "Цели" },
];

function SidebarV3() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <div style={{
        width: 64, flex: "none",
        background: "var(--bg-elev-1)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0",
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 60%, var(--bg)), color-mix(in oklab, var(--p-youmin) 60%, var(--bg)))",
          color: "var(--text)", fontSize: 13, fontWeight: 500,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>N</span>

        <button title="Найти ⌘K" style={{
          width: 40, height: 40, borderRadius: 999,
          background: "var(--bg-elev-2)",
          border: "1px solid var(--border)",
          color: "var(--text-2)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 6,
        }}>
          <Icon name="search" size={16} />
        </button>

        <button title="Добавить ⌘N" style={{
          width: 40, height: 40, borderRadius: 999,
          background: "var(--text)",
          color: "var(--bg)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}>
          <Icon name="plus" size={16} stroke={2} />
        </button>

        <div style={{ height: 1, width: 28, background: "var(--border-subtle)", margin: "0 0 12px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          {V3_RAIL.map((it) => (
            <button key={it.l} title={it.l} style={{
              width: 40, height: 40, borderRadius: 10,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: it.active ? "var(--text)" : "var(--text-3)",
              background: it.active ? "var(--bg-elev-3)" : "transparent",
              position: "relative",
            }}>
              <Icon name={it.i} size={18} />
              {it.badge && (
                <span style={{
                  position: "absolute", top: 6, right: 4,
                  fontSize: 9, fontFamily: "var(--font-mono)",
                  color: "var(--text-3)",
                }}>{it.badge}</span>
              )}
              {it.active && (
                <span style={{
                  position: "absolute", left: -6, top: 10, bottom: 10,
                  width: 2, borderRadius: 999, background: "var(--text)",
                }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* pinned projects as dots */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0", borderTop: "1px solid var(--border-subtle)", marginTop: 10 }}>
          {[
            { c: "--p-openresto", l: "ОР" },
            { c: "--p-diploma",   l: "Ан" },
            { c: "--p-girl",       l: "Аня" },
          ].map((p, i) => (
            <button key={i} title={p.l} style={{
              width: 32, height: 32, borderRadius: 8,
              background: `color-mix(in oklab, var(${p.c}) 20%, transparent)`,
              color: `var(${p.c})`,
              fontSize: 10, fontWeight: 500,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: `1px solid color-mix(in oklab, var(${p.c}) 30%, transparent)`,
            }}>{p.l}</button>
          ))}
        </div>

        <button title="Кирилл" style={{
          marginTop: 10,
        }}>
          <Avatar initials="К" color="var(--p-openresto)" size={32} />
        </button>
      </div>

      <ContentEdge width={200} />
    </div>
  );
}

/* ====== Variant 4: «Брифинг» — sidebar как живая сводка ====== */

function SidebarV4() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <aside style={{
        width: 280, flex: "none",
        background: "var(--bg)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column",
        padding: "18px 14px 12px",
      }}>
        {/* clock + date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 4px 16px" }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>среда · 21 мая</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.03em", fontFamily: "var(--font-mono)", lineHeight: 1 }}>11:54</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>+12°, дождь к вечеру</span>
          </div>
        </div>

        {/* what's now */}
        <div style={{
          padding: "12px 14px",
          background: `color-mix(in oklab, var(--p-diploma) 12%, var(--bg-elev-1))`,
          border: `1px solid color-mix(in oklab, var(--p-diploma) 30%, var(--border-subtle))`,
          borderRadius: 10,
          display: "flex", flexDirection: "column", gap: 6,
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--p-diploma)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>сейчас · через 6 мин</span>
            <Icon name="phone" size={12} style={{ color: "var(--p-diploma)" }} />
          </div>
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Анна Соколова — звонок</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Дипломы · правки по введению</span>
        </div>

        {/* frog */}
        <div style={{
          padding: "12px 14px",
          background: "var(--bg-elev-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 10,
          display: "flex", gap: 10, alignItems: "flex-start",
          marginBottom: 16,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: "color-mix(in oklab, var(--p-openresto) 18%, transparent)",
            color: "var(--p-openresto)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flex: "none",
          }}><Icon name="zap" size={14} /></span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>лягушка дня</span>
            <span style={{ fontSize: 13, color: "var(--text)" }}>Доделать миграцию меню</span>
          </div>
        </div>

        {/* mini nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { i: "home",      l: "Главная",   active: true },
            { i: "inbox",     l: "Inbox",     badge: "12" },
            { i: "sun_today", l: "Сегодня",   badge: "8" },
            { i: "calendar",  l: "Календарь", badge: "5" },
            { i: "layers",    l: "Проекты",   badge: "12" },
          ].map((n) => (
            <button key={n.l} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px",
              borderRadius: 8,
              background: n.active ? "var(--bg-elev-2)" : "transparent",
              color: n.active ? "var(--text)" : "var(--text-2)",
              fontSize: 13,
            }}>
              <Icon name={n.i} size={15} style={{ color: n.active ? "var(--text)" : "var(--text-3)" }} />
              <span style={{ flex: 1, textAlign: "left" }}>{n.l}</span>
              {n.badge && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{n.badge}</span>}
            </button>
          ))}
        </div>

        {/* project chips */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 4px" }}>Активные</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { c: "--p-openresto", l: "OpenResto" },
              { c: "--p-youmin",     l: "Youmin" },
              { c: "--p-diploma",    l: "Дипломы" },
              { c: "--p-sites",       l: "Сайты" },
              { c: "--p-bots",        l: "Боты" },
              { c: "--p-girl",         l: "Аня" },
              { c: "--p-car",          l: "Машина" },
            ].map((p) => (
              <span key={p.l} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 999,
                fontSize: 11, color: "var(--text-2)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(${p.c})` }} />
                {p.l}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* bottom */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials="К" color="var(--p-openresto)" size={26} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 12, color: "var(--text)" }}>энергия 4/5</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>стрик · 28 дней</span>
          </div>
          <IconButton icon="settings" size="sm" />
        </div>
      </aside>
      <ContentEdge />
    </div>
  );
}

window.SidebarV1 = SidebarV1;
window.SidebarV2 = SidebarV2;
window.SidebarV3 = SidebarV3;
window.SidebarV4 = SidebarV4;
