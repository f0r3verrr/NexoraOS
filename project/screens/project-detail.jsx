/* Project detail — страница проекта (Дипломы и курсовые) с табами */

const ORDERS = [
  { client: "Анна С.",     work: "Диплом · экономика",       price: 30000, paid: 15000, due: "28 мая",  status: "В работе" },
  { client: "Илья К.",     work: "Курсовая · маркетинг",     price: 8000,  paid: 4000,  due: "3 июня",  status: "В работе" },
  { client: "Лиза М.",     work: "Реферат · социология",     price: 3500,  paid: 3500,  due: "сдано",   status: "Оплачен" },
  { client: "Андрей Д.",   work: "ВКР · информатика",        price: 45000, paid: 22500, due: "12 июня", status: "В работе" },
  { client: "Катя Р.",     work: "Эссе · философия",         price: 2500,  paid: 0,     due: "новый",   status: "Новый" },
  { client: "Игорь Т.",    work: "Магистерская · IT",        price: 60000, paid: 60000, due: "сдан",    status: "Готов" },
];

const STATUS_TONE = {
  "Новый":    "info",
  "В работе": "warn",
  "Готов":    "success",
  "Сдан":     "success",
  "Оплачен":  "success",
};

function ProjectDetailScreen() {
  const total = ORDERS.reduce((s, o) => s + o.price, 0);
  const paid  = ORDERS.reduce((s, o) => s + o.paid, 0);
  const owed  = total - paid;

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Дипломы и курсовые" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="Подработки · проект"
          title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--p-diploma)" }} />
            Дипломы и курсовые
          </span>}
          sub="11 задач · 4 заказа активны · доход в мае 124 800 ₽"
          right={<>
            <Button variant="ghost" size="sm" icon="pin">Закреплено</Button>
            <Button variant="secondary" size="sm" icon="plus">Заказ</Button>
            <IconButton icon="more" />
          </>}
        />

        <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "0 24px", display: "flex", alignItems: "center", gap: 4 }}>
          {["Обзор", "Задачи", "Заметки", "Файлы", "Финансы", "Календарь"].map((t) => {
            const active = t === "Обзор";
            return (
              <button key={t} style={{
                padding: "12px 12px 14px",
                fontSize: 13, fontWeight: 500,
                color: active ? "var(--text)" : "var(--text-3)",
                borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                marginBottom: -1,
              }}>{t}</button>
            );
          })}
          <span style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" icon="filter">Фильтры</Button>
        </div>

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* hero */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 320px",
            gap: 16, marginBottom: 20,
          }}>
            <div style={{
              padding: "22px 24px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0, right: 0, height: 3,
                background: "var(--p-diploma)",
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text)" }}>
                    Сезон 2025-2026 · защиты в мае-июне
                  </h2>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>стартовал 14 марта · 68 дней</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 720 }}>
                  Подработка на дипломах и курсовых для студентов экономики и IT.
                  Основные клиенты — Анна (постоянный), новые через рекомендации.
                  Цель сезона — закрыть 6 работ, средний чек 25 000 ₽.
                </p>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar initials="К" color="var(--p-diploma)" size={28} />
                  <Avatar initials="А" color="var(--p-diploma)" size={28} />
                  <Avatar initials="ИК" color="var(--p-diploma)" size={28} />
                  <Avatar initials="+3" color="var(--text-3)" size={28} />
                  <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 4 }}>6 клиентов</span>
                </div>
              </div>
            </div>

            <div style={{
              padding: "18px 20px",
              background: `color-mix(in oklab, var(--p-diploma) 8%, var(--bg-elev-1))`,
              border: `1px solid color-mix(in oklab, var(--p-diploma) 30%, var(--border))`,
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <span style={{ fontSize: 11, color: "var(--p-diploma)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Прогресс сезона</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{
                  fontSize: 32, fontWeight: 500, color: "var(--text)",
                  fontFamily: "var(--font-mono)", letterSpacing: "-0.02em",
                }}>4 / 6</span>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>работ сдано</span>
              </div>
              <Progress value={67} color="var(--p-diploma)" height={4} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                <span>осталось 2 · 14 дней</span>
                <span>в плане сезона</span>
              </div>
            </div>
          </div>

          {/* metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <MetricCard label="Доход в мае" value="124 800" unit="₽" trend={{ dir: "up", value: "+18%" }} sparkline="0,24 15,20 30,16 45,18 60,12 75,10 90,8 105,6 120,4" />
            <MetricCard label="Ожидает оплаты" value={owed.toLocaleString("ru-RU")} unit="₽" sparkline="0,18 15,16 30,14 45,10 60,12 75,8 90,10 105,6 120,8" />
            <MetricCard label="Активных заказов" value="4" sparkline="0,12 15,14 30,10 45,8 60,12 75,10 90,6 105,8 120,4" />
            <MetricCard label="Средний чек" value="24 833" unit="₽" trend={{ dir: "up", value: "+12%" }} sparkline="0,14 15,12 30,16 45,10 60,8 75,12 90,6 105,4 120,8" />
          </div>

          {/* two columns: orders table + side widgets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
            {/* Orders table */}
            <div style={{
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Заказы</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Input placeholder="Поиск…" icon="search" size="sm" style={{ width: 200 }} />
                  <Button variant="ghost" size="sm" icon="filter">Статус</Button>
                </div>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 24px",
                padding: "8px 18px",
                fontSize: 11, color: "var(--text-3)",
                letterSpacing: "0.04em", textTransform: "uppercase",
                borderBottom: "1px solid var(--border-subtle)",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--bg-elev-2)",
              }}>
                <span>Клиент</span>
                <span>Работа</span>
                <span style={{ textAlign: "right" }}>Цена</span>
                <span style={{ textAlign: "right" }}>Аванс</span>
                <span style={{ textAlign: "right" }}>Остаток</span>
                <span>Дедлайн / статус</span>
                <span />
              </div>

              {ORDERS.map((o) => (
                <div key={o.client + o.work} style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 24px",
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border-subtle)",
                  alignItems: "center",
                  fontSize: 13,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={o.client.split(" ").map((w) => w[0]).join("").slice(0, 2)} color="var(--p-diploma)" size={24} />
                    <span style={{ color: "var(--text)" }}>{o.client}</span>
                  </div>
                  <span style={{ color: "var(--text)" }}>{o.work}</span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                    {o.price.toLocaleString("ru-RU")}
                  </span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                    {o.paid.toLocaleString("ru-RU")}
                  </span>
                  <span style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    color: o.price - o.paid > 0 ? "var(--warn)" : "var(--text-3)",
                  }}>
                    {(o.price - o.paid).toLocaleString("ru-RU")}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Badge tone={STATUS_TONE[o.status]} dot>{o.status}</Badge>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{o.due}</span>
                  </div>
                  <IconButton icon="more" size="sm" />
                </div>
              ))}

              <div style={{
                padding: "12px 18px",
                display: "grid",
                gridTemplateColumns: "1.2fr 1.6fr 0.9fr 0.9fr 0.9fr 0.9fr 24px",
                background: "var(--bg-elev-2)",
                fontSize: 12,
                color: "var(--text-3)",
                alignItems: "center",
              }}>
                <span>Итого · 6 заказов</span>
                <span />
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{total.toLocaleString("ru-RU")}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>{paid.toLocaleString("ru-RU")}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--warn)" }}>{owed.toLocaleString("ru-RU")}</span>
                <span />
                <span />
              </div>
            </div>

            {/* side column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* next deadlines */}
              <div style={{
                padding: "14px 16px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Ближайшие дедлайны</span>
                  <IconButton icon="calendar" size="sm" />
                </div>
                {[
                  { d: "28 мая", l: "Диплом Анны", days: 7, urgent: true },
                  { d: "3 июня", l: "Курсовая Ильи", days: 13 },
                  { d: "12 июня", l: "ВКР Андрея", days: 22 },
                ].map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                  }}>
                    <span style={{
                      width: 42, height: 42, borderRadius: 8,
                      background: "var(--bg-elev-2)",
                      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      flex: "none",
                    }}>
                      <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase" }}>{d.d.split(" ")[1]}</span>
                      <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{d.d.split(" ")[0]}</span>
                    </span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{d.l}</span>
                      <span style={{ fontSize: 11, color: d.urgent ? "var(--danger)" : "var(--text-3)" }}>
                        через {d.days} дн
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* income chart */}
              <div style={{
                padding: "14px 16px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Доход по месяцам</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>2026</span>
                </div>
                <svg viewBox="0 0 320 140" width="100%" height="120" style={{ display: "block" }}>
                  {/* grid */}
                  {[0, 35, 70, 105].map((y) => (
                    <line key={y} x1="22" x2="320" y1={y + 8} y2={y + 8} stroke="var(--border-subtle)" strokeDasharray="2 4" />
                  ))}
                  {/* bars */}
                  {[
                    { m: "янв", v: 45,  paid: true },
                    { m: "фев", v: 80,  paid: true },
                    { m: "мар", v: 65,  paid: true },
                    { m: "апр", v: 95,  paid: true },
                    { m: "май", v: 124, paid: true, current: true },
                    { m: "июн", v: 70,  paid: false },
                  ].map((b, i) => {
                    const x = 30 + i * 48;
                    const h = (b.v / 140) * 100;
                    return (
                      <g key={i}>
                        <rect x={x} y={108 - h} width={32} height={h} rx={4}
                              fill={b.current ? "var(--p-diploma)" : "color-mix(in oklab, var(--p-diploma) 30%, transparent)"}
                              opacity={b.paid ? 1 : 0.4}
                        />
                        <text x={x + 16} y={126} fontSize="9" fill="var(--text-3)" textAnchor="middle" fontFamily="var(--font-mono)">{b.m}</text>
                      </g>
                    );
                  })}
                </svg>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-3)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--p-diploma)" }} />
                    оплачено
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "color-mix(in oklab, var(--p-diploma) 30%, transparent)", opacity: 0.6 }} />
                    в прогнозе
                  </span>
                </div>
              </div>

              {/* recent files */}
              <div style={{
                padding: "14px 16px",
                background: "var(--bg-elev-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Файлы проекта</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>18 файлов</span>
                </div>
                {[
                  { i: "file", l: "Договор-Анна-2026.pdf", s: "5 мин" },
                  { i: "file", l: "Диплом-Анна-v3.docx",    s: "вчера" },
                  { i: "file", l: "Курсовая-Илья.docx",    s: "пн" },
                ].map((f) => (
                  <div key={f.l} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 13,
                  }}>
                    <Icon name={f.i} size={14} style={{ color: "var(--text-3)" }} />
                    <span style={{ flex: 1, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.l}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{f.s}</span>
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

window.ProjectDetailScreen = ProjectDetailScreen;
