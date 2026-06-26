/* Task drawer — modal/drawer для просмотра одной задачи */

const TASK = {
  title: "Доделать миграцию старого меню на новую схему БД",
  project: { token: "--p-openresto", label: "OpenResto · Dev" },
  due: "сегодня 11:00",
  priority: 1,
  estimate: "~ 2 ч",
  stuck: 4,
  description: `Старая схема \`menu_v1\` хранит позиции с дублированием по ресторанам. Новая модель — \`menu_items\` + \`menu_assignments\` через many-to-many.\n\n**План:**\n1. Скрипт миграции с маппингом ID\n2. Прогнать на staging-копии\n3. Сверить чек-суммы по 3 ресторанам\n4. Обновить API-ручки`,
  subtasks: [
    { t: "Написать миграцию menu_v1 → menu_items", done: true },
    { t: "Сделать дамп staging и прогнать локально", done: true },
    { t: "Сверить чек-суммы по La Maree, Erwin, Probka", done: false },
    { t: "Обновить /api/v2/menu — отдавать новую схему", done: false },
    { t: "Снести старую схему после 2 недель работы", done: false },
  ],
  attachments: [
    { name: "schema-v2.png",        size: "412 КБ", icon: "file" },
    { name: "migration-plan.md",    size: "8 КБ",   icon: "note" },
    { name: "checksum-report.csv",  size: "2 КБ",   icon: "file" },
  ],
  related: [
    { i: "users", l: "Максим (CTO)",   sub: "Контакт" },
    { i: "note",  l: "ADR-12: миграции", sub: "Заметка" },
    { i: "layers",l: "OpenResto · MVP", sub: "Проект" },
  ],
  log: [
    { who: "ты",   what: "перенёс срок c понедельника на сегодня", when: "вчера 22:11" },
    { who: "ты",   what: "прикрепил migration-plan.md",            when: "пн 18:30" },
    { who: "Макс", what: "оставил комментарий: «жду к среде»",       when: "пн 14:02" },
    { who: "ты",   what: "создал задачу",                            when: "пн 09:00" },
  ],
};

function DrawerField({ icon, label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "108px 1fr", alignItems: "center", padding: "8px 0" }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "var(--text-3)",
      }}>
        <Icon name={icon} size={13} />
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{children}</span>
    </div>
  );
}

function TaskDrawerInner() {
  const doneCount = TASK.subtasks.filter((s) => s.done).length;

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--bg-elev-1)",
      borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      boxShadow: "var(--shadow-2)",
    }}>
      {/* header */}
      <header style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 10,
        flex: "none",
      }}>
        <Checkbox priority={TASK.priority} />
        <ProjectTag projectToken={TASK.project.token} label={TASK.project.label} />
        <span style={{ flex: 1 }} />
        <Badge tone="warn" icon="flag">застряло {TASK.stuck} дн</Badge>
        <IconButton icon="external" title="Открыть на весь экран" />
        <IconButton icon="more" />
        <IconButton icon="x" title="Закрыть" />
      </header>

      <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px 28px" }}>
        {/* title (inline-editable feel) */}
        <h1 style={{
          margin: 0,
          fontSize: 22, fontWeight: 500, color: "var(--text)",
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
          padding: "4px 6px",
          marginLeft: -6, marginRight: -6,
          borderRadius: 6,
        }}>
          {TASK.title}
        </h1>

        {/* meta grid */}
        <div style={{
          marginTop: 14,
          background: "var(--bg-elev-2)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 10,
          padding: "4px 14px",
        }}>
          <DrawerField icon="calendar" label="Срок">
            <span style={{ fontFamily: "var(--font-mono)" }}>{TASK.due}</span>
            <Badge tone="danger" style={{ marginLeft: 8 }}>через 2 ч</Badge>
          </DrawerField>
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <DrawerField icon="flag" label="Приоритет">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--danger)" }} />
              !p1 — срочно
            </span>
          </DrawerField>
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <DrawerField icon="clock" label="Оценка">
            <span style={{ fontFamily: "var(--font-mono)" }}>{TASK.estimate}</span>
            <span style={{ color: "var(--text-3)", marginLeft: 8 }}>фактически 0:00</span>
          </DrawerField>
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <DrawerField icon="repeat" label="Повтор">
            <span style={{ color: "var(--text-3)" }}>—</span>
          </DrawerField>
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <DrawerField icon="bell" label="Напомнить">
            <span style={{ color: "var(--text-3)" }}>за 30 мин · push, Telegram</span>
          </DrawerField>
          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <DrawerField icon="bookmark" label="Теги">
            <span style={{ display: "inline-flex", gap: 6 }}>
              <Badge tone="neutral">#миграция</Badge>
              <Badge tone="neutral">#db</Badge>
              <Badge tone="neutral">#sprint-7</Badge>
            </span>
          </DrawerField>
        </div>

        {/* description */}
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Описание</span>
            <IconButton icon="edit" size="sm" />
          </div>
          <div style={{
            padding: "14px 16px",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            fontSize: 13, color: "var(--text)", lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}>
            Старая схема <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-elev-3)", padding: "1px 5px", borderRadius: 4 }}>menu_v1</code> хранит позиции с дублированием по ресторанам. Новая модель — <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-elev-3)", padding: "1px 5px", borderRadius: 4 }}>menu_items</code> + <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-elev-3)", padding: "1px 5px", borderRadius: 4 }}>menu_assignments</code> через many-to-many.
            {"\n\n"}
            <strong style={{ fontWeight: 500 }}>План:</strong>
            <ol style={{ paddingLeft: 22, margin: "6px 0 0", lineHeight: 1.7 }}>
              <li>Скрипт миграции с маппингом ID</li>
              <li>Прогнать на staging-копии</li>
              <li>Сверить чек-суммы по 3 ресторанам</li>
              <li>Обновить API-ручки</li>
            </ol>
          </div>
        </section>

        {/* subtasks */}
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Подзадачи</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{doneCount} / {TASK.subtasks.length}</span>
            <span style={{ flex: 1 }} />
            <IconButton icon="plus" size="sm" />
          </div>
          <div style={{
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            overflow: "hidden",
          }}>
            {TASK.subtasks.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                borderBottom: i === TASK.subtasks.length - 1 ? "none" : "1px solid var(--border-subtle)",
              }}>
                <Checkbox checked={s.done} priority={3} />
                <span style={{
                  flex: 1, fontSize: 13,
                  color: s.done ? "var(--text-muted)" : "var(--text)",
                  textDecoration: s.done ? "line-through" : "none",
                }}>{s.t}</span>
              </div>
            ))}
            <Progress value={(doneCount / TASK.subtasks.length) * 100} color="var(--p-openresto)" height={2} />
          </div>
        </section>

        {/* attachments + related — two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Вложения</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{TASK.attachments.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {TASK.attachments.map((a) => (
                <div key={a.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  fontSize: 12, color: "var(--text)",
                }}>
                  <Icon name={a.icon} size={14} style={{ color: "var(--text-3)" }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{a.size}</span>
                </div>
              ))}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 10px",
                background: "transparent",
                border: "1px dashed var(--border)",
                borderRadius: 8,
                fontSize: 12, color: "var(--text-muted)",
              }}>
                <Icon name="paperclip" size={13} />
                перетащи файл сюда
              </div>
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Связано</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{TASK.related.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {TASK.related.map((r) => (
                <div key={r.l} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}>
                  <Icon name={r.i} size={14} style={{ color: "var(--text-3)" }} />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.l}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{r.sub}</span>
                  </div>
                  <Icon name="chevron_right" size={13} style={{ color: "var(--text-muted)" }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* activity */}
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Активность</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 8 }}>
            {TASK.log.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", alignItems: "center", fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-muted)", flex: "none" }} />
                <span style={{ color: "var(--text)" }}>{l.who}</span>
                <span style={{ color: "var(--text-2)", flex: 1 }}>{l.what}</span>
                <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{l.when}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* footer composer */}
      <footer style={{
        flex: "none",
        borderTop: "1px solid var(--border-subtle)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--bg-elev-1)",
      }}>
        <Avatar initials="К" color="var(--p-openresto)" size={26} />
        <Input placeholder="Добавить комментарий…" style={{ flex: 1 }} />
        <Button variant="primary" icon="send">Отправить</Button>
      </footer>
    </div>
  );
}

/* The drawer over a dimmed dashboard preview, presented as a 1440 artboard */
function TaskDrawerScreen() {
  return (
    <div className="app-surface" style={{ position: "relative", height: "100%", display: "flex" }}>
      {/* dimmed background showing the today screen behind */}
      <div style={{ flex: 1, position: "relative", minWidth: 0, opacity: 0.55, filter: "blur(0.4px)" }}>
        <TodayScreen />
        <div style={{ position: "absolute", inset: 0, background: "color-mix(in oklab, var(--bg) 50%, transparent)" }} />
      </div>

      {/* drawer */}
      <div style={{
        width: 540, flex: "none",
        position: "relative",
        zIndex: 2,
      }}>
        <TaskDrawerInner />
      </div>
    </div>
  );
}

window.TaskDrawerScreen = TaskDrawerScreen;
