/* Финансы — единый экран дохода, заказов, подписок */

const FIN_MONTHS = [
  { m: "ноя", v: 38,  paid: true },
  { m: "дек", v: 52,  paid: true },
  { m: "янв", v: 45,  paid: true },
  { m: "фев", v: 80,  paid: true },
  { m: "мар", v: 65,  paid: true },
  { m: "апр", v: 95,  paid: true },
  { m: "май", v: 125, paid: true, current: true },
  { m: "июн", v: 70,  paid: false, forecast: true },
];

const FIN_DIST = [
  { l: "Дипломы и курсовые", v: 95_000, c: "--p-diploma" },
  { l: "Лендинги",            v: 60_000, c: "--p-sites" },
  { l: "Telegram-боты",       v: 40_000, c: "--p-bots" },
  { l: "OpenResto (часть)",   v: 25_000, c: "--p-openresto" },
  { l: "Прочее",              v: 4_800,  c: "--p-home" },
];

const FIN_ORDERS = [
  { client: "Анна Соколова", proj: "--p-diploma", projL: "Дипломы",   work: "Диплом · экономика",      total: 30_000, paid: 15_000, due: "28 мая", days: 7,  status: "В работе" },
  { client: "Студия «Лист»", proj: "--p-sites",   projL: "Сайты",     work: "Лендинг — салон красоты", total: 90_000, paid: 45_000, due: "10 июня", days: 20, status: "В работе" },
  { client: "Андрей Дубов",   proj: "--p-diploma", projL: "Дипломы",   work: "ВКР · информатика",        total: 45_000, paid: 22_500, due: "12 июня", days: 22, status: "В работе" },
  { client: "Михаил Орлов",   proj: "--p-sites",   projL: "Сайты",     work: "Лендинг — школа",          total: 35_000, paid: 0,      due: "—",       days: 0,  status: "Готов" },
  { client: "Илья Кречет",     proj: "--p-diploma", projL: "Дипломы",   work: "Курсовая · маркетинг",    total: 8_000,  paid: 4_000,  due: "3 июня",  days: 13, status: "В работе" },
  { client: "Катя Романова",  proj: "--p-diploma", projL: "Дипломы",   work: "Эссе · философия",         total: 2_500,  paid: 0,      due: "5 июня",  days: 15, status: "Новый" },
  { client: "Студия «Лист»",   proj: "--p-bots",    projL: "Боты",       work: "TG-бот — запись",          total: 24_000, paid: 12_000, due: "20 июня", days: 30, status: "В работе" },
  { client: "Игорь Тимохин",  proj: "--p-diploma", projL: "Дипломы",   work: "Магистерская · IT",        total: 60_000, paid: 60_000, due: "—",       days: 0,  status: "Оплачен" },
];

const STATUS_TONE_FIN = {
  "Новый":    "info",
  "В работе": "warn",
  "Готов":    "success",
  "Сдан":     "success",
  "Оплачен":  "success",
};

/* Donut SVG */
function Donut({ data, size = 200, thickness = 24 }) {
  const total = data.reduce((s, d) => s + d.v, 0);
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  let cumulative = -0.25; // start at top
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const frac = d.v / total;
        const a0 = cumulative * Math.PI * 2;
        const a1 = (cumulative + frac) * Math.PI * 2;
        cumulative += frac;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const large = frac > 0.5 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
            stroke={`var(${d.c})`}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy - 4} fontSize="14" fill="var(--text-3)" textAnchor="middle">всего</text>
      <text x={cx} y={cy + 20} fontSize="22" fill="var(--text)" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="500" letterSpacing="-0.01em">
        {(total / 1000).toFixed(1)}к ₽
      </text>
    </svg>
  );
}

function FinancesScreen() {
  const totalRevenue = FIN_DIST.reduce((s, d) => s + d.v, 0);
  const owed = FIN_ORDERS.reduce((s, o) => s + (o.total - o.paid), 0);
  const upcoming = FIN_ORDERS.filter((o) => o.days > 0 && o.days < 30).reduce((s, o) => s + (o.total - o.paid), 0);

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Финансы" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="подработки · все источники"
          title="Финансы"
          sub="доход в мае · 124 800 ₽ · +18% к апрелю"
          right={<>
            <Tabs items={["Заказы", "Аналитика", "Подписки"]} active="Заказы" />
            <Button variant="ghost" size="sm" icon="filter">Период</Button>
            <Button variant="secondary" size="sm" icon="plus">Заказ</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <MetricCard label="Доход в мае"   value="124 800" unit="₽" trend={{ dir: "up", value: "+18%" }} sparkline="0,24 15,20 30,16 45,18 60,12 75,10 90,8 105,6 120,4" />
            <MetricCard label="Ожидает оплаты" value={owed.toLocaleString("ru-RU")}    unit="₽" sparkline="0,18 15,16 30,14 45,10 60,12 75,8 90,10 105,6 120,8" />
            <MetricCard label="Прогноз июнь"   value="~ 168 000" unit="₽" trend={{ dir: "up", value: "+35%" }} sparkline="0,20 15,18 30,16 45,14 60,10 75,8 90,6 105,8 120,2" />
            <MetricCard label="Активных заказов" value="6" sparkline="0,14 15,12 30,16 45,10 60,8 75,12 90,6 105,4 120,8" />
          </div>

          {/* charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* income line + bars hybrid */}
            <div style={{
              padding: "18px 22px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>Доход по месяцам</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>последние 8 · среднее 71 250 ₽</span>
                </div>
                <Tabs items={["8 мес", "Год", "Всё"]} active="8 мес" />
              </div>

              <svg viewBox="0 0 640 200" width="100%" height="200" style={{ display: "block" }}>
                {/* y-grid */}
                {[0, 40, 80, 120, 160].map((y) => (
                  <line key={y} x1="40" x2="640" y1={y + 10} y2={y + 10} stroke="var(--border-subtle)" strokeDasharray="2 4" />
                ))}
                {[0, 30, 60, 90, 120].map((v, i) => (
                  <text key={v} x="34" y={170 - i * 40 + 14} fontSize="10" fill="var(--text-3)" textAnchor="end" fontFamily="var(--font-mono)">{v}к</text>
                ))}

                {/* bars */}
                {FIN_MONTHS.map((b, i) => {
                  const x = 56 + i * 74;
                  const h = (b.v / 140) * 160;
                  return (
                    <g key={i}>
                      <rect x={x} y={170 - h} width={48} height={h} rx={4}
                            fill={b.current ? "var(--p-diploma)" : "color-mix(in oklab, var(--p-diploma) 32%, transparent)"}
                            opacity={b.forecast ? 0.4 : 1}
                            stroke={b.forecast ? "color-mix(in oklab, var(--p-diploma) 50%, transparent)" : "none"}
                            strokeDasharray={b.forecast ? "3 3" : ""}
                      />
                      <text x={x + 24} y={186} fontSize="11" fill={b.current ? "var(--text)" : "var(--text-3)"} textAnchor="middle" fontFamily="var(--font-mono)">{b.m}</text>
                      {b.current && (
                        <text x={x + 24} y={170 - h - 6} fontSize="11" fill="var(--text)" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="500">
                          {b.v}к
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-3)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--p-diploma)" }} />
                  получено
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "color-mix(in oklab, var(--p-diploma) 40%, transparent)", opacity: 0.6 }} />
                  прогноз
                </span>
              </div>
            </div>

            {/* distribution donut */}
            <div style={{
              padding: "18px 22px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>Источники дохода</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>май</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Donut data={FIN_DIST} size={170} thickness={20} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {FIN_DIST.map((d) => (
                    <div key={d.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: `var(${d.c})`, flex: "none" }} />
                      <span style={{ flex: 1, fontSize: 12, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.l}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {((d.v / totalRevenue) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* upcoming + subs hint */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{
              padding: "14px 18px",
              background: `color-mix(in oklab, var(--p-diploma) 8%, var(--bg-elev-1))`,
              border: `1px solid color-mix(in oklab, var(--p-diploma) 28%, var(--border-subtle))`,
              borderRadius: 12,
              display: "flex", alignItems: "center", gap: 18,
            }}>
              <Icon name="trending_up" size={22} style={{ color: "var(--p-diploma)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--p-diploma)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Ожидается в этом месяце</span>
                <span style={{ fontSize: 20, fontWeight: 500, color: "var(--text)", fontFamily: "var(--font-mono)", letterSpacing: "-0.01em" }}>
                  {upcoming.toLocaleString("ru-RU")} ₽
                </span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>от 4 заказов в ближайшие 30 дней</span>
              </div>
              <Button variant="secondary" size="sm" icon="bell">Напомнить о платежах</Button>
            </div>

            <div style={{
              padding: "14px 18px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <Icon name="repeat" size={22} style={{ color: "var(--text-3)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Подписки</span>
                <span style={{ fontSize: 16, color: "var(--text)", fontWeight: 500 }}>16 477 ₽ <span style={{ fontSize: 11, color: "var(--text-3)" }}>/ месяц</span></span>
              </div>
              <Button variant="ghost" size="sm" trailing={<Icon name="arrow_right" size={13} />}>В Дом</Button>
            </div>
          </div>

          {/* orders */}
          <div style={{
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Все заказы</span>
                <Tabs items={["Активные", "Новые", "Готовые", "Архив"]} active="Активные" />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input icon="search" placeholder="клиент или проект" size="sm" style={{ width: 240 }} />
                <Button variant="ghost" size="sm" icon="sort">Дедлайн</Button>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.6fr 1fr 0.9fr 0.9fr 0.9fr 1fr 24px",
              padding: "8px 18px",
              fontSize: 11, color: "var(--text-3)",
              letterSpacing: "0.04em", textTransform: "uppercase",
              borderTop: "1px solid var(--border-subtle)",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-elev-2)",
            }}>
              <span>Клиент / проект</span>
              <span>Работа</span>
              <span style={{ textAlign: "right" }}>Сумма</span>
              <span style={{ textAlign: "right" }}>Аванс</span>
              <span style={{ textAlign: "right" }}>Остаток</span>
              <span>Дедлайн</span>
              <span>Статус</span>
              <span />
            </div>

            {FIN_ORDERS.map((o, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.6fr 1fr 0.9fr 0.9fr 0.9fr 1fr 24px",
                padding: "12px 18px",
                borderBottom: i === FIN_ORDERS.length - 1 ? "none" : "1px solid var(--border-subtle)",
                alignItems: "center",
                fontSize: 13,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={o.client.split(" ").map((w) => w[0]).join("").slice(0, 2)} color={`var(${o.proj})`} size={26} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ color: "var(--text)" }}>{o.client}</span>
                    <ProjectTag projectToken={o.proj} label={o.projL} size="sm" />
                  </div>
                </div>
                <span style={{ color: "var(--text)" }}>{o.work}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{o.total.toLocaleString("ru-RU")}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>{o.paid.toLocaleString("ru-RU")}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: o.total - o.paid > 0 ? "var(--warn)" : "var(--text-3)" }}>
                  {(o.total - o.paid).toLocaleString("ru-RU")}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{o.due}</span>
                  {o.days > 0 && (
                    <span style={{ fontSize: 11, color: o.days <= 7 ? "var(--danger)" : "var(--text-3)" }}>
                      через {o.days} дн
                    </span>
                  )}
                </div>
                <Badge tone={STATUS_TONE_FIN[o.status]} dot>{o.status}</Badge>
                <IconButton icon="more" size="sm" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

window.FinancesScreen = FinancesScreen;
