/* Inbox — быстрый захват мыслей */

const INBOX = [
  {
    when: "только что",
    text: "Заказать букет для мамы на день рождения — 3 июня. Любит пионы, белые и нежно-розовые. Доставка с утра.",
    src: "telegram",
    suggest: ["задача", "напоминание"],
    suggestProj: "--p-family",
  },
  {
    when: "сегодня 09:14",
    text: "Идея для бота: автозапись напоминаний в Inbox через voice-message → транскрипция → парсинг.",
    src: "web",
    suggest: ["заметка"],
    suggestProj: "--p-bots",
  },
  {
    when: "сегодня 08:40",
    text: "Спросить у клиента OpenResto, нужен ли отдельный раздел «вынос». В исходном ТЗ не было, но в чате упоминали.",
    src: "voice",
    duration: "0:23",
    suggest: ["задача"],
    suggestProj: "--p-openresto",
  },
  {
    when: "вчера 22:11",
    text: "Книгу «Atomic Habits» — допрочитать главу 6 про привычки + перенести 3 идеи в систему.",
    src: "web",
    suggest: ["задача"],
    suggestProj: "--p-health",
  },
  {
    when: "вчера 20:55",
    text: "Андрей со студии прислал контакты подрядчика по фото — Сергей, +7 925 333 11 88. Может пригодиться для лендинга салона.",
    src: "telegram",
    suggest: ["контакт", "заметка"],
    suggestProj: "--p-sites",
  },
  {
    when: "вчера 18:32",
    text: "Машина — мигнул чек давления в шине, надо проверить переднюю правую.",
    src: "voice",
    duration: "0:11",
    suggest: ["задача"],
    suggestProj: "--p-car",
  },
  {
    when: "позавчера",
    text: "Дима из универа просит дать совет по ML-курсу. Запланировать звонок на выходные.",
    src: "email",
    suggest: ["задача", "напоминание"],
    suggestProj: "--p-family",
  },
];

const SRC_ICON = { telegram: "send", web: "globe", voice: "mic", email: "message" };

function InboxRow({ item }) {
  return (
    <div style={{
      display: "flex", gap: 14,
      padding: "16px 18px",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 999,
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-3)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flex: "none",
      }}>
        <Icon name={SRC_ICON[item.src]} size={13} />
      </span>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          <span>{item.when}</span>
          {item.duration && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="mic" size={11} /> {item.duration}</span>}
        </div>

        <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{item.text}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {item.suggest.map((s) => {
            const map = {
              "задача":      { i: "check", c: "var(--p-openresto)" },
              "заметка":     { i: "note",  c: "var(--p-sites)" },
              "напоминание": { i: "bell",  c: "var(--warn)" },
              "контакт":     { i: "users", c: "var(--p-family)" },
            }[s];
            return (
              <button key={s} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 26, padding: "0 10px",
                background: `color-mix(in oklab, ${map.c} 12%, transparent)`,
                color: map.c,
                border: `1px solid color-mix(in oklab, ${map.c} 26%, transparent)`,
                borderRadius: 6, fontSize: 12, fontWeight: 500,
              }}>
                <Icon name={map.i} size={12} /> {s}
              </button>
            );
          })}
          <span style={{ width: 1, height: 18, background: "var(--border-subtle)", margin: "0 2px" }} />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "var(--text-3)",
          }}>
            <Icon name="folder" size={12} />
            предложено →
          </span>
          <ProjectTag projectToken={item.suggestProj} label={
            item.suggestProj === "--p-family" ? "Семья"
            : item.suggestProj === "--p-bots" ? "Боты"
            : item.suggestProj === "--p-openresto" ? "OpenResto"
            : item.suggestProj === "--p-health" ? "Здоровье"
            : item.suggestProj === "--p-sites" ? "Сайты"
            : "Машина"
          } />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: "none" }}>
        <IconButton icon="snooze" title="Отложить" />
        <IconButton icon="check"  title="Готово" />
        <IconButton icon="trash"  title="Удалить" />
      </div>
    </div>
  );
}

function InboxCapture() {
  return (
    <div style={{
      padding: "20px 22px",
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px 18px",
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 10,
        minHeight: 92,
      }}>
        <Icon name="zap" size={18} style={{ color: "var(--text-3)", marginTop: 2 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Что не забыть? Просто запиши — разберёшь позже.
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Поддерживается голос. Можно перетащить файл — он привяжется к мысли.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconButton icon="paperclip" />
          <button style={{
            width: 40, height: 40, borderRadius: 999,
            background: "color-mix(in oklab, var(--danger) 14%, transparent)",
            color: "var(--danger)",
            border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="mic" size={16} />
          </button>
          <Button variant="primary" icon="send">В Inbox</Button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text-3)" }}>
        <span>Источники захвата:</span>
        {[
          { i: "send",    l: "Telegram-бот" },
          { i: "message", l: "Email-to-inbox" },
          { i: "globe",   l: "Web-расширение" },
          { i: "mic",     l: "Голос" },
        ].map((s) => (
          <span key={s.l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name={s.i} size={12} /> {s.l}
          </span>
        ))}
      </div>
    </div>
  );
}

function InboxScreen() {
  const total = INBOX.length;
  const done = 0;
  const remain = total - done;

  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Inbox" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="разбор · 2–3 минуты"
          title="Inbox"
          sub={`${remain} ждут разбора`}
          right={<>
            <Button variant="ghost" size="sm" icon="filter">Источник</Button>
            <Button variant="ghost" size="sm" icon="sort">Свежие сверху</Button>
            <Button variant="secondary" size="sm" icon="check">Разобрать всё</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px 24px" }}>
          {/* progress */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            padding: "14px 18px",
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Inbox Zero</span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 22, color: "var(--text)",
                letterSpacing: "-0.02em",
              }}>{remain} <span style={{ color: "var(--text-3)", fontSize: 14 }}>осталось</span></span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                <span>за неделю разобрано 41</span>
                <span>в среднем 2 ч на разбор</span>
              </div>
              <Progress value={(done / total) * 100} color="var(--p-health)" height={4} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Badge tone="info"   dot>задач · 4</Badge>
              <Badge tone="neutral" dot>заметок · 2</Badge>
              <Badge tone="warn"   dot>напоминаний · 2</Badge>
              <Badge tone="success" dot>контактов · 1</Badge>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <InboxCapture />
          </div>

          <div style={{
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>Не разобрано · {total}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                ← → переключение · E готово · S отложить
              </span>
            </div>
            <div>
              {INBOX.map((it, i) => <InboxRow key={i} item={it} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.InboxScreen = InboxScreen;
