/* Personal module — Дом и подписки */

const SUBS = [
  { name: "ЖКХ Ватутинки",       cat: "Дом",         amt: 8_240,  next: "5 июня",    icon: "home",   color: "--p-home", note: "по счётчикам" },
  { name: "Интернет — Билайн",    cat: "Дом",         amt: 700,    next: "8 июня",    icon: "globe",  color: "--p-home" },
  { name: "iCloud 200 ГБ",        cat: "Облако",      amt: 199,    next: "12 июня",   icon: "globe",  color: "--p-sites" },
  { name: "Domain · nexora.dev", cat: "Работа",    amt: 990,    next: "14 июня",   icon: "globe",  color: "--p-openresto", yearly: true },
  { name: "Хостинг · Hetzner",    cat: "Работа",      amt: 540,    next: "20 июня",   icon: "globe",  color: "--p-openresto" },
  { name: "Spotify Family",       cat: "Развлечения", amt: 599,    next: "21 июня",   icon: "music",  color: "--p-girl" },
  { name: "Cursor Pro",           cat: "Работа",      amt: 2_000,  next: "23 июня",   icon: "edit",   color: "--p-openresto" },
  { name: "Кинопоиск Премиум",    cat: "Развлечения", amt: 399,    next: "1 июля",    icon: "video",  color: "--p-girl" },
  { name: "ChatGPT Plus",         cat: "Работа",      amt: 2_000,  next: "4 июля",    icon: "zap",    color: "--p-bots" },
  { name: "Notion AI",            cat: "Работа",      amt: 800,    next: "10 июля",   icon: "note",   color: "--p-sites" },
];

const UTILS_HISTORY = [
  { m: "май",  val: 8_240, paid: false },
  { m: "апр",  val: 8_120, paid: true },
  { m: "мар",  val: 9_640, paid: true },
  { m: "фев",  val: 10_240, paid: true },
  { m: "янв",  val: 11_080, paid: true },
  { m: "дек",  val: 12_400, paid: true },
];

const WARRANTIES = [
  { d: "Холодильник Bosch",      buy: "08.2024", until: "08.2026", icon: "battery" },
  { d: "MacBook Pro 14 M3",       buy: "11.2023", until: "11.2026", icon: "command" },
  { d: "Робот-пылесос Roborock",  buy: "02.2025", until: "02.2027", icon: "zap" },
  { d: "Кофемашина De'Longhi",    buy: "06.2024", until: "06.2026", icon: "drop" },
];

function HomeModule() {
  const monthlyTotal = SUBS.filter((s) => !s.yearly).reduce((sum, s) => sum + s.amt, 0);
  const yearlyTotal = SUBS.filter((s) => s.yearly).reduce((sum, s) => sum + s.amt, 0);

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Дом" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--p-home)" }} />
            Дом и подписки
          </span>}
          sub="Ватутинки, ул. Цветочная 12, кв 47 · 54 м²"
          right={<>
            <Button variant="ghost" size="sm" icon="paperclip">Чеки</Button>
            <Button variant="secondary" size="sm" icon="plus">Подписка</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* hero stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <MetricCard label="Подписки в месяц"  value={monthlyTotal.toLocaleString("ru-RU")} unit="₽" trend={{ dir: "up", value: "+2 новых" }} />
            <MetricCard label="ЖКХ в мае"          value="8 240"  unit="₽" trend={{ dir: "up", value: "+1.5%" }} />
            <MetricCard label="Год · домен и хост" value={yearlyTotal.toLocaleString("ru-RU")} unit="₽" />
            <MetricCard label="Гарантий активно"   value={WARRANTIES.length.toString()} sparkline="0,16 20,14 40,12 60,14 80,10 100,8 120,6" />
          </div>

          {/* two cols */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Subscriptions */}
            <div style={{
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Подписки и регулярные платежи</span>
                <Tabs items={["Все", "Дом", "Работа", "Развлечения"]} active="Все" />
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "22px 1.8fr 1fr 1fr 22px",
                padding: "8px 18px",
                fontSize: 11, color: "var(--text-3)",
                letterSpacing: "0.04em", textTransform: "uppercase",
                borderTop: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-elev-2)",
              }}>
                <span />
                <span>Сервис</span>
                <span style={{ textAlign: "right" }}>Сумма</span>
                <span>Следующее списание</span>
                <span />
              </div>
              {SUBS.map((s) => (
                <div key={s.name} style={{
                  display: "grid",
                  gridTemplateColumns: "22px 1.8fr 1fr 1fr 22px",
                  padding: "10px 18px",
                  gap: 0,
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontSize: 13,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: `color-mix(in oklab, var(${s.color}) 14%, transparent)`,
                    color: `var(${s.color})`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={s.icon} size={12} />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 12 }}>
                    <span style={{ color: "var(--text)" }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.cat}{s.note ? ` · ${s.note}` : ""}</span>
                  </div>
                  <span style={{
                    textAlign: "right", fontFamily: "var(--font-mono)",
                    color: "var(--text)",
                  }}>
                    {s.amt.toLocaleString("ru-RU")} ₽
                    <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 4 }}>/{s.yearly ? "г" : "мес"}</span>
                  </span>
                  <span style={{
                    fontSize: 12, color: "var(--text-2)",
                    fontFamily: "var(--font-mono)",
                  }}>{s.next}</span>
                  <IconButton icon="more" size="sm" />
                </div>
              ))}
            </div>

            {/* Utilities + wifi */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* ЖКХ */}
              <div style={{
                padding: "14px 18px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Коммуналка</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>последние 6 месяцев</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                  {[...UTILS_HISTORY].reverse().map((u, i, arr) => {
                    const maxV = Math.max(...arr.map((x) => x.val));
                    const h = (u.val / maxV) * 90;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                          {(u.val / 1000).toFixed(1)}к
                        </span>
                        <div style={{
                          width: "100%",
                          height: h,
                          background: u.paid
                            ? "color-mix(in oklab, var(--p-home) 24%, transparent)"
                            : "var(--p-home)",
                          borderRadius: 4,
                          border: u.paid ? "1px solid color-mix(in oklab, var(--p-home) 40%, transparent)" : "none",
                        }} />
                        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{u.m}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>
                  <Badge tone="warn" dot>8 240 ₽ · к оплате до 25 мая</Badge>
                  <span style={{ flex: 1 }} />
                  <Button variant="secondary" size="sm" icon="check">Оплатил</Button>
                </div>
              </div>

              {/* wifi & passwords */}
              <div style={{
                padding: "14px 18px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Сеть и доступы</span>
                  <Icon name="lock" size={13} style={{ color: "var(--text-3)" }} />
                </div>

                {[
                  { l: "Wi-Fi · домашний",  v: "KIR-home / 2.4 + 5",  mono: true },
                  { l: "Wi-Fi · для гостей", v: "KIR-guest / parol-12345", mono: true },
                  { l: "Роутер · админка", v: "192.168.1.1 / admin / *****" },
                ].map((w) => (
                  <div key={w.l} style={{
                    padding: "10px 12px",
                    background: "var(--bg-elev-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    display: "flex", flexDirection: "column", gap: 4,
                  }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{w.l}</span>
                    <span style={{
                      fontSize: 13, color: "var(--text)",
                      fontFamily: w.mono ? "var(--font-mono)" : "inherit",
                    }}>{w.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* warranties */}
          <div style={{
            padding: "14px 18px",
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Гарантии на технику</span>
              <Button variant="ghost" size="sm" icon="plus">Добавить</Button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {WARRANTIES.map((w) => (
                <div key={w.d} style={{
                  padding: "12px 14px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: "color-mix(in oklab, var(--p-home) 14%, transparent)",
                      color: "var(--p-home)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name={w.icon} size={15} />
                    </span>
                    <Badge tone="success" dot>чек есть</Badge>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{w.d}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      куплено {w.buy} · до {w.until}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.HomeModule = HomeModule;
