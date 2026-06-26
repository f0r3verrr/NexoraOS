/* Dashboard middle widgets: tasks list, schedule, projects */

const DASH_TASKS = [
  { p: 1, t: "Собрать тест-кейсы для онбординга",     proj: "--p-youmin",    projL: "Youmin",      time: "10:00", checked: false },
  { p: 1, t: "Закрыть баг с дублированием заказов",   proj: "--p-openresto", projL: "OpenResto",   time: "11:30", checked: false, stuck: true },
  { p: 2, t: "Позвонить Анне (диплом, маркетинг)",     proj: "--p-diploma",   projL: "Дипломы",     time: "13:00", checked: false },
  { p: null, t: "Обед с Аней",                          proj: "--p-girl",      projL: "Аня",         time: "15:00", checked: false },
  { p: 3, t: "Согласовать макет лендинга со студией",   proj: "--p-sites",     projL: "Сайты",       time: "16:30", checked: false },
  { p: 2, t: "Записать видео-демо для бота-помощника",  proj: "--p-bots",      projL: "Боты",        time: "18:00", checked: false },
  { p: null, t: "Оплатить ОСАГО — осталось 6 дней",      proj: "--p-car",       projL: "Машина",      time: "вечером", checked: false, overdueWarn: true },
  { p: 3, t: "Прочитать главу о E2E-стратегиях",         proj: "--p-youmin",    projL: "Youmin",      time: "—", checked: true },
];

function TaskRow({ task }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      borderRadius: 8,
    }}>
      <Checkbox checked={task.checked} priority={task.p} />
      <span style={{
        flex: 1,
        fontSize: 14,
        color: task.checked ? "var(--text-muted)" : "var(--text)",
        textDecoration: task.checked ? "line-through" : "none",
        textDecorationColor: "var(--text-muted)",
      }}>
        {task.t}
      </span>
      {task.stuck && (
        <Badge tone="warn" icon="flag">застряло</Badge>
      )}
      {task.overdueWarn && (
        <Badge tone="danger" icon="bell">через 6 дней</Badge>
      )}
      <ProjectTag projectToken={task.proj} label={task.projL} />
      <span style={{
        fontSize: 12, color: "var(--text-3)",
        fontFamily: "var(--font-mono)",
        minWidth: 50, textAlign: "right",
      }}>{task.time}</span>
    </div>
  );
}

function TodayTasksCard() {
  return (
    <div style={{
      gridColumn: "span 8",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px 10px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Задачи на сегодня</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>8 · 3 готово</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tabs items={["Все", "Работа", "Личное"]} active="Все" />
          <IconButton icon="more" />
        </div>
      </div>
      <div style={{
        display: "flex", flexDirection: "column",
        padding: "0 6px 8px 6px",
      }}>
        {DASH_TASKS.map((t, i) => <TaskRow key={i} task={t} />)}
      </div>
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="plus" size={15} style={{ color: "var(--text-3)" }} />
        <span style={{ fontSize: 13, color: "var(--text-muted)", flex: 1 }}>
          Позвонить Ане завтра в 15:00 #youmin !p1
        </span>
        <Kbd>↵</Kbd>
      </div>
    </div>
  );
}

/* ---------- Schedule (right column) ---------- */
const SCHED = [
  { t: "09:30", l: "Standup", sub: "Youmin · Zoom",         color: "--p-youmin",    icon: "video", duration: 30 },
  { t: "11:30", l: "Анна Соколова — звонок", sub: "Дипломы · правки", color: "--p-diploma", icon: "phone", duration: 30 },
  { t: "13:00", l: "Окно — обед",   sub: "—",                color: "--text-muted",  icon: null,    duration: 60 },
  { t: "15:00", l: "Свидание с Аней", sub: "Парк Горького",  color: "--p-girl",      icon: "heart", duration: 90 },
  { t: "18:30", l: "Запись демо",   sub: "TG-бот #3",        color: "--p-bots",      icon: "video", duration: 45 },
];

function ScheduleCard() {
  return (
    <div style={{
      gridColumn: "span 4",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px 18px" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Расписание</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>5 событий</span>
          <IconButton icon="calendar" />
        </div>
      </div>

      <div style={{ padding: "0 18px 14px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
        {SCHED.map((e, i) => {
          const isNow = i === 1;
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              gap: 10,
              padding: "10px 0",
              position: "relative",
            }}>
              <span style={{
                fontSize: 12,
                color: isNow ? "var(--text)" : "var(--text-3)",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                paddingTop: 1,
                fontWeight: isNow ? 500 : 400,
              }}>{e.t}</span>
              <div style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: `color-mix(in oklab, var(${e.color}) ${isNow ? 16 : 10}%, transparent)`,
                borderLeft: `2px solid var(${e.color})`,
                display: "flex", flexDirection: "column", gap: 3,
                position: "relative",
              }}>
                {isNow && (
                  <span style={{
                    position: "absolute", top: 8, right: 10,
                    fontSize: 10, color: "var(--text)",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                    background: "var(--bg-elev-3)", padding: "2px 6px", borderRadius: 4,
                  }}>СЕЙЧАС</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {e.icon && <Icon name={e.icon} size={12} style={{ color: `var(${e.color})` }} />}
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{e.l}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{e.sub} · {e.duration} мин</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.TodayTasksCard = TodayTasksCard;
window.ScheduleCard = ScheduleCard;
