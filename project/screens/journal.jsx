/* Daily Journal — фокус на трекинге настроения и регулярности */

function MoodHeatmap() {
  // 14 weeks × 7 days. Each cell intensity 0..3, hue depends on score.
  const weeks = 14;
  const scores = [];
  // deterministic pseudo-data
  for (let w = 0; w < weeks; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const seed = (w * 7 + d) * 37;
      const v = ((seed % 11) > 8) ? 0 : ((seed % 5) + 1);
      row.push(v);
    }
    scores.push(row);
  }

  const monthLabels = ["фев", "", "март", "", "", "апр", "", "", "май", "", "", "", "", ""];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>Последние 14 недель</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
          плохо
          {[0, 1, 2, 3, 4].map((v) => (
            <div key={v} style={{
              width: 12, height: 12, borderRadius: 3,
              background: v === 0 ? "var(--bg-elev-3)" : `color-mix(in oklab, var(--p-health) ${20 + v * 20}%, transparent)`,
            }} />
          ))}
          хорошо
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {/* day labels column */}
        <div style={{ display: "grid", gridTemplateRows: "repeat(7, 14px)", rowGap: 3, paddingTop: 2 }}>
          {["", "вт", "", "чт", "", "сб", ""].map((d, i) => (
            <span key={i} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: "14px" }}>{d}</span>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks}, 1fr)`, gap: 4 }}>
            {monthLabels.map((m, i) => (
              <span key={i} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{m}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks}, 1fr)`, gap: 4 }}>
            {Array.from({ length: weeks }).map((_, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateRows: "repeat(7, 14px)", rowGap: 3 }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const v = scores[wi][di];
                  const isToday = wi === weeks - 1 && di === 2;
                  return (
                    <div key={di} style={{
                      width: "100%", borderRadius: 3,
                      background: v === 0 ? "var(--bg-elev-3)" : `color-mix(in oklab, var(--p-health) ${20 + v * 20}%, transparent)`,
                      outline: isToday ? "1.5px solid var(--text)" : "none",
                      outlineOffset: 1,
                    }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Дневник" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="личное · среда 21 мая"
          title="Дневник"
          sub="запись на сегодня · стрик 28 дн"
          right={<>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 6 }}>
              <IconButton icon="chevron_left" />
              <Button variant="ghost" size="sm">Сегодня</Button>
              <IconButton icon="chevron_right" />
            </div>
            <Button variant="secondary" size="sm" icon="bookmark">Шаблон</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, minHeight: "100%" }}>

            {/* main entry column */}
            <div style={{ padding: "24px 36px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
              {/* heatmap */}
              <div style={{
                padding: "18px 20px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
              }}>
                <MoodHeatmap />
              </div>

              {/* date header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{
                  fontSize: 64, fontWeight: 500, color: "var(--text)",
                  fontFamily: "var(--font-mono)", letterSpacing: "-0.04em", lineHeight: 1,
                }}>21</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 18, color: "var(--text)", fontWeight: 500 }}>мая · среда</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>день 141 / 365 · 224 осталось</span>
                </div>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>обновлено в 11:42</span>
              </div>

              {/* mood + energy quick set */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}>
                <div style={{
                  padding: "14px 16px",
                  background: "var(--bg-elev-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Настроение</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} style={{
                        flex: 1, height: 32, borderRadius: 6,
                        background: n === 4 ? "color-mix(in oklab, var(--p-health) 22%, transparent)" : "var(--bg-elev-2)",
                        border: `1px solid ${n === 4 ? "color-mix(in oklab, var(--p-health) 50%, transparent)" : "var(--border-subtle)"}`,
                        color: n === 4 ? "var(--p-health)" : "var(--text-3)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="smile" size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: "14px 16px",
                  background: "var(--bg-elev-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Энергия</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{
                        flex: 1, height: 32, borderRadius: 6,
                        background: n <= 4 ? "var(--p-health)" : "var(--bg-elev-3)",
                        opacity: n <= 4 ? (0.4 + n * 0.15) : 1,
                      }} />
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: "14px 16px",
                  background: "var(--bg-elev-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Сон</span>
                  <span style={{ fontSize: 22, fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)" }}>7:20</span>
                </div>
              </div>

              {/* sections */}
              {[
                { l: "Как день", txt: "Утро ровное. Встал в 7:40, сразу кофе и 20 минут с книгой — глава про habits as compounded interest. В голове крутится миграция меню — кажется, наконец сложилось." },
                { l: "Что сделал", txt: "Закрыл миграцию меню на staging — чек-суммы по La Maree сошлись. Созвонился с Анной по диплому, согласовали правки введения. Прогулка с Аней в парке Горького, поели гёзу.", list: true },
                { l: "Благодарности", txt: "Аня — за то, что помнит про мою книгу и не отвлекает по утрам. Дима из СТО — что взял Tucson вне очереди. Тёплая погода после дождливой недели.", list: true },
              ].map((s) => (
                <section key={s.l} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--text-2)", letterSpacing: "-0.005em" }}>{s.l}</h2>
                  <div style={{
                    padding: "14px 16px",
                    background: "var(--bg-elev-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    fontSize: 15, color: "var(--text)", lineHeight: 1.7,
                  }}>
                    {s.txt}
                  </div>
                </section>
              ))}

              {/* что завтра — checklist */}
              <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--text-2)" }}>Что завтра</h2>
                <div style={{
                  padding: "14px 16px",
                  background: "var(--bg-elev-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  {[
                    { t: "Доделать миграцию меню — выкатить на prod", p: 1 },
                    { t: "Дописать главу 2 диплома Анны",              p: 2 },
                    { t: "Оплатить ОСАГО — срочно",                    p: 1 },
                    { t: "Спортзал в обед",                            p: 3 },
                  ].map((t, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                      <Checkbox priority={t.p} />
                      {t.t}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* right side stats */}
            <aside style={{
              borderLeft: "1px solid var(--border-subtle)",
              padding: "24px 22px",
              display: "flex", flexDirection: "column", gap: 18,
              background: "color-mix(in oklab, var(--bg-elev-1) 50%, var(--bg))",
            }}>
              {/* streak */}
              <div style={{
                padding: "18px 18px",
                background: `color-mix(in oklab, var(--p-health) 12%, var(--bg-elev-1))`,
                border: `1px solid color-mix(in oklab, var(--p-health) 28%, var(--border-subtle))`,
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <span style={{ fontSize: 11, color: "var(--p-health)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Стрик</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>28</span>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>дней подряд</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>лучший — 41 день, январь</span>
              </div>

              {/* week stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>За эту неделю</span>
                {[
                  { l: "среднее настроение", v: "4.0 / 5", trend: "+0.3" },
                  { l: "средняя энергия",    v: "3.8 / 5", trend: "+0.1" },
                  { l: "сон в среднем",       v: "7:15",    trend: "−0:10" },
                  { l: "тренировок",          v: "3 / 4",   trend: "" },
                ].map((s) => (
                  <div key={s.l} style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.l}</span>
                    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s.v}</span>
                      {s.trend && <span style={{ fontSize: 11, color: s.trend.startsWith("+") ? "var(--success)" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>{s.trend}</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* patterns */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Паттерны</span>
                {[
                  { i: "smile",  t: "В среду настроение в среднем выше на 0.5" },
                  { i: "battery", t: "После 6 ч сна энергия падает на 30%" },
                  { i: "heart",   t: "В дни с прогулкой настроение +0.7" },
                ].map((p) => (
                  <div key={p.t} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px",
                    background: "var(--bg-elev-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                  }}>
                    <Icon name={p.i} size={14} style={{ color: "var(--text-3)", marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{p.t}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

window.JournalScreen = JournalScreen;
