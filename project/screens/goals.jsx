/* Цели и привычки */

const YEAR_GOALS = [
  {
    title: "Выйти в стабильный доход 200 000 ₽ / мес",
    cat: "Финансы", color: "--p-diploma", progress: 62,
    kr: [
      { l: "Закрыть сезон дипломов · 6 работ", p: 67 },
      { l: "Запустить 2 новых лендинга",        p: 50 },
      { l: "Бот-конструктор для постоянных",   p: 30 },
    ],
  },
  {
    title: "Запустить OpenResto в проде",
    cat: "Работа", color: "--p-openresto", progress: 68,
    kr: [
      { l: "MVP · до конца июня",  p: 75 },
      { l: "Первые 3 ресторана",   p: 40 },
    ],
  },
  {
    title: "Сделать предложение Ане",
    cat: "Личное", color: "--p-girl", progress: 40,
    kr: [
      { l: "Купить кольцо",           p: 0  },
      { l: "Поездка в Грузию (план)", p: 25 },
      { l: "Договориться с её папой", p: 100 },
    ],
  },
  {
    title: "Прочитать 24 книги за год",
    cat: "Развитие", color: "--p-health", progress: 50,
    kr: [
      { l: "11 / 24 · сейчас Atomic Habits", p: 45 },
    ],
  },
  {
    title: "Спорт 4 раза в неделю",
    cat: "Здоровье", color: "--p-family", progress: 78,
    kr: [
      { l: "Среднее 3.1 / 4 за квартал", p: 78 },
    ],
  },
];

const MONTH_GOALS = [
  { l: "Сдать диплом Анны",       proj: "--p-diploma",   progress: 80, due: "28 мая" },
  { l: "Закрыть Sprint 7 (OpenResto)", proj: "--p-openresto", progress: 68, due: "23 мая" },
  { l: "Запустить лендинг студии «Лист»", proj: "--p-sites", progress: 25, due: "31 мая" },
  { l: "Дочитать Atomic Habits",  proj: "--p-health",    progress: 60, due: "конец месяца" },
  { l: "Оплатить ОСАГО",          proj: "--p-car",       progress: 0,  due: "27 мая", urgent: true },
];

const WEEK_GOALS = [
  { l: "3 фокус-блока по OpenResto", done: 2, total: 3 },
  { l: "1 свидание с Аней",          done: 1, total: 1 },
  { l: "Дневник каждый день",        done: 3, total: 3 },
  { l: "Спортзал × 3",                done: 1, total: 3 },
];

/* habit data: 12 weeks × 7 days, value 0..1 (0 = miss, 1 = done) */
function makeHabitData(seed) {
  const weeks = 18;
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const k = (seed * 53 + w * 11 + d * 7) % 11;
      row.push(k > 2 ? 1 : 0);
    }
    out.push(row);
  }
  return out;
}

const HABITS_TRACKER = [
  { name: "Сон 7+ ч",     cat: "Здоровье",   color: "--p-health",    streak: 12, total: 142, seed: 3 },
  { name: "Спортзал",      cat: "Здоровье",   color: "--p-family",     streak: 4,  total: 56,  seed: 7 },
  { name: "Без сахара",    cat: "Здоровье",   color: "--p-diploma",   streak: 6,  total: 38,  seed: 5 },
  { name: "Английский 15м", cat: "Обучение", color: "--p-sites",      streak: 28, total: 134, seed: 1 },
  { name: "Книга 20м",      cat: "Обучение", color: "--p-openresto", streak: 9,  total: 87,  seed: 9 },
  { name: "Дневник",        cat: "Развитие", color: "--p-girl",       streak: 28, total: 198, seed: 2 },
  { name: "Звонок родителям", cat: "Отношения", color: "--p-family", streak: 1,  total: 31,  seed: 8 },
  { name: "Без соцсетей до 12", cat: "Работа", color: "--p-youmin", streak: 3,  total: 64,  seed: 4 },
];

function HabitRow({ h }) {
  const data = React.useMemo(() => makeHabitData(h.seed), [h.seed]);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 1fr 90px 80px",
      gap: 16, alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--text)" }}>{h.name}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{h.cat}</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {data.map((wk, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateRows: "repeat(7, 10px)", rowGap: 2 }}>
            {wk.map((v, di) => (
              <div key={di} style={{
                width: 14, borderRadius: 2,
                background: v
                  ? `color-mix(in oklab, var(${h.color}) ${40 + di * 6}%, transparent)`
                  : "var(--bg-elev-3)",
              }} />
            ))}
          </div>
        ))}
      </div>
      <span style={{
        fontSize: 13, color: "var(--text)",
        fontFamily: "var(--font-mono)", fontWeight: 500,
        display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end",
      }}>
        <Icon name="zap" size={12} style={{ color: `var(${h.color})` }} />
        {h.streak}д
      </span>
      <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)", textAlign: "right" }}>
        {h.total} всего
      </span>
    </div>
  );
}

function GoalCard({ g }) {
  return (
    <div style={{
      padding: "16px 18px",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 12,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: `var(${g.color})`,
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 10, color: `var(${g.color})`,
          letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500,
        }}>{g.cat}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{g.progress}%</span>
      </div>

      <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500, lineHeight: 1.3 }}>{g.title}</span>

      <Progress value={g.progress} color={`var(${g.color})`} height={3} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {g.kr.map((k, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 12, color: "var(--text-2)" }}>{k.l}</span>
            <div style={{ width: 60 }}>
              <Progress value={k.p} color={`color-mix(in oklab, var(${g.color}) 60%, var(--text-3))`} height={2} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", minWidth: 28, textAlign: "right" }}>{k.p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Цели и привычки" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="2026 · долгосрочный план"
          title="Цели и привычки"
          sub="5 годовых · 5 на месяц · стрик 28 дней"
          right={<>
            <Tabs items={["Год", "Месяц", "Неделя"]} active="Год" />
            <Button variant="ghost" size="sm" icon="trending_up">Отчёт</Button>
            <Button variant="secondary" size="sm" icon="plus">Цель</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* annual goals */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                Годовые цели · 2026
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>среднее 60% · день 141 / 365</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {YEAR_GOALS.map((g) => <GoalCard key={g.title} g={g} />)}
            </div>
          </div>

          {/* month + week */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Цели на май</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>осталось 10 дней</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                {MONTH_GOALS.map((m, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "8px 1fr 1fr 100px",
                    alignItems: "center", gap: 14,
                    padding: "12px 18px",
                    borderBottom: i === MONTH_GOALS.length - 1 ? "none" : "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${m.proj})` }} />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{m.l}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}><Progress value={m.progress} color={`var(${m.proj})`} height={3} /></div>
                      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", minWidth: 32, textAlign: "right" }}>{m.progress}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: m.urgent ? "var(--danger)" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>{m.due}</span>
                      {m.urgent && <Badge tone="danger" dot>срочно</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "14px 18px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Эта неделя</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>среда из недели 21</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {WEEK_GOALS.map((w, i) => {
                  const pct = (w.done / w.total) * 100;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 10px",
                      borderRadius: 8,
                      background: pct === 100 ? "color-mix(in oklab, var(--success) 8%, transparent)" : "transparent",
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 6,
                        background: pct === 100 ? "var(--success)" : "var(--bg-elev-2)",
                        border: `1.5px solid ${pct === 100 ? "var(--success)" : "var(--border-strong)"}`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flex: "none",
                      }}>
                        {pct === 100 && <Icon name="check" size={12} stroke={2.5} style={{ color: "var(--bg)" }} />}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{w.l}</span>
                      <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{w.done}/{w.total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* habit tracker */}
          <div style={{
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "18px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>Привычки</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>8 ежедневных · последние 18 недель</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
                  мало
                  {[1, 2, 3, 4].map((v) => (
                    <span key={v} style={{
                      width: 12, height: 12, borderRadius: 2,
                      background: `color-mix(in oklab, var(--p-health) ${v * 22}%, transparent)`,
                    }} />
                  ))}
                  стабильно
                </span>
                <Tabs items={["18 нед", "Год", "Всё"]} active="18 нед" />
              </div>
            </div>

            {/* week labels along the top */}
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px 80px", gap: 16, paddingBottom: 8 }}>
              <span />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>янв</span><span>фев</span><span>мар</span><span>апр</span><span>май</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", letterSpacing: "0.04em", textTransform: "uppercase" }}>стрик</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", letterSpacing: "0.04em", textTransform: "uppercase" }}>всего</span>
            </div>

            {HABITS_TRACKER.map((h) => <HabitRow key={h.name} h={h} />)}
          </div>
        </div>
      </main>
    </div>
  );
}

window.GoalsScreen = GoalsScreen;
