/* Диаграмма Ганта — план по неделям */

const GANTT_WEEKS = [
  { l: "май", w: ["18", "25"] },
  { l: "июнь", w: ["1", "8", "15", "22", "29"] },
  { l: "июль", w: ["6", "13", "20", "27"] },
  { l: "авг", w: ["3", "10"] },
];

const GANTT_FLAT_WEEKS = GANTT_WEEKS.flatMap((m, mi) => m.w.map((d, i) => ({ d, m: m.l, monthStart: i === 0, monthIdx: mi })));

// task position is index (0..N-1) into GANTT_FLAT_WEEKS
const GANTT_ROWS = [
  {
    proj: "OpenResto · MVP", color: "--p-openresto", lead: "К", tasks: 14,
    items: [
      { start: 0,  end: 2,  l: "Миграция меню (БД)", milestone: false },
      { start: 2,  end: 5,  l: "Интеграция API v2",  dep: 0 },
      { start: 5,  end: 8,  l: "Корзина и оплата" },
      { start: 8,  end: 9,  l: "Релиз MVP", milestone: true },
    ],
  },
  {
    proj: "Youmin · QA онбординга", color: "--p-youmin", lead: "К", tasks: 7,
    items: [
      { start: 1,  end: 4,  l: "Тест-кейсы" },
      { start: 4,  end: 6,  l: "Автоматизация" },
      { start: 6,  end: 7,  l: "Демо для команды", milestone: true },
    ],
  },
  {
    proj: "Дипломы 2026 · сезон", color: "--p-diploma", lead: "К+А", tasks: 11,
    items: [
      { start: 0,  end: 1,  l: "Диплом Анны · сдача", milestone: true },
      { start: 0,  end: 3,  l: "Курсовая Ильи" },
      { start: 1,  end: 5,  l: "ВКР Андрея" },
      { start: 5,  end: 6,  l: "Закрытие сезона", milestone: true },
    ],
  },
  {
    proj: "Лендинги · студия «Лист»", color: "--p-sites", lead: "К", tasks: 8,
    items: [
      { start: 0,  end: 2,  l: "Прототип" },
      { start: 2,  end: 4,  l: "Дизайн" },
      { start: 4,  end: 6,  l: "Вёрстка и тесты" },
    ],
  },
  {
    proj: "Telegram-боты · roadmap", color: "--p-bots", lead: "К", tasks: 6,
    items: [
      { start: 2,  end: 5,  l: "Бот №3 — голос → задача" },
      { start: 6,  end: 10, l: "Бот №4 — отчёты по неделе" },
    ],
  },
  {
    proj: "Дом · ремонт спальни", color: "--p-home", lead: "К+Аня", tasks: 14,
    items: [
      { start: 3,  end: 4,  l: "Замеры, дизайн-проект" },
      { start: 5,  end: 9,  l: "Ремонт", dep: 0 },
      { start: 9,  end: 10, l: "Заехать", milestone: true },
    ],
  },
];

function GanttScreen() {
  const cellW = 64;
  const rowH = 56;
  const labelW = 240;
  const totalW = GANTT_FLAT_WEEKS.length * cellW;
  const NOW_IDX = 1; // we're early in week of May 25

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Гантт" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="планирование · недели"
          title="План на квартал"
          sub="6 дорожек · 22 задачи · 7 вех"
          right={<>
            <Tabs items={["День", "Неделя", "Месяц", "Квартал"]} active="Неделя" />
            <Button variant="ghost" size="sm" icon="filter">Фильтры</Button>
            <Button variant="secondary" size="sm" icon="plus">Веха</Button>
          </>}
        />

        {/* legend bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 24px", borderBottom: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-3)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 8, borderRadius: 3, background: "color-mix(in oklab, var(--p-openresto) 50%, transparent)" }} />
            длительность
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, transform: "rotate(45deg)", background: "var(--text-2)" }} />
            веха / дедлайн
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 1, background: "var(--text-muted)" }} />
            зависимость
          </span>
          <span style={{ flex: 1 }} />
          <span>сегодня · 21 мая 2026</span>
        </div>

        <div className="ws-scroll" style={{ flex: 1, overflow: "auto" }}>
          <div style={{ minWidth: labelW + totalW, position: "relative" }}>
            {/* Sticky header (month + week) */}
            <div style={{ display: "grid", gridTemplateColumns: `${labelW}px 1fr`, borderBottom: "1px solid var(--border-subtle)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 4 }}>
              <div style={{ padding: "10px 16px", borderRight: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Дорожки</div>
              <div style={{ position: "relative", height: 50, width: totalW }}>
                {/* month bands */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
                  {GANTT_WEEKS.map((m) => (
                    <div key={m.l} style={{
                      width: m.w.length * cellW,
                      padding: "6px 10px",
                      fontSize: 11, color: "var(--text-2)", fontWeight: 500,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      borderRight: "1px solid var(--border-subtle)",
                    }}>{m.l}</div>
                  ))}
                </div>
                {/* week numbers */}
                <div style={{ display: "flex" }}>
                  {GANTT_FLAT_WEEKS.map((w, i) => (
                    <div key={i} style={{
                      width: cellW,
                      padding: "6px 0",
                      fontSize: 11, color: i === NOW_IDX ? "var(--text)" : "var(--text-3)",
                      fontFamily: "var(--font-mono)", textAlign: "center",
                      borderRight: "1px solid var(--border-subtle)",
                      background: i === NOW_IDX ? "color-mix(in oklab, var(--danger) 8%, transparent)" : "transparent",
                    }}>{w.d}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            {GANTT_ROWS.map((row, ri) => (
              <div key={row.proj} style={{
                display: "grid",
                gridTemplateColumns: `${labelW}px 1fr`,
                borderBottom: "1px solid var(--border-subtle)",
                background: ri % 2 ? "color-mix(in oklab, var(--bg-elev-1) 30%, transparent)" : "transparent",
              }}>
                {/* row label */}
                <div style={{
                  padding: "10px 16px",
                  borderRight: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", gap: 10,
                  position: "sticky", left: 0,
                  background: ri % 2 ? "color-mix(in oklab, var(--bg-elev-1) 80%, var(--bg))" : "var(--bg)",
                  zIndex: 2,
                  borderLeft: `2px solid var(${row.color})`,
                }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{row.proj}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{row.tasks} задач · {row.lead}</span>
                  </div>
                </div>

                {/* row timeline */}
                <div style={{ position: "relative", height: rowH, width: totalW }}>
                  {/* vertical grid */}
                  {GANTT_FLAT_WEEKS.map((w, i) => (
                    <div key={i} style={{
                      position: "absolute", top: 0, bottom: 0, left: i * cellW, width: cellW,
                      borderRight: w.monthStart && i > 0 ? "1px solid var(--border)" : "1px solid var(--border-subtle)",
                      background: i === NOW_IDX ? "color-mix(in oklab, var(--danger) 5%, transparent)" : "transparent",
                    }} />
                  ))}

                  {/* bars */}
                  {row.items.map((it, ii) => {
                    const left = it.start * cellW + 4;
                    const width = (it.end - it.start) * cellW - 8;
                    if (it.milestone) {
                      return (
                        <div key={ii} style={{
                          position: "absolute",
                          top: rowH / 2 - 7,
                          left: it.start * cellW - 7,
                          width: 14, height: 14,
                          transform: "rotate(45deg)",
                          background: `var(${row.color})`,
                          border: "2px solid var(--bg)",
                        }} title={it.l} />
                      );
                    }
                    return (
                      <div key={ii} style={{
                        position: "absolute",
                        top: rowH / 2 - 12,
                        left, width: Math.max(width, 28), height: 24,
                        background: `color-mix(in oklab, var(${row.color}) 28%, transparent)`,
                        borderLeft: `3px solid var(${row.color})`,
                        borderRadius: "0 6px 6px 0",
                        display: "flex", alignItems: "center",
                        padding: "0 8px",
                        fontSize: 11, color: "var(--text)",
                        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      }}>{it.l}</div>
                    );
                  })}

                  {/* dependency lines (simple connector for items with `dep`) */}
                  {row.items.map((it, ii) => {
                    if (it.dep == null) return null;
                    const fromItem = row.items[it.dep];
                    const x1 = fromItem.end * cellW - 4;
                    const x2 = it.start * cellW + 4;
                    return (
                      <svg key={"d" + ii} style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: totalW, height: rowH,
                        pointerEvents: "none",
                        overflow: "visible",
                      }}>
                        <path
                          d={`M ${x1} ${rowH / 2} L ${(x1 + x2) / 2} ${rowH / 2} L ${(x1 + x2) / 2} ${rowH / 2} L ${x2 - 4} ${rowH / 2}`}
                          stroke="var(--text-muted)" strokeDasharray="3 3" fill="none" strokeWidth="1"
                        />
                        <path
                          d={`M ${x2 - 4} ${rowH / 2 - 3} L ${x2} ${rowH / 2} L ${x2 - 4} ${rowH / 2 + 3}`}
                          fill="var(--text-muted)"
                        />
                      </svg>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* now line absolutely positioned across all rows */}
            <div style={{
              position: "absolute",
              top: 50,
              left: labelW + NOW_IDX * cellW,
              bottom: 0, width: 0,
              borderLeft: "1.5px solid var(--danger)",
              pointerEvents: "none",
              zIndex: 3,
            }}>
              <span style={{
                position: "absolute", top: -22, left: -28,
                fontSize: 10, color: "var(--danger)",
                fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                background: "var(--bg-elev-1)", padding: "1px 6px",
                border: "1px solid color-mix(in oklab, var(--danger) 40%, transparent)",
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}>21 МАЯ</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.GanttScreen = GanttScreen;
