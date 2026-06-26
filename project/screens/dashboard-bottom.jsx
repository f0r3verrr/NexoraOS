/* Dashboard bottom row: active projects, quick notes, recent, mood, habits */

const ACTIVE_PROJECTS = [
  { name: "OpenResto · MVP",    token: "--p-openresto", progress: 68, tasksOpen: 14, tasksDone: 31, sub: "Sprint 7 · до пятницы" },
  { name: "Youmin · QA онбординга", token: "--p-youmin",  progress: 42, tasksOpen: 7,  tasksDone: 5,  sub: "Релиз через 2 недели" },
  { name: "Диплом Анны · экономика", token: "--p-diploma", progress: 80, tasksOpen: 2, tasksDone: 8, sub: "Дедлайн 28 мая · 30 000 ₽" },
  { name: "Лендинг для студии",      token: "--p-sites",   progress: 25, tasksOpen: 6,  tasksDone: 2,  sub: "Ожидает текстов" },
];

function ProjectMiniCard({ p }) {
  return (
    <div style={{
      padding: "14px 14px",
      background: "var(--bg-elev-2)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${p.token})`, flex: "none" }} />
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
        <Icon name="chevron_right" size={14} style={{ color: "var(--text-muted)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
        <span>{p.tasksDone}/{p.tasksDone + p.tasksOpen} задач</span>
        <span>{p.progress}%</span>
      </div>
      <Progress value={p.progress} color={`var(${p.token})`} height={3} />
      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{p.sub}</span>
    </div>
  );
}

function ActiveProjectsCard() {
  return (
    <div style={{
      gridColumn: "span 8",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      padding: "14px 18px 16px 18px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Активные проекты</span>
        <Button variant="ghost" size="sm" trailing={<Icon name="arrow_right" size={13} />}>Все 12</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {ACTIVE_PROJECTS.map((p) => <ProjectMiniCard key={p.name} p={p} />)}
      </div>
    </div>
  );
}

/* ---------- Quick notes (sticky style) ---------- */
const QUICK_NOTES = [
  { color: "--p-home",    text: "Wi-Fi для гостей: «KIR-guest» / parol-12345", t: "вчера" },
  { color: "--p-girl",    text: "Аня — кольцо 16,5 · обувь 38 · кофе flat white без сахара", t: "3 дня назад" },
  { color: "--p-car",     text: "СТО «Молот» — Дмитрий +7 916 111 22 33, замена масла после 92 000", t: "неделю назад" },
];

function QuickNotesCard() {
  return (
    <div style={{
      gridColumn: "span 4",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      padding: "14px 18px 16px 18px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Быстрые заметки</span>
        <IconButton icon="plus" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {QUICK_NOTES.map((n, i) => (
          <div key={i} style={{
            padding: "12px 14px",
            background: `color-mix(in oklab, var(${n.color}) 10%, var(--bg-elev-2))`,
            borderLeft: `2px solid var(${n.color})`,
            borderRadius: "0 8px 8px 0",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45 }}>{n.text}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{n.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Bottom strip: recent, mood, habits ---------- */
const RECENT = [
  { i: "file", l: "Договор-Анна-2026.pdf",    s: "5 мин назад · Дипломы",       proj: "--p-diploma" },
  { i: "note", l: "Архитектура нового меню",   s: "час назад · OpenResto",       proj: "--p-openresto" },
  { i: "check",l: "Прозвонить лидов с лендинга", s: "2 ч назад · Сайты",          proj: "--p-sites" },
  { i: "note", l: "Daily journal · 20 мая",   s: "вчера · Личное",              proj: "--p-girl" },
  { i: "file", l: "Скан СТС.jpg",             s: "позавчера · Машина",          proj: "--p-car" },
];

function RecentCard() {
  return (
    <div style={{
      gridColumn: "span 5",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      padding: "14px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Недавнее</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>последние 5</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {RECENT.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0",
            borderBottom: i === RECENT.length - 1 ? "none" : "1px solid var(--border-subtle)",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 7,
              background: `color-mix(in oklab, var(${r.proj}) 14%, transparent)`,
              color: `var(${r.proj})`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flex: "none",
            }}>
              <Icon name={r.i} size={14} />
            </span>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.l}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{r.s}</span>
            </div>
            <Icon name="chevron_right" size={14} style={{ color: "var(--text-muted)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Mood / energy ---------- */
function MoodCard() {
  const moods = ["smile", "smile", "smile", "smile", "smile"];
  const energy = 3; // 0..4
  return (
    <div style={{
      gridColumn: "span 3",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Как ты сейчас?</span>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Настроение</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[1,2,3,4,5].map((n) => {
            const active = n === 4;
            return (
              <button key={n} style={{
                width: 38, height: 38, borderRadius: 8,
                background: active ? "color-mix(in oklab, var(--p-health) 18%, transparent)" : "var(--bg-elev-2)",
                border: `1px solid ${active ? "color-mix(in oklab, var(--p-health) 40%, transparent)" : "var(--border-subtle)"}`,
                color: active ? "var(--p-health)" : "var(--text-3)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="smile" size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Энергия</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{energy}/5</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[0,1,2,3,4].map((i) => (
            <div key={i} style={{
              flex: 1, height: 8, borderRadius: 3,
              background: i < energy ? "var(--p-health)" : "var(--bg-elev-3)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Habits ---------- */
const HABITS = [
  { name: "Сон 7 ч",   streak: 12, color: "--p-health", days: [1,1,1,0,1,1,1,1,1,1,1,1,0,1] },
  { name: "Спорт",     streak: 4,  color: "--p-girl",   days: [0,1,1,0,1,0,1,1,0,1,1,1,0,1] },
  { name: "Английский", streak: 28, color: "--p-sites", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { name: "Без сахара", streak: 6,  color: "--p-diploma", days: [0,1,1,1,0,1,1,0,1,1,1,1,1,1] },
];

function HabitsCard() {
  return (
    <div style={{
      gridColumn: "span 4",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Привычки</span>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>последние 14 дней</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {HABITS.map((h) => (
          <div key={h.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {h.days.map((d, i) => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: d ? `color-mix(in oklab, var(${h.color}) ${50 + i * 3}%, transparent)` : "var(--bg-elev-3)",
                }} />
              ))}
            </div>
            <span style={{
              fontSize: 12, color: "var(--text-2)",
              fontFamily: "var(--font-mono)",
              minWidth: 32, textAlign: "right",
            }}>{h.streak}д</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ActiveProjectsCard = ActiveProjectsCard;
window.QuickNotesCard = QuickNotesCard;
window.RecentCard = RecentCard;
window.MoodCard = MoodCard;
window.HabitsCard = HabitsCard;
