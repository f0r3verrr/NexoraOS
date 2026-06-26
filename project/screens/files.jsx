/* Файлы — хранилище с превью */

const FILES = [
  { t: "PDF", n: "Договор-Анна-2026.pdf",        s: "412 КБ", proj: "--p-diploma",   tag: "Дипломы",      d: "5 мин",      preview: "pdf" },
  { t: "DOCX", n: "Диплом-Анна-v3.docx",         s: "2.1 МБ", proj: "--p-diploma",   tag: "Дипломы",      d: "1 ч",        preview: "doc" },
  { t: "PNG", n: "Скан СТС.jpg",                  s: "1.4 МБ", proj: "--p-car",       tag: "Машина",       d: "вчера",      preview: "img", color: "--p-car" },
  { t: "PDF", n: "ОСАГО-2026.pdf",                s: "180 КБ", proj: "--p-car",       tag: "Машина",       d: "вчера",      preview: "pdf" },
  { t: "PDF", n: "Чек MacBook Pro.pdf",           s: "94 КБ",  proj: "--p-home",      tag: "Дом",          d: "пн",         preview: "pdf" },
  { t: "MD",  n: "Архитектура нового меню.md",   s: "12 КБ",  proj: "--p-openresto", tag: "OpenResto",   d: "пн",         preview: "md" },
  { t: "PNG", n: "Лого-студия-v4.png",           s: "320 КБ", proj: "--p-sites",     tag: "Сайты",        d: "3 дн",       preview: "img", color: "--p-sites" },
  { t: "JPG", n: "Аня · парк Горького.jpg",       s: "3.2 МБ", proj: "--p-girl",      tag: "Аня",          d: "3 дн",       preview: "img", color: "--p-girl" },
  { t: "PDF", n: "Грамота · хакатон 2024.pdf",   s: "560 КБ", proj: null,            tag: "Дипломы и грамоты", d: "неделя", preview: "pdf" },
  { t: "DOCX", n: "Курсовая-Илья.docx",          s: "1.8 МБ", proj: "--p-diploma",   tag: "Дипломы",      d: "неделя",     preview: "doc" },
  { t: "PDF", n: "Сертификат · ISTQB.pdf",       s: "240 КБ", proj: "--p-youmin",    tag: "Сертификаты", d: "2 нед",      preview: "pdf" },
  { t: "PNG", n: "Macbook · бой клавиш.jpg",     s: "2.4 МБ", proj: "--p-home",      tag: "Дом",          d: "2 нед",      preview: "img", color: "--p-home" },
];

const FILE_TYPE_COLOR = {
  PDF:  "var(--danger)",
  DOCX: "var(--info)",
  MD:   "var(--text-2)",
  PNG:  "var(--p-girl)",
  JPG:  "var(--p-girl)",
};

function FileTile({ f }) {
  return (
    <div style={{
      background: "var(--bg-elev-1)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      transition: "border-color 120ms, transform 120ms",
    }}>
      {/* preview */}
      <div style={{
        aspectRatio: "5/4",
        background: f.preview === "img"
          ? `repeating-linear-gradient(135deg, color-mix(in oklab, var(${f.color || "--text-3"}) 16%, var(--bg-elev-2)) 0 6px, color-mix(in oklab, var(${f.color || "--text-3"}) 26%, var(--bg-elev-2)) 6px 12px)`
          : f.preview === "pdf"
          ? "color-mix(in oklab, var(--danger) 6%, var(--bg-elev-2))"
          : f.preview === "doc"
          ? "color-mix(in oklab, var(--info) 6%, var(--bg-elev-2))"
          : "var(--bg-elev-2)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {f.preview === "img" ? (
          <span style={{ fontSize: 11, color: "color-mix(in oklab, var(--text) 60%, var(--text-3))", fontFamily: "var(--font-mono)" }}>фото</span>
        ) : f.preview === "md" ? (
          <div style={{
            width: "75%",
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {[100, 70, 55, 90, 40, 80, 60].map((w, i) => (
              <span key={i} style={{ width: `${w}%`, height: 4, borderRadius: 2, background: "var(--text-muted)", opacity: 0.4 }} />
            ))}
          </div>
        ) : (
          <Icon name="file" size={36} style={{ color: f.preview === "pdf" ? "var(--danger)" : "var(--info)", opacity: 0.7 }} />
        )}

        <span style={{
          position: "absolute", top: 8, left: 8,
          padding: "2px 6px",
          background: "color-mix(in oklab, var(--bg) 80%, transparent)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 4,
          fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 500,
          color: FILE_TYPE_COLOR[f.t] || "var(--text-3)",
        }}>{f.t}</span>
      </div>

      {/* meta */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{
          fontSize: 13, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{f.n}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
          {f.proj && <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(${f.proj})` }} />}
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.tag}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{f.s}</span>
        </div>
      </div>
    </div>
  );
}

function FilesScreen() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Файлы" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="хранилище · все"
          title="Файлы"
          sub="412 файлов · 8.4 ГБ из 50"
          right={<>
            <Input icon="search" placeholder="Найти по содержимому…" size="sm" style={{ width: 280 }} />
            <Button variant="ghost" size="sm" icon="sort">Дата · ↓</Button>
            <Button variant="secondary" size="sm" icon="paperclip">Загрузить</Button>
          </>}
        />

        {/* sub bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "12px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <Tabs items={["Сетка", "Список", "По проектам"]} active="Сетка" />
          <span style={{ width: 1, height: 16, background: "var(--border-subtle)" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <Badge tone="info" dot>PDF · 124</Badge>
            <Badge tone="neutral" dot>DOCX · 64</Badge>
            <Badge tone="success" dot>Изображения · 148</Badge>
            <Badge tone="warn" dot>MD · 34</Badge>
          </div>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>выбрано 0 · перетащи файл сюда чтобы загрузить</span>
        </div>

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px" }}>
          {/* drop zone */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px 18px",
            background: "color-mix(in oklab, var(--text) 2%, var(--bg-elev-1))",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            marginBottom: 20,
            color: "var(--text-2)",
          }}>
            <Icon name="paperclip" size={18} style={{ color: "var(--text-3)" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, color: "var(--text)" }}>Перетащи файлы сюда</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                Или укажи задачу / заметку — файл привяжется автоматически. Поиск работает по содержимому PDF.
              </span>
            </div>
            <Button variant="secondary" size="sm">Выбрать файлы</Button>
          </div>

          {/* groups */}
          {[
            { l: "Сегодня",        items: FILES.slice(0, 4) },
            { l: "На этой неделе", items: FILES.slice(4, 8) },
            { l: "Раньше",          items: FILES.slice(8) },
          ].map((g) => (
            <div key={g.l} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{g.l}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{g.items.length}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 14,
              }}>
                {g.items.map((f) => <FileTile key={f.n} f={f} />)}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

window.FilesScreen = FilesScreen;
