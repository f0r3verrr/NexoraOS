/* Dashboard — главный экран. Сложный экран, разбит на под-компоненты ниже */

/* ---------- Header strip ---------- */
function DashHeader() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          среда · 21 мая 2026
        </span>
        <h1 style={{
          fontSize: 28, fontWeight: 500, color: "var(--text)",
          letterSpacing: "-0.02em", margin: 0, lineHeight: 1.15,
        }}>
          Доброе утро, Кирилл.
          <span style={{ color: "var(--text-3)" }}> Три важных дела на сегодня.</span>
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" icon="repeat" size="sm">Обзор недели</Button>
        <Button variant="secondary" icon="plus">Добавить</Button>
      </div>
    </div>
  );
}

/* ---------- Metric cards ---------- */
function MetricCard({ label, value, unit, trend, sparkline }) {
  return (
    <div style={{
      flex: 1,
      padding: "16px 18px",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 10,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</span>
        {trend && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, color: trend.dir === "up" ? "var(--success)" : "var(--text-3)",
            fontFamily: "var(--font-mono)",
          }}>
            <Icon name={trend.dir === "up" ? "trending_up" : "arrow_down"} size={11} />
            {trend.value}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 500,
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          color: "var(--text)",
        }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: "var(--text-3)" }}>{unit}</span>}
      </div>
      {sparkline && (
        <svg viewBox="0 0 120 28" width="100%" height="22" preserveAspectRatio="none" style={{ display: "block" }}>
          <polyline
            points={sparkline}
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function MetricsRow() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
      <MetricCard
        label="Задач на сегодня"
        value="8"
        unit="/ 12"
        trend={{ dir: "up", value: "+2" }}
        sparkline="0,20 12,18 24,16 36,14 48,16 60,12 72,10 84,12 96,8 108,10 120,6"
      />
      <MetricCard
        label="Звонков"
        value="3"
        sparkline="0,14 12,12 24,16 36,14 48,10 60,12 72,8 84,10 96,6 108,8 120,4"
      />
      <MetricCard
        label="Дедлайнов на неделе"
        value="5"
        sparkline="0,18 12,16 24,14 36,16 48,14 60,10 72,12 84,8 96,10 108,6 120,8"
      />
      <MetricCard
        label="Доход в мае"
        value="124 800"
        unit="₽"
        trend={{ dir: "up", value: "+18%" }}
        sparkline="0,24 12,22 24,18 36,20 48,16 60,14 72,12 84,14 96,10 108,8 120,4"
      />
    </div>
  );
}

/* ---------- Frog of the day ---------- */
function FrogCard() {
  return (
    <div style={{
      padding: "20px 22px",
      background: "linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 12%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 70%)",
      border: "1px solid color-mix(in oklab, var(--p-openresto) 30%, var(--border))",
      borderRadius: 12,
      marginBottom: 20,
      display: "flex", alignItems: "center", gap: 18,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 10,
        background: "color-mix(in oklab, var(--p-openresto) 18%, transparent)",
        color: "var(--p-openresto)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flex: "none",
      }}>
        <Icon name="zap" size={20} stroke={1.5} />
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--p-openresto)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
            Лягушка дня
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>·</span>
          <ProjectTag projectToken="--p-openresto" label="OpenResto" />
        </div>
        <span style={{ fontSize: 18, color: "var(--text)", fontWeight: 500, letterSpacing: "-0.01em" }}>
          Доделать миграцию старого меню на новую схему БД
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--text-3)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="clock" size={12} /> ~ 2 ч
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="flag" size={12} style={{ color: "var(--danger)" }} /> p1
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="paperclip" size={12} /> 3
          </span>
          <span>застряло 4 дня</span>
        </div>
      </div>
      <Button variant="primary" icon="check">Начать</Button>
      <IconButton icon="snooze" title="Отложить" />
    </div>
  );
}

window.DashHeader = DashHeader;
window.MetricsRow = MetricsRow;
window.FrogCard = FrogCard;
