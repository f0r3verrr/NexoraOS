/* V1 contextual panels — content per active area */

/* ---------- Panel shell ---------- */
function PanelChrome({ title, sub, primaryAction, children, footer }) {
  return (
    <div style={{
      width: 260, flex: "none",
      background: "var(--bg)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column",
      minHeight: 0,
    }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500, letterSpacing: "-0.01em", flex: 1 }}>{title}</span>
          <IconButton icon="search" />
          <IconButton icon="more" />
        </div>
        {sub && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</span>}
      </div>

      {primaryAction && (
        <div style={{ padding: "0 12px 8px" }}>
          {primaryAction}
        </div>
      )}

      <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px", minHeight: 0 }}>
        {children}
      </div>

      {footer || (
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials="К" color="var(--p-openresto)" size={24} />
          <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>kirill@local</span>
          <IconButton icon="moon" size="sm" />
        </div>
      )}
    </div>
  );
}

function PanelButton({ children, primary, kbd, icon }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: 10,
      width: "100%", height: 32, padding: "0 10px",
      borderRadius: 8,
      background: primary ? "var(--text)" : "var(--bg-elev-2)",
      color: primary ? "var(--bg)" : "var(--text-2)",
      border: primary ? "none" : "1px solid var(--border-subtle)",
      fontSize: 13, fontWeight: 500,
    }}>
      {icon && <Icon name={icon} size={15} />}
      <span style={{ flex: 1, textAlign: "left" }}>{children}</span>
      {kbd && <span style={{ fontSize: 11, opacity: 0.6, fontFamily: "var(--font-mono)" }}>{kbd}</span>}
    </button>
  );
}

function PanelGroupLabel({ children, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "12px 10px 6px",
      fontSize: 11, color: "var(--text-3)",
      letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500,
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

function PanelRow({ icon, dot, label, sub, badge, active, indent = 0, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      width: "100%",
      padding: `7px 10px 7px ${10 + indent}px`,
      borderRadius: 6,
      background: active ? "var(--bg-elev-2)" : "transparent",
      color: active ? "var(--text)" : "var(--text-2)",
      textAlign: "left",
    }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(${dot})`, flex: "none" }} />}
      {icon && <Icon name={icon} size={14} style={{ color: active ? "var(--text)" : "var(--text-3)" }} />}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</span>}
      </span>
      {badge != null && (
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{badge}</span>
      )}
    </button>
  );
}

/* ---------- Home panel ---------- */
function HomePanel() {
  return (
    <PanelChrome
      title="Главная"
      sub="среда · 21 мая"
      primaryAction={<PanelButton primary icon="plus" kbd="⌘N">Быстро добавить</PanelButton>}
    >
      <PanelGroupLabel action={<Icon name="pin" size={11} style={{ color: "var(--text-muted)" }} />}>Закреплено</PanelGroupLabel>
      {[
        { d: "--p-openresto", l: "OpenResto · MVP", s: "Sprint 7" },
        { d: "--p-diploma",   l: "Диплом Анны",      s: "до 28 мая" },
        { d: "--p-girl",       l: "Аня",              s: "ДР · через 47 дн" },
      ].map((p) => <PanelRow key={p.l} dot={p.d} label={p.l} sub={p.s} />)}

      <PanelGroupLabel>Недавнее</PanelGroupLabel>
      {[
        { i: "note",  l: "Архитектура нового меню", s: "час назад" },
        { i: "check", l: "Прозвонить лидов",        s: "2 ч" },
        { i: "file",  l: "Договор-Анна-2026.pdf",   s: "5 мин" },
        { i: "note",  l: "Daily journal · 20 мая",  s: "вчера" },
        { i: "file",  l: "Скан СТС.jpg",            s: "позавчера" },
      ].map((r) => <PanelRow key={r.l} icon={r.i} label={r.l} sub={r.s} />)}
    </PanelChrome>
  );
}

/* ---------- Inbox panel ---------- */
function InboxPanel() {
  return (
    <PanelChrome
      title="Inbox"
      sub="12 ждут разбора"
      primaryAction={<PanelButton primary icon="zap" kbd="⌘I">Захватить мысль</PanelButton>}
    >
      <PanelGroupLabel>Виды</PanelGroupLabel>
      <PanelRow icon="inbox"  label="Не разобрано"        badge="12" active />
      <PanelRow icon="snooze" label="Отложено"            badge="3" />
      <PanelRow icon="archive" label="Разобрано · неделя" badge="41" />

      <PanelGroupLabel>Источники</PanelGroupLabel>
      <PanelRow icon="send"    label="Telegram-бот" badge="6" />
      <PanelRow icon="message" label="Email"        badge="2" />
      <PanelRow icon="globe"   label="Web · браузер" badge="1" />
      <PanelRow icon="mic"     label="Голос"        badge="3" />

      <PanelGroupLabel>Предложения</PanelGroupLabel>
      <PanelRow icon="check" label="Стало бы задачей"   badge="4" />
      <PanelRow icon="note"  label="Стало бы заметкой"  badge="2" />
      <PanelRow icon="bell"  label="Стало бы напомин." badge="2" />
    </PanelChrome>
  );
}

/* ---------- Today panel ---------- */
function TodayPanel() {
  return (
    <PanelChrome
      title="Сегодня"
      sub="среда · 21 мая · 11:54"
      primaryAction={<PanelButton primary icon="plus" kbd="N">Задача</PanelButton>}
    >
      <PanelGroupLabel>Перейти к</PanelGroupLabel>
      <PanelRow icon="zap"       label="Лягушка дня" sub="OpenResto · миграция" />
      <PanelRow icon="sun_today" label="Утро"   badge="3" active />
      <PanelRow icon="clock"     label="День"   badge="3" />
      <PanelRow icon="moon"      label="Вечер"  badge="3" />

      <PanelGroupLabel>Фильтр по областям</PanelGroupLabel>
      <PanelRow dot="--p-openresto" label="Работа"     badge="5" />
      <PanelRow dot="--p-diploma"   label="Подработки" badge="1" />
      <PanelRow dot="--p-girl"      label="Личное"     badge="2" />

      <PanelGroupLabel>Сохранённые виды</PanelGroupLabel>
      <PanelRow icon="star" label="Без проекта" />
      <PanelRow icon="flag" label="Только !p1" />
      <PanelRow icon="repeat" label="Повторяющиеся" />
    </PanelChrome>
  );
}

/* ---------- Calendar panel ---------- */
function MiniCal({ highlightWeek = true }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 3);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, padding: "0 4px" }}>
      {["пн","вт","ср","чт","пт","сб","вс"].map((d) => (
        <span key={d} style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "4px 0" }}>{d}</span>
      ))}
      {days.map((n, i) => {
        const visible = n > 0 && n <= 31;
        const isToday = n === 21;
        const inWeek = highlightWeek && n >= 18 && n <= 24;
        return (
          <span key={i} style={{
            fontSize: 11, fontFamily: "var(--font-mono)",
            textAlign: "center", padding: "5px 0", borderRadius: 6,
            color: !visible ? "transparent" : isToday ? "var(--bg)" : inWeek ? "var(--text)" : "var(--text-3)",
            background: isToday ? "var(--text)" : inWeek ? "var(--bg-elev-2)" : "transparent",
          }}>{visible ? n : "-"}</span>
        );
      })}
    </div>
  );
}

function CalendarPanel() {
  return (
    <PanelChrome
      title="Календарь"
      sub="неделя 21 · 18–24 мая"
      primaryAction={<PanelButton primary icon="plus">Событие</PanelButton>}
    >
      <div style={{ padding: "8px 8px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 8px" }}>
          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Май 2026</span>
          <div style={{ display: "flex", gap: 2 }}>
            <IconButton icon="chevron_left"  size="sm" />
            <IconButton icon="chevron_right" size="sm" />
          </div>
        </div>
        <MiniCal />
      </div>

      <PanelGroupLabel>Календари</PanelGroupLabel>
      {PROJECT_COLORS.slice(0, 8).map((p) => (
        <label key={p.token} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 10px", borderRadius: 6,
          fontSize: 13, color: "var(--text-2)",
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4,
            background: `color-mix(in oklab, var(${p.token}) 28%, transparent)`,
            border: `1px solid color-mix(in oklab, var(${p.token}) 60%, transparent)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flex: "none",
          }}><Icon name="check" size={10} stroke={2.5} style={{ color: `var(${p.token})` }} /></span>
          <span style={{ flex: 1 }}>{p.name}</span>
        </label>
      ))}
    </PanelChrome>
  );
}

/* ---------- Projects panel (used by project detail + personal modules) ---------- */
function ProjectsPanel({ activeName }) {
  const groups = [
    { l: "Работа", items: [
      { d: "--p-youmin",     n: "Youmin · QA",      c: 7  },
      { d: "--p-openresto",  n: "OpenResto · Dev",  c: 14 },
    ]},
    { l: "Подработки", items: [
      { d: "--p-diploma", n: "Дипломы и курсовые", c: 4, m: "₽" },
      { d: "--p-sites",   n: "Сайты",              c: 2 },
      { d: "--p-bots",    n: "Боты",               c: 1 },
    ]},
    { l: "Жизнь", items: [
      { d: "--p-girl",   n: "Аня",      c: 3 },
      { d: "--p-family", n: "Семья",    c: 2 },
      { d: "--p-car",    n: "Машина",   c: 1 },
      { d: "--p-home",   n: "Дом",      c: 5 },
      { d: "--p-health", n: "Здоровье", c: 1 },
    ]},
  ];
  return (
    <PanelChrome
      title="Проекты"
      sub="12 активных · 4 области"
      primaryAction={<PanelButton primary icon="plus">Новый проект</PanelButton>}
    >
      {groups.map((g) => (
        <React.Fragment key={g.l}>
          <PanelGroupLabel action={<Icon name="plus" size={11} style={{ color: "var(--text-muted)" }} />}>{g.l}</PanelGroupLabel>
          {g.items.map((it) => (
            <PanelRow key={it.n} dot={it.d} label={it.n} badge={it.c} active={activeName && it.n.startsWith(activeName)} />
          ))}
        </React.Fragment>
      ))}
    </PanelChrome>
  );
}

/* ---------- Notes panel ---------- */
function NotesPanel({ activePath }) {
  const tree = [
    { l: "Рабочие",   c: 24, children: [
      { l: "OpenResto · ADR",   c: 8 },
      { l: "Youmin · процессы", c: 6 },
      { l: "Спринты",            c: 10 },
    ]},
    { l: "Подработки", c: 14, children: [
      { l: "Клиенты",  c: 9 },
      { l: "Шаблоны ТЗ", c: 5 },
    ]},
    { l: "Личное",    c: 32, children: [
      { l: "Daily journal", c: 28, active: true },
      { l: "Книги · идеи",  c: 4 },
    ]},
    { l: "База знаний", c: 47, children: [
      { l: "QA — стратегии", c: 18 },
      { l: "Backend",        c: 21 },
      { l: "Дизайн",         c: 8 },
    ]},
  ];
  return (
    <PanelChrome
      title="Заметки"
      sub="117 заметок · 14 шаблонов"
      primaryAction={<PanelButton primary icon="plus" kbd="N">Новая заметка</PanelButton>}
    >
      {tree.map((g) => (
        <React.Fragment key={g.l}>
          <PanelRow icon="folder" label={g.l} badge={g.c} />
          {g.children?.map((c) => (
            <PanelRow key={c.l} icon="note" label={c.l} badge={c.c} active={c.active} indent={16} />
          ))}
        </React.Fragment>
      ))}

      <PanelGroupLabel>Шаблоны</PanelGroupLabel>
      <PanelRow icon="layers" label="Новый клиент" />
      <PanelRow icon="layers" label="Новый проект" />
      <PanelRow icon="layers" label="Daily journal" />
      <PanelRow icon="layers" label="Встреча" />
    </PanelChrome>
  );
}

/* ---------- Journal panel ---------- */
function JournalPanel() {
  const recent = [
    { d: "21 мая · ср", l: "сегодня",       active: true,  mood: "var(--p-health)" },
    { d: "20 мая · вт", l: "глубокая работа", mood: "var(--p-openresto)" },
    { d: "19 мая · пн", l: "встал тяжело",   mood: "var(--warn)" },
    { d: "18 мая · вс", l: "семья · дача",   mood: "var(--p-family)" },
    { d: "17 мая · сб", l: "Аня · парк",    mood: "var(--p-girl)" },
    { d: "16 мая · пт", l: "сдача спринта", mood: "var(--p-openresto)" },
  ];
  return (
    <PanelChrome
      title="Дневник"
      sub="стрик · 28 дней"
      primaryAction={<PanelButton primary icon="edit">Запись на сегодня</PanelButton>}
    >
      <div style={{ padding: "8px 8px 8px" }}>
        <MiniCal highlightWeek={false} />
      </div>

      <PanelGroupLabel>Недавние записи</PanelGroupLabel>
      {recent.map((r, i) => (
        <button key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "8px 10px", borderRadius: 6,
          background: r.active ? "var(--bg-elev-2)" : "transparent",
          textAlign: "left",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: r.mood, flex: "none" }} />
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, color: r.active ? "var(--text)" : "var(--text-2)" }}>{r.d}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{r.l}</span>
          </span>
        </button>
      ))}

      <PanelGroupLabel>Аналитика</PanelGroupLabel>
      <PanelRow icon="trending_up" label="Настроение · месяц" />
      <PanelRow icon="battery"     label="Энергия · месяц" />
    </PanelChrome>
  );
}

/* ---------- Files panel ---------- */
function FilesPanel() {
  return (
    <PanelChrome
      title="Файлы"
      sub="412 файлов · 8.4 ГБ"
      primaryAction={<PanelButton primary icon="paperclip">Загрузить</PanelButton>}
    >
      <PanelGroupLabel>Вид</PanelGroupLabel>
      <PanelRow icon="layers"  label="Все"             badge="412" active />
      <PanelRow icon="clock"   label="Недавние"        badge="24" />
      <PanelRow icon="star"    label="Избранное"       badge="9" />
      <PanelRow icon="trash"   label="Корзина"         badge="6" />

      <PanelGroupLabel action={<Icon name="plus" size={11} style={{ color: "var(--text-muted)" }} />}>Папки</PanelGroupLabel>
      <PanelRow icon="folder" label="Документы"        badge="48" />
      <PanelRow icon="folder" label="Дипломы и грамоты" badge="14" />
      <PanelRow icon="folder" label="Сертификаты"      badge="22" />
      <PanelRow icon="folder" label="Договоры"         badge="36" />
      <PanelRow icon="folder" label="Личное"           badge="72" />
      <PanelRow icon="folder" label="Машина"           badge="18" />

      <PanelGroupLabel>По типу</PanelGroupLabel>
      <PanelRow icon="file"  label="PDF"   badge="124" />
      <PanelRow icon="file"  label="DOCX"  badge="64" />
      <PanelRow icon="file"  label="JPG / PNG" badge="148" />
      <PanelRow icon="file"  label="MD"    badge="34" />
    </PanelChrome>
  );
}

/* ---------- CRM panel ---------- */
function CrmPanel() {
  return (
    <PanelChrome
      title="CRM"
      sub="38 контактов · 6 активных"
      primaryAction={<PanelButton primary icon="plus">Контакт</PanelButton>}
    >
      <PanelGroupLabel>Сегменты</PanelGroupLabel>
      <PanelRow icon="users" label="Все клиенты"       badge="38" active />
      <PanelRow icon="star"  label="Постоянные"        badge="7" />
      <PanelRow icon="flag"  label="Активные сейчас"   badge="6" />
      <PanelRow icon="zap"   label="Горячие лиды"      badge="3" />
      <PanelRow icon="archive" label="Архив"            badge="12" />

      <PanelGroupLabel>По проекту</PanelGroupLabel>
      <PanelRow dot="--p-diploma" label="Дипломы" badge="18" />
      <PanelRow dot="--p-sites"   label="Сайты"    badge="9" />
      <PanelRow dot="--p-bots"    label="Боты"     badge="4" />

      <PanelGroupLabel>Теги</PanelGroupLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 10px 8px" }}>
        {["рекомендация", "вконтакте", "лента", "повторный", "сложный", "горячий"].map((t) => (
          <span key={t} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 999,
            fontSize: 11, color: "var(--text-2)",
          }}>#{t}</span>
        ))}
      </div>
    </PanelChrome>
  );
}

/* ---------- Finances panel ---------- */
function FinancesPanel() {
  return (
    <PanelChrome title="Финансы" sub="доход май · 124 800 ₽" primaryAction={<PanelButton primary icon="plus">Заказ</PanelButton>}>
      <PanelRow icon="wallet"      label="Все заказы"         badge="42" active />
      <PanelRow icon="trending_up" label="Аналитика"           />
      <PanelRow icon="repeat"      label="Подписки и регулярные" badge="10" />
      <PanelRow icon="archive"     label="Архив"                badge="86" />

      <PanelGroupLabel>Статусы</PanelGroupLabel>
      <PanelRow icon="flag"  label="Новые"     badge="2" />
      <PanelRow icon="clock" label="В работе"  badge="6" />
      <PanelRow icon="check" label="Готовые"   badge="3" />
      <PanelRow icon="x"     label="Не оплачены" badge="4" />
    </PanelChrome>
  );
}

/* ---------- Goals panel ---------- */
function GoalsPanel() {
  return (
    <PanelChrome title="Цели и привычки" sub="стрик · 28 дн" primaryAction={<PanelButton primary icon="plus">Цель</PanelButton>}>
      <PanelGroupLabel>Цели</PanelGroupLabel>
      <PanelRow icon="target" label="Годовые"  badge="5" active />
      <PanelRow icon="target" label="Месячные" badge="7" />
      <PanelRow icon="target" label="Недельные" badge="3" />

      <PanelGroupLabel>Привычки</PanelGroupLabel>
      <PanelRow icon="heart" label="Здоровье"    badge="4" />
      <PanelRow icon="zap"   label="Обучение"    badge="2" />
      <PanelRow icon="smile" label="Отношения"   badge="2" />
      <PanelRow icon="briefcase" label="Работа"  badge="3" />
    </PanelChrome>
  );
}

/* ---------- Kanban panel ---------- */
function KanbanPanel() {
  return (
    <PanelChrome
      title="Доски"
      sub="6 канбан-досок"
      primaryAction={<PanelButton primary icon="plus">Доска</PanelButton>}
    >
      <PanelGroupLabel>Доски</PanelGroupLabel>
      <PanelRow dot="--p-openresto" label="OpenResto · Sprint 7" badge="48" active />
      <PanelRow dot="--p-youmin"    label="Youmin · QA"           badge="22" />
      <PanelRow dot="--p-diploma"   label="Сезон 2026"            badge="11" />
      <PanelRow dot="--p-sites"     label="Лендинги"              badge="8" />
      <PanelRow dot="--p-bots"      label="Боты · roadmap"        badge="6" />
      <PanelRow dot="--p-home"      label="Дом · ремонт"          badge="14" />

      <PanelGroupLabel>Виды</PanelGroupLabel>
      <PanelRow icon="layers"       label="Канбан"     active />
      <PanelRow icon="calendar"     label="Календарь" />
      <PanelRow icon="trending_up"  label="Гантт" />

      <PanelGroupLabel>Фильтры</PanelGroupLabel>
      <PanelRow icon="flag"  label="Только !p1" />
      <PanelRow icon="users" label="Только мои" />
      <PanelRow icon="clock" label="С дедлайнами" />
    </PanelChrome>
  );
}

/* ---------- Gantt panel ---------- */
function GanttPanel() {
  return (
    <PanelChrome
      title="План · Гантт"
      sub="6 проектов на горизонте"
      primaryAction={<PanelButton primary icon="plus">Веха</PanelButton>}
    >
      <PanelGroupLabel>Масштаб</PanelGroupLabel>
      <PanelRow icon="clock"    label="День" />
      <PanelRow icon="calendar" label="Неделя" active />
      <PanelRow icon="layers"   label="Месяц" />
      <PanelRow icon="archive"  label="Квартал" />

      <PanelGroupLabel>Дорожки</PanelGroupLabel>
      {[
        { d: "--p-openresto", n: "OpenResto · MVP" },
        { d: "--p-youmin",    n: "Youmin · QA" },
        { d: "--p-diploma",   n: "Дипломы 2026" },
        { d: "--p-sites",     n: "Лендинги" },
        { d: "--p-bots",      n: "Боты" },
        { d: "--p-home",      n: "Дом · ремонт" },
      ].map((p) => (
        <PanelRow key={p.n} dot={p.d} label={p.n} badge="✓" />
      ))}

      <PanelGroupLabel>Слои</PanelGroupLabel>
      <PanelRow icon="flag"   label="Вехи и дедлайны" />
      <PanelRow icon="users"  label="Загрузка" />
      <PanelRow icon="bell"   label="Зависимости" />
    </PanelChrome>
  );
}

/* ---------- Sidebar shell ---------- */
const PANEL_MAP = {
  "Дашборд":    ["home",     <HomePanel />],
  "Inbox":      ["inbox",    <InboxPanel />],
  "Сегодня":    ["today",    <TodayPanel />],
  "Календарь":  ["calendar", <CalendarPanel />],
  "Заметки":    ["notes",    <NotesPanel />],
  "Дневник":    ["journal",  <JournalPanel />],
  "Файлы":      ["files",    <FilesPanel />],
  "Финансы":    ["finances", <FinancesPanel />],
  "CRM":        ["crm",      <CrmPanel />],
  "Цели и привычки": ["goals", <GoalsPanel />],
  "Канбан":     ["kanban",   <KanbanPanel />],
  "Гантт":      ["gantt",    <GanttPanel />],
};

const PROJECT_NAME_TO_RAIL = {
  "Дипломы и курсовые": "projects",
  "OpenResto · Dev":    "projects",
  "Youmin · QA":         "projects",
  "Сайты":                "projects",
  "Боты":                 "projects",
  "Аня":                  "projects",
  "Семья":                "projects",
  "Машина":              "projects",
  "Дом":                  "projects",
  "Здоровье":            "projects",
};

function Sidebar({ active = "Дашборд" }) {
  let railKey;
  let panel;

  if (PANEL_MAP[active]) {
    railKey = PANEL_MAP[active][0];
    panel = PANEL_MAP[active][1];
  } else if (PROJECT_NAME_TO_RAIL[active]) {
    railKey = "projects";
    panel = <ProjectsPanel activeName={active.split(" ·")[0]} />;
  } else {
    railKey = "home";
    panel = <HomePanel />;
  }

  return (
    <>
      <SidebarRail activeKey={railKey} />
      {panel}
    </>
  );
}

/* Top bar reused */
function TopBar({ title, breadcrumb, right, sub }) {
  return (
    <div style={{
      height: 56,
      display: "flex", alignItems: "center", gap: 16,
      padding: "0 24px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg)",
      flex: "none",
    }}>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
        {breadcrumb && <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{breadcrumb}</span>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</span>
          {sub && <span style={{ fontSize: 13, color: "var(--text-3)" }}>{sub}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, PanelChrome, PanelRow, PanelGroupLabel, PanelButton, MiniCal });
