/* Personal module — Машина */

function CountdownTile({ label, date, daysLeft, urgent, sub }) {
  return (
    <div style={{
      padding: "14px 16px",
      background: urgent ? `color-mix(in oklab, var(--danger) 10%, var(--bg-elev-1))` : "var(--bg-elev-1)",
      border: `1px solid ${urgent ? "color-mix(in oklab, var(--danger) 30%, var(--border))" : "var(--border-subtle)"}`,
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontSize: 24, fontWeight: 500, color: urgent ? "var(--danger)" : "var(--text)",
          fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
        }}>{daysLeft}</span>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>дней</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{date}</span>
        {sub && <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{sub}</span>}
      </div>
    </div>
  );
}

const CAR_SERVICE = [
  { date: "12.04.2026", km: 89_410, what: "Замена масла, фильтра", cost: 6_500, where: "СТО Молот" },
  { date: "20.10.2025", km: 81_900, what: "Шиномонтаж · зима",     cost: 3_200, where: "СТО Молот" },
  { date: "08.08.2025", km: 76_200, what: "Тормозные колодки перед", cost: 11_800, where: "СТО Молот" },
  { date: "14.05.2025", km: 70_100, what: "ТО-70 + диагностика",    cost: 18_200, where: "Дилер" },
];

function CarModule() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Машина" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--p-car)" }} />
            Машина
          </span>}
          sub="Hyundai Tucson 2019 · М 245 ОН 77"
          right={<>
            <Button variant="ghost" size="sm" icon="paperclip">Сканы документов</Button>
            <Button variant="secondary" size="sm" icon="plus">Запись в журнал</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* hero */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{
              padding: "22px 24px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "grid", gridTemplateColumns: "1fr 200px",
              gap: 24, alignItems: "center",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="car" size={16} style={{ color: "var(--p-car)" }} />
                  <span style={{ fontSize: 11, color: "var(--p-car)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>в порядке</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  Hyundai Tucson, 2019
                </h2>
                <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--text-3)" }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>М 245 ОН 77</span>
                  <span>2.0 бензин · АКПП</span>
                  <span>в семье 4 года</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>пробег</span>
                  <span style={{
                    fontSize: 22, fontWeight: 500, color: "var(--text)",
                    fontFamily: "var(--font-mono)", letterSpacing: "-0.01em",
                  }}>91 240</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>км · +830 за месяц</span>
                </div>
              </div>

              {/* placeholder for car shot */}
              <div style={{
                aspectRatio: "16/10",
                background: "repeating-linear-gradient(135deg, var(--bg-elev-2) 0 6px, var(--bg-elev-3) 6px 12px)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
              }}>фото авто</div>
            </div>

            {/* docs scan tile */}
            <div style={{
              padding: "16px 18px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Документы</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>сканы</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["СТС", "ПТС", "ОСАГО", "КАСКО", "В/У", "Доверенность"].map((d) => (
                  <div key={d} style={{
                    aspectRatio: "1",
                    background: "var(--bg-elev-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6,
                    color: "var(--text-3)",
                    fontSize: 11,
                  }}>
                    <Icon name="file" size={18} />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* countdowns */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Сроки</span>
              <span style={{ fontSize: 11, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>1 срочно</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <CountdownTile label="ОСАГО"      date="до 27 мая 2026"   daysLeft={6}   urgent sub="14 240 ₽" />
              <CountdownTile label="КАСКО"      date="до 18 сентября"   daysLeft={120}        sub="48 600 ₽" />
              <CountdownTile label="Техосмотр"  date="до 12 декабря"    daysLeft={205}        sub="—" />
              <CountdownTile label="Следующее ТО" date="на 95 000 км"  daysLeft={45}         sub="через 3 760 км" />
            </div>
          </div>

          {/* two cols: service log + fuel */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            {/* service log */}
            <div style={{
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
            }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Журнал ТО</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>за 12 месяцев · 39 700 ₽</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                {CAR_SERVICE.map((s, i) => (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "92px 1fr 80px 80px",
                    padding: "12px 18px",
                    gap: 12,
                    borderBottom: i === CAR_SERVICE.length - 1 ? "none" : "1px solid var(--border-subtle)",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{s.date}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{s.what}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.where}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-3)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {s.km.toLocaleString("ru-RU")} км
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {s.cost.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* fuel chart */}
              <div style={{
                padding: "14px 18px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Расход топлива</span>
                  <span style={{
                    fontSize: 16, color: "var(--text)",
                    fontFamily: "var(--font-mono)", fontWeight: 500,
                  }}>9.2 <span style={{ fontSize: 11, color: "var(--text-3)" }}>л / 100 км</span></span>
                </div>
                <svg viewBox="0 0 300 80" width="100%" height="80" style={{ display: "block" }} preserveAspectRatio="none">
                  <polyline
                    points="0,40 25,38 50,42 75,50 100,46 125,52 150,44 175,40 200,38 225,42 250,36 275,32 300,30"
                    fill="none" stroke="var(--p-car)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <polyline
                    points="0,40 25,38 50,42 75,50 100,46 125,52 150,44 175,40 200,38 225,42 250,36 275,32 300,30 300,80 0,80"
                    fill="color-mix(in oklab, var(--p-car) 16%, transparent)" stroke="none"
                  />
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  <span>янв</span><span>фев</span><span>мар</span><span>апр</span><span>май</span>
                </div>
              </div>

              {/* СТО contact */}
              <div style={{
                padding: "14px 18px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Avatar initials="ДМ" color="var(--p-car)" size={36} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>СТО «Молот» — Дмитрий</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>+7 916 111 22 33</span>
                  </div>
                  <Badge tone="success" dot>проверенный</Badge>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button variant="secondary" size="sm" icon="phone">Позвонить</Button>
                  <Button variant="ghost" size="sm" icon="calendar">Записаться</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.CarModule = CarModule;
window.CountdownTile = CountdownTile;
