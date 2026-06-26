/* Канбан, связанный с календарём */

const KANBAN_COLS = [
  { id: "backlog", l: "Бэклог",       tone: "neutral" },
  { id: "week",     l: "На неделе",    tone: "info" },
  { id: "today",    l: "Сегодня",      tone: "warn" },
  { id: "doing",    l: "В работе",     tone: "warn", accent: true },
  { id: "review",   l: "Ревью",        tone: "info" },
  { id: "done",     l: "Готово",       tone: "success" },
];

// Each task has a due day-of-week (0=пн … 6=вс), or null
const KANBAN_TASKS = [
  // backlog
  { id: 1,  col: "backlog", proj: "--p-openresto", l: "Рефакторинг auth-модуля",            day: null, p: 3, est: "3 ч" },
  { id: 2,  col: "backlog", proj: "--p-sites",     l: "Прототип лендинга студии",            day: null, p: 3, est: "2 д" },
  { id: 3,  col: "backlog", proj: "--p-bots",      l: "Бот №4 — отчёты по неделе",          day: null, p: 3, est: "5 д" },

  // week
  { id: 4,  col: "week",    proj: "--p-youmin",    l: "Подготовить демо для команды",         day: 4, p: 2, est: "3 ч" },
  { id: 5,  col: "week",    proj: "--p-diploma",   l: "ВКР Андрея — введение",                day: 3, p: 2, est: "4 ч" },
  { id: 6,  col: "week",    proj: "--p-car",       l: "Оплатить ОСАГО",                       day: 4, p: 1, est: "10 мин", overdue: true },
  { id: 7,  col: "week",    proj: "--p-home",      l: "Записать сантехника",                  day: 5, p: 3, est: "—" },

  // today
  { id: 8,  col: "today",   proj: "--p-openresto", l: "Доделать миграцию меню",              day: 2, p: 1, est: "2 ч", stuck: 4 },
  { id: 9,  col: "today",   proj: "--p-youmin",    l: "Тест-кейсы для онбординга",            day: 2, p: 1, est: "1.5 ч" },
  { id: 10, col: "today",   proj: "--p-diploma",   l: "Звонок Анне — правки",                 day: 2, p: 2, est: "30 мин" },
  { id: 11, col: "today",   proj: "--p-girl",      l: "Свидание с Аней — парк Горького",      day: 2, p: null, est: "1.5 ч" },

  // doing
  { id: 12, col: "doing",   proj: "--p-openresto", l: "API v2 — отдавать новую схему",        day: 3, p: 2, est: "2 ч" },
  { id: 13, col: "doing",   proj: "--p-sites",     l: "Дизайн hero для салона",                day: 3, p: 3, est: "1 д" },

  // review
  { id: 14, col: "review",  proj: "--p-openresto", l: "PR · корзина и оплата",                day: 4, p: 2, est: "—", subs: [3, 5] },
  { id: 15, col: "review",  proj: "--p-bots",      l: "Бот №3 — релиз-кандидат",              day: 4, p: 3, est: "—" },

  // done
  { id: 16, col: "done",    proj: "--p-openresto", l: "Schema-v2 на staging",                  day: 1, p: 2, est: "" },
  { id: 17, col: "done",    proj: "--p-diploma",   l: "Договор с Анной подписан",              day: 0, p: 3, est: "" },
];

const DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const DAY_DATES = [18, 19, 20, 21, 22, 23, 24];

function KanbanCard({ t, hoverDay }) {
  const isToday = t.day === 3;
  const isPast = t.col === "done";
  return (
    <div style={{
      padding: "10px 12px",
      background: "var(--bg-elev-1)",
      border: `1px solid ${isToday ? "color-mix(in oklab, var(" + t.proj + ") 40%, var(--border-subtle))" : "var(--border-subtle)"}`,
      borderRadius: 8,
      borderLeft: `2px solid var(${t.proj})`,
      display: "flex", flexDirection: "column", gap: 8,
      cursor: "grab",
      transition: "border-color 120ms, transform 120ms",
      opacity: isPast ? 0.7 : 1,
    }}>
      <span style={{
        fontSize: 13, color: "var(--text)",
        lineHeight: 1.4,
        textDecoration: isPast ? "line-through" : "none",
        textDecorationColor: "var(--text-muted)",
      }}>{t.l}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
        {t.p && (
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: t.p === 1 ? "var(--danger)" : t.p === 2 ? "var(--warn)" : "var(--info)",
          }} />
        )}
        {t.day != null ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: "var(--font-mono)",
            color: t.overdue ? "var(--danger)" : "var(--text-3)",
          }}>
            <Icon name="calendar" size={11} />
            {DAYS[t.day]} {DAY_DATES[t.day]}
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
            <Icon name="calendar" size={11} />
            без даты
          </span>
        )}
        {t.est && <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{t.est}</span>}
        {t.stuck && <Badge tone="warn" icon="flag" style={{ marginLeft: "auto" }}>{t.stuck}д</Badge>}
        {t.subs && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}><Icon name="check" size={11} /> {t.subs[0]}/{t.subs[1]}</span>}
      </div>
    </div>
  );
}

function KanbanColumn({ c, tasks }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minWidth: 0,
      background: c.accent ? "color-mix(in oklab, var(--text) 2%, var(--bg))" : "transparent",
      borderRadius: 10,
      border: c.accent ? "1px solid var(--border-subtle)" : "1px solid transparent",
    }}>
      <div style={{
        padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Badge tone={c.tone} dot>{c.l}</Badge>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{tasks.length}</span>
        <span style={{ flex: 1 }} />
        <IconButton icon="plus" size="sm" />
      </div>
      <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 80 }}>
        {tasks.map((t) => <KanbanCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}

/* Calendar strip: 7 days, tasks scheduled per day shown as colored chips */
function CalendarStrip() {
  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      background: "color-mix(in oklab, var(--bg-elev-1) 60%, var(--bg))",
      flex: "none",
    }}>
      <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="calendar" size={14} style={{ color: "var(--text-3)" }} />
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Неделя 18–24 мая</span>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>тяни карточку на день — поменяется срок</span>
        <span style={{ flex: 1 }} />
        <Tabs items={["Неделя", "День", "Месяц"]} active="Неделя" />
        <Button variant="ghost" size="sm" icon="external">Открыть календарь</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: "1px solid var(--border-subtle)" }}>
        {DAYS.map((d, di) => {
          const dayTasks = KANBAN_TASKS.filter((t) => t.day === di && t.col !== "done");
          const isToday = di === 3;
          const isOverflow = dayTasks.length > 4;
          const shown = dayTasks.slice(0, 4);
          return (
            <div key={d} style={{
              padding: "10px 10px 12px",
              borderRight: di === 6 ? "none" : "1px solid var(--border-subtle)",
              minHeight: 160,
              display: "flex", flexDirection: "column", gap: 6,
              background: isToday ? "color-mix(in oklab, var(--text) 2%, transparent)" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, color: "var(--text-3)",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}>{d}</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 999,
                  background: isToday ? "var(--text)" : "transparent",
                  color: isToday ? "var(--bg)" : "var(--text-2)",
                  fontSize: 12, fontWeight: 500, fontFamily: "var(--font-mono)",
                }}>{DAY_DATES[di]}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{dayTasks.length}</span>
              </div>

              {shown.map((t) => (
                <div key={t.id} style={{
                  padding: "5px 8px",
                  background: `color-mix(in oklab, var(${t.proj}) 14%, var(--bg-elev-1))`,
                  borderLeft: `2px solid var(${t.proj})`,
                  borderRadius: "0 6px 6px 0",
                  fontSize: 11, color: "var(--text)",
                  display: "flex", alignItems: "center", gap: 5,
                  overflow: "hidden",
                  cursor: "grab",
                }}>
                  {t.p === 1 && <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--danger)", flex: "none" }} />}
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.l}</span>
                </div>
              ))}

              {isOverflow && (
                <span style={{ fontSize: 11, color: "var(--text-3)", padding: "2px 4px" }}>
                  +{dayTasks.length - shown.length} ещё
                </span>
              )}

              {dayTasks.length === 0 && (
                <div style={{
                  flex: 1,
                  border: "1px dashed var(--border-subtle)",
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}>
                  пусто
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Канбан" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="OpenResto · Sprint 7 · доска"
          title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--p-openresto)" }} />
            OpenResto · Sprint 7
          </span>}
          sub="22 задачи · 4 в работе · до пятницы"
          right={<>
            <span style={{ display: "inline-flex", alignItems: "center", gap: -6, marginRight: 6 }}>
              <Avatar initials="К" color="var(--p-openresto)" size={22} />
              <Avatar initials="МК" color="var(--p-youmin)" size={22} />
            </span>
            <Tabs items={["Канбан", "Календарь", "Гантт"]} active="Канбан" />
            <Button variant="ghost" size="sm" icon="filter">Фильтры</Button>
            <Button variant="secondary" size="sm" icon="plus">Задача</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflow: "auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(180px, 1fr))",
            gap: 12,
            padding: "16px 20px 20px",
            minWidth: 1100,
          }}>
            {KANBAN_COLS.map((c) => (
              <KanbanColumn
                key={c.id}
                c={c}
                tasks={KANBAN_TASKS.filter((t) => t.col === c.id)}
              />
            ))}
          </div>
        </div>

        <CalendarStrip />
      </main>
    </div>
  );
}

window.KanbanScreen = KanbanScreen;
