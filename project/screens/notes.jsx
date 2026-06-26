/* Notes / knowledge base screen */

const NOTES_LIST = [
  { id: 1, t: "Daily journal · 21 мая",        s: "Утро. Поспал 7:20, энергия 4 из 5. План на день: миграция меню, …", date: "сегодня",   tag: "Личное · Daily journal", color: "--p-girl",      pinned: true, active: true },
  { id: 2, t: "Архитектура нового меню",       s: "## Проблема\nСтарая схема menu_v1 хранит позиции с дублированием…",     date: "час назад", tag: "Рабочие · OpenResto ADR", color: "--p-openresto", pinned: true },
  { id: 3, t: "Daily journal · 20 мая",        s: "Глубокая работа 4 часа над миграцией. Вечером прогулка с Аней.",       date: "вчера",     tag: "Личное · Daily journal", color: "--p-girl" },
  { id: 4, t: "Шаблон ТЗ — простой лендинг",   s: "1. Цель и аудитория\n2. Структура блоков\n3. Тон копи\n4. Референсы…",   date: "вчера",     tag: "Подработки · Шаблоны",   color: "--p-sites" },
  { id: 5, t: "Книга — Atomic Habits, заметки", s: "Главная идея: системы важнее целей. Привычки — компаунд-проценты…",      date: "3 дн",      tag: "Личное · Книги",          color: "--p-health" },
  { id: 6, t: "QA — стратегия для онбординга",  s: "Опираемся на матрицу critical paths × persona. Каждый шаг проверяем…",  date: "4 дн",      tag: "База знаний · QA",         color: "--p-youmin" },
  { id: 7, t: "Daily journal · 18 мая",        s: "Воскресенье. Дача. Помог отцу с забором, мама — пироги.",              date: "пн",        tag: "Личное · Daily journal", color: "--p-girl" },
  { id: 8, t: "Идеи лендинга для салона",       s: "- Hero с фото мастера\n- Карусель работ\n- Прайс по услугам\n- Запись",  date: "5 дн",      tag: "Подработки · Сайты",       color: "--p-sites" },
  { id: 9, t: "ADR-12: миграции",               s: "## Решение\nДля zero-downtime используем expand-contract паттерн…",      date: "неделя",    tag: "Рабочие · OpenResto ADR", color: "--p-openresto" },
];

function NoteListItem({ n }) {
  return (
    <button style={{
      display: "flex", flexDirection: "column", gap: 6,
      width: "100%", textAlign: "left",
      padding: "12px 14px",
      borderRadius: 8,
      background: n.active ? "var(--bg-elev-2)" : "transparent",
      borderLeft: n.active ? `2px solid var(${n.color})` : "2px solid transparent",
      marginLeft: n.active ? -2 : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {n.pinned && <Icon name="pin" size={11} style={{ color: "var(--text-muted)" }} />}
        <span style={{
          fontSize: 13, color: "var(--text)", fontWeight: n.active ? 500 : 400,
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{n.t}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", flex: "none" }}>{n.date}</span>
      </div>
      <span style={{
        fontSize: 12, color: "var(--text-3)", lineHeight: 1.5,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>{n.s}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(${n.color})` }} />
        {n.tag}
      </span>
    </button>
  );
}

function NotesScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Заметки" />

      {/* middle column — note list */}
      <div style={{
        width: 320, flex: "none",
        borderRight: "1px solid var(--border-subtle)",
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        minHeight: 0,
      }}>
        <div style={{ padding: "14px 16px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, flex: 1 }}>Личное · Daily journal</span>
            <IconButton icon="sort" />
            <IconButton icon="filter" />
          </div>
          <Input icon="search" placeholder="Поиск по 117 заметкам" size="sm" style={{ width: "100%" }} />
        </div>
        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 6px 8px" }}>
          {NOTES_LIST.map((n) => <NoteListItem key={n.id} n={n} />)}
        </div>
      </div>

      {/* editor */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--p-girl)" }} />
            Личное · Daily journal · 21 мая
          </span>}
          title="Daily journal · 21 мая"
          sub="среда · обновлено в 11:42"
          right={<>
            <span style={{ display: "inline-flex", alignItems: "center", gap: -6, marginRight: 6 }}>
              <Avatar initials="К" color="var(--p-openresto)" size={22} />
            </span>
            <Button variant="ghost" size="sm" icon="pin">Закреплено</Button>
            <Button variant="ghost" size="sm" icon="external">Открыть</Button>
            <Button variant="secondary" size="sm" icon="bookmark">Шаблон</Button>
            <IconButton icon="more" />
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "32px 56px 60px", minHeight: 0 }}>
          <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* title */}
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Daily journal · 21 мая
            </h1>

            {/* mood / energy strip */}
            <div style={{
              display: "flex", gap: 12, padding: "14px 16px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>День</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)" }}>
                <Icon name="smile" size={14} style={{ color: "var(--p-health)" }} /> настроение 4 / 5
              </span>
              <span style={{ width: 1, height: 16, background: "var(--border-subtle)" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)" }}>
                <Icon name="battery" size={14} style={{ color: "var(--p-health)" }} /> энергия 4 / 5
              </span>
              <span style={{ width: 1, height: 16, background: "var(--border-subtle)" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)" }}>
                <Icon name="clock" size={14} style={{ color: "var(--text-3)" }} /> сон 7:20
              </span>
              <span style={{ flex: 1 }} />
              <Badge tone="success" icon="repeat">стрик · 28</Badge>
            </div>

            {/* sections */}
            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Как день</h2>
              <p style={{ margin: 0, fontSize: 15, color: "var(--text)", lineHeight: 1.7 }}>
                Утро ровное. Встал в 7:40, сразу кофе и 20 минут с книгой — глава про <em>«habits as compounded interest»</em>.
                В голове крутится миграция меню — кажется, наконец сложилось.
              </p>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Что сделал</h2>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, color: "var(--text)", lineHeight: 1.8 }}>
                <li>Закрыл миграцию меню на staging — чек-суммы по La Maree сошлись.</li>
                <li>Созвонился с Анной по диплому, согласовали правки введения.</li>
                <li>Прогулка с Аней в парке Горького, поели гёзу.</li>
              </ul>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Благодарности</h2>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, color: "var(--text)", lineHeight: 1.8 }}>
                <li>Аня — за то, что помнит про мою книгу и не отвлекает по утрам.</li>
                <li>Дима из СТО — что взял Tucson вне очереди.</li>
                <li>Тёплая погода после дождливой недели.</li>
              </ul>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Что завтра</h2>
              <div style={{
                padding: "14px 16px",
                background: "var(--bg-elev-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {[
                  "Доделать миграцию меню — выкатить на prod",
                  "Дописать главу 2 диплома Анны",
                  "Оплатить ОСАГО до пятницы (срочно!)",
                ].map((t, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                    <Checkbox priority={i === 2 ? 1 : 3} />
                    {t}
                  </label>
                ))}
              </div>
            </section>

            {/* auto-attached today's tasks */}
            <section style={{
              padding: "14px 16px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="check" size={14} style={{ color: "var(--text-3)" }} />
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Закрытые задачи · 5 за день</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>авто</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { t: "Миграция меню — прогон на staging", p: "OpenResto", c: "--p-openresto" },
                  { t: "Звонок Анне — правки",                p: "Дипломы",   c: "--p-diploma" },
                  { t: "Записаться в спортзал на завтра",     p: "Здоровье",  c: "--p-health" },
                  { t: "Купить пионы Ане",                    p: "Аня",        c: "--p-girl" },
                  { t: "Подготовить демо для созвона",        p: "Youmin",   c: "--p-youmin" },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
                    <Icon name="check" size={13} style={{ color: "var(--text-3)" }} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-2)" }}>{t.t}</span>
                    <ProjectTag projectToken={t.c} label={t.p} size="sm" />
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, color: "var(--text-3)", fontSize: 12 }}>
              <Icon name="bookmark" size={13} />
              Связано с:
              <Badge tone="neutral">#миграция</Badge>
              <Badge tone="neutral">#daily</Badge>
              <span style={{ marginLeft: 8 }}>Backlinks · 3 заметки</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.NotesScreen = NotesScreen;
