/* Today screen — todoist-style task focus, with day timeline */

const TODAY_LISTS = [
  {
    title: "Утро",
    sub: "до 12:00 · энергия высокая",
    tasks: [
      { p: 1, t: "Доделать миграцию старого меню",          proj: "--p-openresto", projL: "OpenResto", time: "до 11:00", checked: false, sub: [4, 6] },
      { p: 1, t: "Собрать тест-кейсы для онбординга Youmin", proj: "--p-youmin",   projL: "Youmin",    time: "до 12:00", checked: false },
      { p: 2, t: "Прочитать главу о E2E-стратегиях",         proj: "--p-youmin",   projL: "Youmin",    time: "30 мин",   checked: true },
    ],
  },
  {
    title: "День",
    sub: "12:00 – 18:00",
    tasks: [
      { p: 2, t: "Позвонить Анне Соколовой — правки по диплому", proj: "--p-diploma", projL: "Дипломы",  time: "13:00", checked: false, attachments: 2 },
      { p: null, t: "Обед с Аней в парке Горького",                proj: "--p-girl",    projL: "Аня",       time: "15:00", checked: false },
      { p: 3, t: "Согласовать макет лендинга со студией",          proj: "--p-sites",   projL: "Сайты",     time: "16:30", checked: false, stuck: true },
    ],
  },
  {
    title: "Вечер",
    sub: "после 18:00 · меньше когнитива",
    tasks: [
      { p: 2, t: "Записать видео-демо для бота-помощника", proj: "--p-bots",  projL: "Боты",     time: "19:00", checked: false },
      { p: null, t: "Оплатить ОСАГО",                       proj: "--p-car",   projL: "Машина",  time: "—",     checked: false, overdue: true },
      { p: 3, t: "Daily journal",                          proj: "--p-girl",  projL: "Личное",  time: "22:00", checked: false, recurring: true },
    ],
  },
];

function TodayTaskRow({ t }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <Checkbox checked={t.checked} priority={t.p} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{
          fontSize: 14,
          color: t.checked ? "var(--text-muted)" : "var(--text)",
          textDecoration: t.checked ? "line-through" : "none",
        }}>{t.t}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-3)" }}>
          <ProjectTag projectToken={t.proj} label={t.projL} size="sm" />
          {t.sub && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="check" size={11} /> {t.sub[0]}/{t.sub[1]}
            </span>
          )}
          {t.attachments && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="paperclip" size={11} /> {t.attachments}
            </span>
          )}
          {t.recurring && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="repeat" size={11} /> ежедневно
            </span>
          )}
          {t.stuck && <Badge tone="warn" icon="flag">застряло 5 дней</Badge>}
          {t.overdue && <Badge tone="danger" icon="bell">просрочено</Badge>}
        </div>
      </div>
      <span style={{
        fontSize: 12, color: "var(--text-2)",
        fontFamily: "var(--font-mono)",
      }}>{t.time}</span>
      <IconButton icon="more" size="sm" />
    </div>
  );
}

function TodayList({ list }) {
  return (
    <section style={{
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <header style={{ padding: "14px 18px 10px 18px", display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{list.title}</span>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{list.sub}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {list.tasks.filter((t) => !t.checked).length} осталось
        </span>
      </header>
      <div>{list.tasks.map((t, i) => <TodayTaskRow key={i} t={t} />)}</div>
    </section>
  );
}

/* Day timeline (right column) */
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9..20
const TIMELINE_EVENTS = [
  { startH: 9.5,  endH: 10,    title: "Standup",          color: "--p-youmin",    icon: "video" },
  { startH: 11.5, endH: 12,    title: "Анна — звонок",    color: "--p-diploma",   icon: "phone" },
  { startH: 13,   endH: 14,    title: "Обед",             color: "--text-muted",  icon: null },
  { startH: 15,   endH: 16.5,  title: "Свидание с Аней",  color: "--p-girl",      icon: "heart" },
  { startH: 18.5, endH: 19.25, title: "Запись демо",      color: "--p-bots",      icon: "video" },
];

function DayTimeline() {
  const slotHeight = 44;
  const totalHeight = HOURS.length * slotHeight;
  const NOW = 11.5 + 0.4; // ~11:54
  const nowTop = (NOW - HOURS[0]) * slotHeight;

  return (
    <aside style={{
      width: 320, flex: "none",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <header style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>День</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>среда · 21 мая</span>
        </div>
        <Tabs items={["Д", "Н", "М"]} active="Д" />
      </header>

      <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 18px 18px 18px" }}>
        <div style={{ position: "relative", height: totalHeight }}>
          {HOURS.map((h, i) => (
            <div key={h} style={{
              position: "absolute", left: 36, right: 0, top: i * slotHeight,
              borderTop: "1px solid var(--border-subtle)",
            }} />
          ))}
          {HOURS.map((h, i) => (
            <span key={"l" + h} style={{
              position: "absolute", left: 0, top: i * slotHeight - 7,
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}>{String(h).padStart(2, "0")}:00</span>
          ))}

          {TIMELINE_EVENTS.map((e, i) => {
            const top = (e.startH - HOURS[0]) * slotHeight + 1;
            const height = (e.endH - e.startH) * slotHeight - 2;
            return (
              <div key={i} style={{
                position: "absolute",
                top, height,
                left: 40, right: 4,
                padding: "6px 10px",
                background: `color-mix(in oklab, var(${e.color}) 12%, transparent)`,
                borderLeft: `2px solid var(${e.color})`,
                borderRadius: "0 8px 8px 0",
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
                overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {e.icon && <Icon name={e.icon} size={11} style={{ color: `var(${e.color})` }} />}
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{e.title}</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  {Math.floor(e.startH)}:{((e.startH % 1) * 60).toString().padStart(2, "0")} – {Math.floor(e.endH)}:{((e.endH % 1) * 60).toString().padStart(2, "0")}
                </span>
              </div>
            );
          })}

          {/* now line */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: nowTop, height: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              fontSize: 10, color: "var(--danger)", fontFamily: "var(--font-mono)",
              background: "var(--bg-elev-1)", padding: "0 2px",
            }}>11:54</span>
            <div style={{ flex: 1, height: 1, background: "var(--danger)" }} />
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--danger)" }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function TodayScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Сегодня" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="среда · 21 мая · 11:54"
          title="Сегодня"
          sub="8 задач · 3 готово · 5 ч в календаре"
          right={<>
            <Button variant="ghost" size="sm" icon="filter">Фильтры</Button>
            <Button variant="ghost" size="sm" icon="sort">Группа: время</Button>
            <Button variant="secondary" size="sm" icon="plus">Задача</Button>
          </>}
        />

        <div style={{ flex: 1, display: "flex", gap: 16, padding: "20px 24px 24px 24px", minHeight: 0 }}>
          {/* progress + lists */}
          <div className="ws-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minWidth: 0 }}>
            {/* day progress */}
            <div style={{
              padding: "14px 18px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>День в работе</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 22, color: "var(--text)",
                    letterSpacing: "-0.02em",
                  }}>3 / 8 <span style={{ color: "var(--text-3)", fontSize: 14 }}>· 38%</span></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 12, color: "var(--text-3)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--p-openresto)" }} /> Работа · 5
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--p-girl)" }} /> Личное · 3
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="clock" size={12} /> 4 ч 20 мин
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ flex: 3, background: "var(--p-openresto)" }} />
                <div style={{ flex: 2, background: "var(--p-youmin)" }} />
                <div style={{ flex: 1, background: "var(--p-diploma)" }} />
                <div style={{ flex: 1, background: "var(--p-girl)" }} />
                <div style={{ flex: 1, background: "var(--p-bots)" }} />
                <div style={{ flex: 4, background: "var(--bg-elev-3)" }} />
              </div>
            </div>

            {TODAY_LISTS.map((l) => <TodayList key={l.title} list={l} />)}

            {/* add bar */}
            <div style={{
              padding: "12px 14px",
              background: "var(--bg-elev-1)",
              border: "1px dashed var(--border)",
              borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Icon name="plus" size={15} style={{ color: "var(--text-3)" }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)", flex: 1 }}>
                Например: «Сдать диплом Анны пт в 18 #дипломы !p1»
              </span>
              <Kbd>↵</Kbd>
            </div>
          </div>

          <DayTimeline />
        </div>
      </main>
    </div>
  );
}

window.TodayScreen = TodayScreen;
