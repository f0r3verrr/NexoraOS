/* CRM — клиенты с детальной страницей */

const CLIENTS = [
  { id: 1, n: "Анна Соколова", t: "Постоянный", c: "--p-diploma", projects: 3, total: 95_000, last: "сегодня",  email: "anna.s@list.ru", tg: "@annasok", tel: "+7 916 222 33 11", active: true, status: "В работе · Диплом", initials: "АС" },
  { id: 2, n: "Илья Кречет",   t: "Разовый",    c: "--p-diploma", projects: 1, total: 8_000,  last: "вчера",    email: "ilya.k@gmail.com", tg: "@ilyak",   tel: "+7 925 411 99 22", status: "В работе · Курсовая",  initials: "ИК" },
  { id: 3, n: "Лиза Морозова", t: "Разовый",    c: "--p-diploma", projects: 1, total: 3_500,  last: "3 дня",    email: "lizam@yandex.ru", tg: "—",        tel: "+7 903 555 88 44", status: "Оплачен",              initials: "ЛМ" },
  { id: 4, n: "Андрей Дубов",  t: "Постоянный", c: "--p-diploma", projects: 2, total: 78_000, last: "5 дней",   email: "andrey@dubov.dev", tg: "@adubov",  tel: "+7 911 777 11 22", status: "В работе · ВКР",       initials: "АД" },
  { id: 5, n: "Катя Романова", t: "Лид",        c: "--p-diploma", projects: 0, total: 0,      last: "вчера",    email: "—", tg: "@katyaromm", tel: "—",                                  status: "Новый · эссе",         initials: "КР" },
  { id: 6, n: "Студия «Лист»", t: "Постоянный", c: "--p-sites",   projects: 4, total: 220_000, last: "час",      email: "hello@list.studio", tg: "@list_studio", tel: "+7 495 222 11 00", status: "Лендинг · правки",   initials: "СЛ" },
  { id: 7, n: "Михаил Орлов",  t: "Разовый",    c: "--p-sites",   projects: 1, total: 35_000, last: "неделя",   email: "morlov@gmail.com", tg: "@morlov", tel: "+7 916 888 11 22",   status: "Готов · ждёт оплаты", initials: "МО" },
  { id: 8, n: "Pavel Studio",   t: "Лид",        c: "--p-bots",    projects: 0, total: 0,      last: "2 нед",    email: "pavel@studio.io", tg: "@pavel_st", tel: "—",                  status: "Не отвечает",          initials: "PS" },
];

const STATUS_TONE_CRM = {
  "В работе": "warn",
  "Готов": "success",
  "Оплачен": "success",
  "Новый": "info",
  "Лендинг": "warn",
  "Не отвечает": "neutral",
};

function ClientRow({ c, active }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr 100px 100px 110px 110px 24px",
      gap: 12, alignItems: "center",
      padding: "12px 16px",
      width: "100%",
      borderBottom: "1px solid var(--border-subtle)",
      background: active ? "var(--bg-elev-2)" : "transparent",
      borderLeft: active ? `2px solid var(${c.c})` : "2px solid transparent",
      marginLeft: active ? -2 : 0,
      cursor: "pointer",
    }}>
      <Avatar initials={c.initials} color={`var(${c.c})`} size={32} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: active ? 500 : 400 }}>{c.n}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{c.status}</span>
      </div>
      <Badge tone={c.t === "Постоянный" ? "success" : c.t === "Лид" ? "info" : "neutral"} variant="soft">{c.t}</Badge>
      <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)", textAlign: "right" }}>
        {c.projects} {c.projects === 1 ? "проект" : "проекта"}
      </span>
      <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500, textAlign: "right" }}>
        {c.total.toLocaleString("ru-RU")} ₽
      </span>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textAlign: "right" }}>{c.last}</span>
      <IconButton icon="more" size="sm" />
    </div>
  );
}

function ClientDetail() {
  const c = CLIENTS[0]; // Anna
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        padding: "20px 22px",
        background: `linear-gradient(180deg, color-mix(in oklab, var(${c.c}) 14%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 100%)`,
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initials={c.initials} color={`var(${c.c})`} size={56} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: `var(${c.c})`, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
              {c.t}
            </span>
            <span style={{ fontSize: 20, color: "var(--text)", fontWeight: 500, letterSpacing: "-0.01em" }}>{c.n}</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>работаем с марта 2025 · 14 месяцев</span>
          </div>
          <IconButton icon="more" />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="primary" size="sm" icon="message">Написать</Button>
          <Button variant="secondary" size="sm" icon="phone">Позвонить</Button>
          <Button variant="ghost" size="sm" icon="calendar">Запланировать</Button>
        </div>
      </div>

      <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* contacts */}
        <section>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Контакты</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { i: "message", l: c.email, sub: "email" },
              { i: "send",    l: c.tg,    sub: "Telegram" },
              { i: "phone",   l: c.tel,   sub: "телефон" },
            ].map((row) => (
              <div key={row.sub} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 10px",
                background: "var(--bg-elev-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
              }}>
                <Icon name={row.i} size={14} style={{ color: "var(--text-3)" }} />
                <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{row.l}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{row.sub}</span>
                </span>
                <IconButton icon="external" size="sm" />
              </div>
            ))}
          </div>
        </section>

        {/* stats */}
        <section>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Сводка</span>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: "Заработано всего", v: "95 000 ₽" },
              { l: "Проектов",          v: "3" },
              { l: "Средний чек",       v: "31 600 ₽" },
              { l: "Дней до оплаты",    v: "12 ср." },
            ].map((s) => (
              <div key={s.l} style={{
                padding: "10px 12px",
                background: "var(--bg-elev-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.l}</span>
                <span style={{ fontSize: 15, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* projects */}
        <section>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>История проектов</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { p: "Диплом · экономика",   amt: "30 000 ₽", status: "В работе", due: "до 28 мая",  active: true },
              { p: "Курсовая · маркетинг", amt: "12 000 ₽", status: "Оплачен",  due: "март 2026" },
              { p: "Реферат · ВЭД",        amt: "5 000 ₽",  status: "Оплачен",  due: "ноябрь 2025" },
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px",
                background: p.active ? `color-mix(in oklab, var(${c.c}) 10%, var(--bg-elev-1))` : "var(--bg-elev-2)",
                border: `1px solid ${p.active ? `color-mix(in oklab, var(${c.c}) 25%, var(--border-subtle))` : "var(--border-subtle)"}`,
                borderRadius: 8,
              }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{p.p}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{p.due}</span>
                </div>
                <Badge tone={p.status === "Оплачен" ? "success" : "warn"} dot>{p.status}</Badge>
                <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)", minWidth: 80, textAlign: "right" }}>{p.amt}</span>
              </div>
            ))}
          </div>
        </section>

        {/* notes / context */}
        <section>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Контекст</span>
          <div style={{
            marginTop: 10, padding: "12px 14px",
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            fontSize: 13, color: "var(--text-2)", lineHeight: 1.6,
          }}>
            Магистратура ВШЭ, экономика. Пишет грамотно, правки минимальные.
            Платит без задержек, обычно 50/50. Любит подробные комментарии в правках.
            Пришла по рекомендации от Димы (2024).
          </div>
        </section>
      </div>
    </div>
  );
}

function CrmScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="CRM" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="база клиентов"
          title="Все клиенты"
          sub="38 контактов · 6 активных · 7 постоянных"
          right={<>
            <Input icon="search" placeholder="Найти клиента, проект…" size="sm" style={{ width: 280 }} />
            <Button variant="ghost" size="sm" icon="sort">Активность</Button>
            <Button variant="secondary" size="sm" icon="plus">Контакт</Button>
          </>}
        />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* clients list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 100px 100px 110px 110px 24px",
              gap: 12, alignItems: "center",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-elev-2)",
              fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              <span style={{ width: 32 }} />
              <span>Клиент / статус</span>
              <span>Тип</span>
              <span style={{ textAlign: "right" }}>Проектов</span>
              <span style={{ textAlign: "right" }}>Заработано</span>
              <span style={{ textAlign: "right" }}>Контакт</span>
              <span />
            </div>
            <div className="ws-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {CLIENTS.map((c) => <ClientRow key={c.id} c={c} active={c.active} />)}
            </div>
          </div>

          {/* detail panel */}
          <aside style={{
            width: 380, flex: "none",
            borderLeft: "1px solid var(--border-subtle)",
            background: "var(--bg)",
            display: "flex", flexDirection: "column",
            minHeight: 0,
          }}>
            <ClientDetail />
          </aside>
        </div>
      </main>
    </div>
  );
}

window.CrmScreen = CrmScreen;
