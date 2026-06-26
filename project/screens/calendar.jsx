/* Calendar — week view (Mon-Sun), with mini calendar + project filters */

const WEEK_DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEK_DATES = [18, 19, 20, 21, 22, 23, 24]; // May 2026 — week of 21st
const TODAY_INDEX = 3; // Wednesday May 21

const CAL_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

const CAL_EVENTS = [
  // Monday 18
  { d: 0, sh: 10,   eh: 10.5, title: "Standup",                color: "--p-youmin",    icon: "video" },
  { d: 0, sh: 14,   eh: 15,   title: "Демо Youmin",            color: "--p-youmin",    icon: "video" },
  { d: 0, sh: 16,   eh: 17,   title: "Спортзал",               color: "--p-health",    icon: "heart" },

  // Tuesday 19
  { d: 1, sh: 9.5,  eh: 11,   title: "Глубокая работа · OpenResto", color: "--p-openresto", icon: null },
  { d: 1, sh: 12,   eh: 12.5, title: "Обед с Димой",           color: "--p-family",    icon: null },
  { d: 1, sh: 14,   eh: 15,   title: "Созвон с клиентом",      color: "--p-sites",     icon: "phone" },
  { d: 1, sh: 18,   eh: 19.5, title: "Английский",             color: "--p-sites",     icon: null },

  // Wednesday 20
  { d: 2, sh: 9,    eh: 12,   title: "Фокус-блок · OpenResto", color: "--p-openresto", icon: null },
  { d: 2, sh: 13,   eh: 14,   title: "Анна — звонок",          color: "--p-diploma",   icon: "phone" },
  { d: 2, sh: 16,   eh: 17,   title: "ТО — запись",            color: "--p-car",       icon: "car" },

  // Thursday 21 (today)
  { d: 3, sh: 9.5,  eh: 10,   title: "Standup",                color: "--p-youmin",    icon: "video" },
  { d: 3, sh: 11.5, eh: 12,   title: "Анна — звонок",          color: "--p-diploma",   icon: "phone" },
  { d: 3, sh: 13,   eh: 14,   title: "Обед",                   color: "--text-muted",  icon: null },
  { d: 3, sh: 15,   eh: 16.5, title: "Свидание с Аней",        color: "--p-girl",      icon: "heart" },
  { d: 3, sh: 18.5, eh: 19.25,title: "Запись демо",            color: "--p-bots",      icon: "video" },

  // Friday 22
  { d: 4, sh: 10,   eh: 10.5, title: "Standup",                color: "--p-youmin",    icon: "video" },
  { d: 4, sh: 11,   eh: 13,   title: "Сдача спринта",          color: "--p-openresto", icon: null },
  { d: 4, sh: 14,   eh: 15,   title: "Дедлайн — диплом Анны",  color: "--p-diploma",   icon: "flag", deadline: true },
  { d: 4, sh: 19,   eh: 21,   title: "Ужин с семьёй",          color: "--p-family",    icon: "heart" },

  // Saturday 23
  { d: 5, sh: 10,   eh: 12,   title: "Уборка дома",            color: "--p-home",      icon: null },
  { d: 5, sh: 13,   eh: 16,   title: "Дача — родители",        color: "--p-family",    icon: "car" },

  // Sunday 24
  { d: 6, sh: 11,   eh: 12,   title: "Спортзал",               color: "--p-health",    icon: "heart" },
  { d: 6, sh: 18,   eh: 20,   title: "Недельный обзор",        color: "--p-openresto", icon: null },
];

const ALL_DAY = [
  { d: 1, title: "Поездка на конференцию (Питер)", color: "--p-youmin", span: 1 },
  { d: 4, title: "Дедлайн: диплом Анны",          color: "--p-diploma", span: 1, deadline: true },
];

function MiniCalendar() {
  const days = Array.from({ length: 35 }, (_, i) => i - 3); // May 2026: 1st is Friday
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Май 2026</span>
        <div style={{ display: "flex", gap: 2 }}>
          <IconButton icon="chevron_left" size="sm" />
          <IconButton icon="chevron_right" size="sm" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {WEEK_DAYS.map((d) => (
          <span key={d} style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "4px 0" }}>{d}</span>
        ))}
        {days.map((n, i) => {
          const visible = n > 0 && n <= 31;
          const isToday = n === 21;
          const inWeek = n >= 18 && n <= 24;
          return (
            <span key={i} style={{
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              padding: "5px 0",
              borderRadius: 6,
              color: !visible ? "transparent"
                    : isToday ? "var(--bg)"
                    : inWeek ? "var(--text)"
                    : "var(--text-3)",
              background: isToday ? "var(--text)"
                    : inWeek ? "var(--bg-elev-2)"
                    : "transparent",
            }}>
              {visible ? n : "-"}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ProjectFilters() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" }}>Календари</span>
      {PROJECT_COLORS.slice(0, 7).map((p) => (
        <label key={p.token} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 8px", borderRadius: 6,
          fontSize: 13, color: "var(--text-2)",
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4,
            background: `color-mix(in oklab, var(${p.token}) 28%, transparent)`,
            border: `1px solid color-mix(in oklab, var(${p.token}) 60%, transparent)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flex: "none",
          }}>
            <Icon name="check" size={10} stroke={2.5} style={{ color: `var(${p.token})` }} />
          </span>
          <span style={{ flex: 1 }}>{p.name}</span>
        </label>
      ))}
    </div>
  );
}

function CalendarScreen() {
  const slotH = 44;
  const totalH = CAL_HOURS.length * slotH;
  const NOW = 11.5 + 0.4;
  const nowTop = (NOW - CAL_HOURS[0]) * slotH;

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Календарь" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="неделя 21 · 18–24 мая 2026"
          title="Календарь"
          sub="22 события · 3 дедлайна"
          right={<>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 8 }}>
              <IconButton icon="chevron_left" />
              <Button variant="ghost" size="sm">Сегодня</Button>
              <IconButton icon="chevron_right" />
            </div>
            <Tabs items={["День", "Неделя", "Месяц"]} active="Неделя" />
            <Button variant="secondary" size="sm" icon="plus">Событие</Button>
          </>}
        />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Left rail */}
          <aside style={{
            width: 240, flex: "none",
            borderRight: "1px solid var(--border-subtle)",
            padding: "18px 16px",
            display: "flex", flexDirection: "column", gap: 18,
            background: "var(--bg)",
          }}>
            <MiniCalendar />
            <div style={{ height: 1, background: "var(--border-subtle)" }} />
            <ProjectFilters />
          </aside>

          {/* Week grid */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
            {/* Day headers */}
            <div style={{
              display: "grid", gridTemplateColumns: `48px repeat(7, 1fr)`,
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <div />
              {WEEK_DAYS.map((d, i) => {
                const isToday = i === TODAY_INDEX;
                return (
                  <div key={d} style={{
                    padding: "12px 14px",
                    borderLeft: "1px solid var(--border-subtle)",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{d}</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      fontSize: 18,
                      color: isToday ? "var(--text)" : "var(--text-2)",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                    }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: 999,
                        background: isToday ? "var(--text)" : "transparent",
                        color: isToday ? "var(--bg)" : "var(--text-2)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 14, fontWeight: 500,
                      }}>{WEEK_DATES[i]}</span>
                      {isToday && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>сегодня</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* All-day strip */}
            <div style={{
              display: "grid", gridTemplateColumns: `48px repeat(7, 1fr)`,
              borderBottom: "1px solid var(--border-subtle)",
              padding: "6px 0",
              minHeight: 32,
              position: "relative",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "8px 6px 0 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>весь день</div>
              {WEEK_DAYS.map((_, i) => (
                <div key={i} style={{ borderLeft: "1px solid var(--border-subtle)", padding: 4, minHeight: 28 }}>
                  {ALL_DAY.filter((e) => e.d === i).map((e, j) => (
                    <div key={j} style={{
                      padding: "4px 8px",
                      background: `color-mix(in oklab, var(${e.color}) 16%, transparent)`,
                      borderLeft: `2px solid var(${e.color})`,
                      borderRadius: "0 6px 6px 0",
                      fontSize: 11,
                      color: "var(--text)",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {e.deadline && <Icon name="flag" size={10} style={{ color: `var(${e.color})` }} />}
                      {e.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Timed grid */}
            <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", position: "relative" }}>
              <div style={{
                display: "grid", gridTemplateColumns: `48px repeat(7, 1fr)`,
                position: "relative",
              }}>
                {/* hour labels column */}
                <div style={{ position: "relative", height: totalH }}>
                  {CAL_HOURS.map((h, i) => (
                    <span key={h} style={{
                      position: "absolute", left: 8, top: i * slotH - 6,
                      fontSize: 10, color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}>{String(h).padStart(2, "0")}:00</span>
                  ))}
                </div>

                {WEEK_DAYS.map((_, dayIdx) => (
                  <div key={dayIdx} style={{
                    position: "relative",
                    borderLeft: "1px solid var(--border-subtle)",
                    height: totalH,
                    background: dayIdx === TODAY_INDEX ? "color-mix(in oklab, var(--text) 1%, transparent)" : "transparent",
                  }}>
                    {CAL_HOURS.map((h, i) => (
                      <div key={h} style={{
                        position: "absolute", left: 0, right: 0,
                        top: i * slotH,
                        borderTop: "1px solid var(--border-subtle)",
                        opacity: 0.6,
                      }} />
                    ))}

                    {CAL_EVENTS.filter((e) => e.d === dayIdx).map((e, j) => {
                      const top = (e.sh - CAL_HOURS[0]) * slotH + 1;
                      const h = (e.eh - e.sh) * slotH - 2;
                      return (
                        <div key={j} style={{
                          position: "absolute",
                          top, height: h,
                          left: 4, right: 4,
                          padding: "5px 8px",
                          background: `color-mix(in oklab, var(${e.color}) 14%, transparent)`,
                          borderLeft: `2px solid var(${e.color})`,
                          borderRadius: "0 6px 6px 0",
                          display: "flex", flexDirection: "column", gap: 2,
                          overflow: "hidden",
                          minWidth: 0,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                            {e.icon && <Icon name={e.icon} size={10} style={{ color: `var(${e.color})`, flex: "none" }} />}
                            <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                          </div>
                          {h > 30 && (
                            <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                              {Math.floor(e.sh)}:{((e.sh % 1) * 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayIdx === TODAY_INDEX && (
                      <div style={{
                        position: "absolute", left: 0, right: 0,
                        top: nowTop,
                        height: 0,
                        zIndex: 2,
                      }}>
                        <div style={{ position: "relative", height: 1, background: "var(--danger)" }}>
                          <span style={{
                            position: "absolute", left: -4, top: -3,
                            width: 8, height: 8, borderRadius: 999,
                            background: "var(--danger)",
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;
