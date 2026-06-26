/* Print app — renders every artboard as its own paged page (no canvas chrome) */

const PRINT_PAGES = [
  { type: "cover", title: "NexoraOS", subtitle: "Личное рабочее пространство — дизайн-система и экраны", date: "май 2026" },

  /* — FOUNDATION — */
  { type: "section", n: "01", title: "Фундамент", subtitle: "Палитра · типографика · скругления · иконки" },
  { type: "artboard", label: "Палитра — поверхности и текст",   w: 560, h: 780, render: () => <ColorTokensCard /> },
  { type: "artboard", label: "Проектные цвета",                  w: 560, h: 520, render: () => <ProjectPaletteCard /> },
  { type: "artboard", label: "Типографика · Geist",              w: 620, h: 520, render: () => <TypographyCard /> },
  { type: "artboard", label: "Радиусы · отступы · тени",         w: 620, h: 540, render: () => <RadiiSpacingCard /> },
  { type: "artboard", label: "Иконографика · Lucide",            w: 620, h: 420, render: () => <IconographyCard /> },

  /* — COMPONENTS — */
  { type: "section", n: "02", title: "Компоненты", subtitle: "Атомы интерфейса — собраны из токенов" },
  { type: "artboard", label: "Кнопки",                               w: 620, h: 380, render: () => <ButtonsCard /> },
  { type: "artboard", label: "Поля и поиск (NLP-парсер)",            w: 620, h: 380, render: () => <InputsCard /> },
  { type: "artboard", label: "Бейджи · теги · приоритеты",           w: 620, h: 460, render: () => <BadgesCard /> },
  { type: "artboard", label: "Tabs · прогресс · tooltip · toast",    w: 620, h: 460, render: () => <OverlaysCard /> },
  { type: "artboard", label: "Dropdown · поиск ⌘K",                 w: 680, h: 440, render: () => <DropdownCard /> },

  /* — NAV VARIANTS — */
  { type: "section", n: "03", title: "Навигация · 4 направления", subtitle: "V1 (рейка + панель) принят как основной" },
  { type: "artboard", label: "V1 · Рейка + контекстная панель (выбрано)", w: 640, h: 900, render: () => <SidebarV1 /> },
  { type: "artboard", label: "V2 · Карточки областей жизни",             w: 580, h: 900, render: () => <SidebarV2 /> },
  { type: "artboard", label: "V3 · Чистая рейка — всё в ⌘K",              w: 420, h: 900, render: () => <SidebarV3 /> },
  { type: "artboard", label: "V4 · Брифинг — sidebar как сводка дня",     w: 560, h: 900, render: () => <SidebarV4 /> },

  /* — SCREENS — */
  { type: "section", n: "04", title: "Экраны", subtitle: "Полноразмерные макеты 1440 ширины" },
  { type: "artboard", label: "Дашборд — главный экран",         w: 1440, h: 1380, render: () => <DashboardScreen /> },
  { type: "artboard", label: "Сегодня — фокус дня",              w: 1440, h: 920,  render: () => <TodayScreen /> },
  { type: "artboard", label: "Inbox — захват мыслей",             w: 1440, h: 1100, render: () => <InboxScreen /> },
  { type: "artboard", label: "Календарь — неделя",                w: 1440, h: 920,  render: () => <CalendarScreen /> },
  { type: "artboard", label: "Задача · drawer над экраном",        w: 1440, h: 920,  render: () => <TaskDrawerScreen /> },
  { type: "artboard", label: "Проект · детальная (Дипломы)",      w: 1440, h: 1240, render: () => <ProjectDetailScreen /> },

  /* — PERSONAL — */
  { type: "section", n: "05", title: "Личные модули", subtitle: "Уникальная часть — машина, отношения, дом" },
  { type: "artboard", label: "Машина — сроки, ТО, расход", w: 1440, h: 1100, render: () => <CarModule /> },
  { type: "artboard", label: "Аня — отношения",             w: 1440, h: 1200, render: () => <GirlModule /> },
  { type: "artboard", label: "Дом и подписки",              w: 1440, h: 1240, render: () => <HomeModule /> },

  /* — KNOWLEDGE — */
  { type: "section", n: "06", title: "Знания и хранилища", subtitle: "Заметки · Дневник · Файлы" },
  { type: "artboard", label: "Заметки — три колонки + редактор", w: 1440, h: 1200, render: () => <NotesScreen /> },
  { type: "artboard", label: "Дневник — heatmap и трекинг",       w: 1440, h: 1400, render: () => <JournalScreen /> },
  { type: "artboard", label: "Файлы — сетка с превью",            w: 1440, h: 1200, render: () => <FilesScreen /> },

  /* — PLANNING — */
  { type: "section", n: "07", title: "Планирование и связи", subtitle: "CRM · Гантт · Канбан с календарём" },
  { type: "artboard", label: "CRM — клиенты + детальная панель",   w: 1440, h: 920, render: () => <CrmScreen /> },
  { type: "artboard", label: "Гантт — план на квартал",             w: 1440, h: 760, render: () => <GanttScreen /> },
  { type: "artboard", label: "Канбан + календарь",                  w: 1440, h: 920, render: () => <KanbanScreen /> },

  /* — BRAND — */
  { type: "section", n: "08", title: "Бренд", subtitle: "10 концепций логотипа NexoraOS · работают на 88 / 32 / 22 px" },
  { type: "artboard", label: "Логотип — базовый набор (4)",         w: 1280, h: 900, render: () => <BrandCanvas /> },
  { type: "artboard", label: "Логотип — расширенный набор (6)",     w: 1700, h: 900, render: () => <BrandCanvasMore /> },

  /* — MONEY & GOALS — */
  { type: "section", n: "09", title: "Финансы и цели", subtitle: "Деньги · цели на год / месяц / неделю · привычки" },
  { type: "artboard", label: "Финансы — заказы, доход, прогноз",    w: 1440, h: 1240, render: () => <FinancesScreen /> },
  { type: "artboard", label: "Цели и привычки",                      w: 1440, h: 1400, render: () => <GoalsScreen /> },
];

const PAGE_W = 1600;
const PAGE_H = 1100;
const PAD = 36;
const HEADER_H = 56;

function ArtboardPage({ p, idx, total }) {
  const availW = PAGE_W - PAD * 2;
  const availH = PAGE_H - PAD * 2 - HEADER_H - 20;
  const scale = Math.min(availW / p.w, availH / p.h, 1);

  return (
    <div className="print-page">
      <header className="print-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
            {String(idx).padStart(3, "0")} / {String(total).padStart(3, "0")}
          </span>
          <span style={{ width: 1, height: 14, background: "var(--border)" }} />
          <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{p.label}</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {p.w} × {p.h} · scale {(scale * 100).toFixed(0)}%
        </span>
      </header>
      <div className="print-body">
        <div className="print-artboard" style={{
          width: p.w, height: p.h,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          border: "1px solid var(--border-subtle)",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--bg)",
        }}>
          {p.render()}
        </div>
      </div>
    </div>
  );
}

function SectionPage({ n, title, subtitle }) {
  return (
    <div className="print-page section-page">
      <div style={{
        display: "flex", flexDirection: "column", gap: 24,
        padding: "0 100px",
      }}>
        <span style={{
          fontSize: 80, color: "var(--text-muted)",
          fontFamily: "var(--font-mono)", fontWeight: 500,
          letterSpacing: "-0.03em", lineHeight: 1,
        }}>{n}</span>
        <h1 style={{
          margin: 0, fontSize: 72, fontWeight: 500,
          letterSpacing: "-0.025em", color: "var(--text)", lineHeight: 1.05,
        }}>{title}</h1>
        <p style={{
          margin: 0, fontSize: 22, color: "var(--text-3)",
          lineHeight: 1.4, maxWidth: 800,
        }}>{subtitle}</p>
      </div>
    </div>
  );
}

function CoverPage({ title, subtitle, date }) {
  return (
    <div className="print-page cover-page">
      <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "0 100px" }}>
        <span style={{ fontSize: 13, color: "var(--text-3)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
          {date}
        </span>
        <h1 style={{
          margin: 0, fontSize: 140, fontWeight: 500,
          letterSpacing: "-0.04em", color: "var(--text)", lineHeight: 1,
        }}>{title}</h1>
        <p style={{
          margin: 0, fontSize: 28, color: "var(--text-2)",
          lineHeight: 1.4, maxWidth: 900,
        }}>{subtitle}</p>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {["--p-openresto","--p-youmin","--p-diploma","--p-sites","--p-bots","--p-girl","--p-family","--p-car","--p-home","--p-health"].map((c) => (
            <span key={c} style={{
              width: 36, height: 36, borderRadius: 9,
              background: `var(${c})`,
            }} />
          ))}
        </div>

        <div style={{
          marginTop: 80,
          paddingTop: 24,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", justifyContent: "space-between",
          fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)",
        }}>
          <span>дизайн-система · 32 экрана · тёмная тема</span>
          <span>desktop 1440 · Geist Sans</span>
        </div>
      </div>
    </div>
  );
}

function PrintApp() {
  const artboards = PRINT_PAGES.filter((p) => p.type === "artboard");
  let idx = 0;
  return (
    <>
      {PRINT_PAGES.map((p, i) => {
        if (p.type === "cover")    return <CoverPage    key={i} {...p} />;
        if (p.type === "section")  return <SectionPage  key={i} {...p} />;
        idx++;
        return <ArtboardPage key={i} p={p} idx={idx} total={artboards.length} />;
      })}
    </>
  );
}

const printRoot = ReactDOM.createRoot(document.getElementById("root"));
printRoot.render(<PrintApp />);

/* Auto-print once fonts have loaded and Babel finished its work */
(async () => {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  // Wait for all babel-transformed scripts to register their components
  await new Promise((r) => setTimeout(r, 1500));
  window.print();
})();
