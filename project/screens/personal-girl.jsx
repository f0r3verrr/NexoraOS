/* Personal module — Аня (отношения) */

const GIFT_IDEAS = [
  { l: "Кольцо Tiffany T1 (размер 16.5)",      tag: "ДР · крупный",   status: "оставить" },
  { l: "Букет пионов, белые с розовым",         tag: "просто так",     status: "оставить" },
  { l: "Поездка в Грузию на 5 дней",            tag: "годовщина",      status: "оставить" },
  { l: "Парфюм Maison Margiela — replica",       tag: "ДР",             status: "использовано", on: "ДР 2025" },
  { l: "Курс по керамике (хочет давно)",         tag: "просто так",     status: "оставить" },
  { l: "Книга «Соня в королевстве wonder»",     tag: "просто так",     status: "использовано", on: "8 марта" },
];

const SHARED_PLANS = [
  { l: "Поехать в Грузию на майские 2027",  tag: "путешествие", progress: 15 },
  { l: "Сходить на спектакль «Сирано»",     tag: "вечер",       progress: 60 },
  { l: "Снять квартиру вместе",             tag: "крупное",     progress: 30 },
  { l: "Пройти курс готовки итальянской",    tag: "хобби",       progress: 0 },
];

function GiftCard({ g }) {
  const used = g.status === "использовано";
  return (
    <div style={{
      padding: "12px 14px",
      background: used ? "var(--bg-elev-2)" : "var(--bg-elev-1)",
      border: `1px solid ${used ? "var(--border-subtle)" : "color-mix(in oklab, var(--p-girl) 20%, var(--border-subtle))"}`,
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 8,
      opacity: used ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <span style={{
          fontSize: 13, color: "var(--text)", lineHeight: 1.4,
          textDecoration: used ? "line-through" : "none",
          textDecorationColor: "var(--text-muted)",
        }}>{g.l}</span>
        <IconButton icon={used ? "x" : "check"} size="sm" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-3)" }}>
        <span style={{
          padding: "2px 8px", borderRadius: 999,
          background: "var(--bg-elev-2)",
          border: "1px solid var(--border-subtle)",
        }}>{g.tag}</span>
        {used && <span>· подарено · {g.on}</span>}
      </div>
    </div>
  );
}

function GirlModule() {
  return (
    <div className="app-surface" style={{ display: "flex", height: "100%" }}>
      <Sidebar active="Аня" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--p-girl)" }} />
            Аня
          </span>}
          sub="вместе с 14 февраля 2023 · 3 года 3 месяца"
          right={<>
            <Button variant="ghost" size="sm" icon="phone">Позвонить</Button>
            <Button variant="ghost" size="sm" icon="heart">Запланировать</Button>
            <Button variant="secondary" size="sm" icon="plus">Идея подарка</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 28px" }}>
          {/* hero — soft, personal */}
          <div style={{
            display: "grid", gridTemplateColumns: "240px 1fr",
            gap: 24,
            padding: "24px 28px",
            background: `linear-gradient(135deg, color-mix(in oklab, var(--p-girl) 14%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 60%)`,
            border: `1px solid color-mix(in oklab, var(--p-girl) 25%, var(--border-subtle))`,
            borderRadius: 14,
            marginBottom: 20,
            alignItems: "center",
          }}>
            <div style={{
              aspectRatio: "1",
              borderRadius: 999,
              background: "repeating-linear-gradient(135deg, color-mix(in oklab, var(--p-girl) 24%, var(--bg-elev-2)) 0 6px, color-mix(in oklab, var(--p-girl) 34%, var(--bg-elev-2)) 6px 12px)",
              border: `1px solid color-mix(in oklab, var(--p-girl) 40%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "color-mix(in oklab, var(--p-girl) 80%, var(--text))",
              fontFamily: "var(--font-mono)", fontSize: 11,
            }}>фото</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, color: "color-mix(in oklab, var(--p-girl) 80%, var(--text))", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                  моя девушка
                </span>
                <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  Аня Соколова
                </h2>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>магистратура · экономика · НИУ ВШЭ</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{
                  padding: "12px 14px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>День рождения</span>
                  <span style={{ fontSize: 18, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    7 июля <span style={{ color: "var(--p-girl)" }}>· через 47 дн</span>
                  </span>
                </div>
                <div style={{
                  padding: "12px 14px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Годовщина</span>
                  <span style={{ fontSize: 18, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                    14 февраля <span style={{ color: "var(--text-3)" }}>· через 269 дн</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* two big columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* размеры */}
            <div style={{
              padding: "18px 20px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Размеры</span>
                <IconButton icon="edit" size="sm" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", rowGap: 12, columnGap: 18 }}>
                {[
                  ["Одежда (верх)", "S / 42"],
                  ["Одежда (низ)",  "26"],
                  ["Обувь",          "38"],
                  ["Кольцо",         "16.5"],
                  ["Бельё",          "75B / S"],
                  ["Браслет",        "16 см"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{k}</span>
                    <span style={{ fontSize: 15, color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* любимое */}
            <div style={{
              padding: "18px 20px",
              background: "var(--bg-elev-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Любимое</span>
                <IconButton icon="plus" size="sm" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { i: "drop",  k: "Кофе",     v: "Flat white, без сахара, на овсянке" },
                  { i: "heart", k: "Цветы",    v: "Пионы (белые), ранункулюсы, эустома · НЕ розы" },
                  { i: "smile", k: "Еда",      v: "Том ям, рамен, паста с морепродуктами" },
                  { i: "music", k: "Музыка",   v: "Daria Zawiałow, Tame Impala, Алёна Швец" },
                  { i: "globe", k: "Бренды",   v: "Sandro, Acne Studios, Aesop" },
                  { i: "video", k: "Фильмы",   v: "Уэс Андерсон · что угодно" },
                ].map((f) => (
                  <div key={f.k} style={{ display: "grid", gridTemplateColumns: "20px 90px 1fr", alignItems: "baseline", gap: 12 }}>
                    <Icon name={f.i} size={13} style={{ color: "var(--text-3)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{f.k}</span>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* gift ideas */}
          <div style={{
            padding: "18px 20px",
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Банк идей для подарков</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>4 актуальных · 2 уже подарены</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Tabs items={["Все", "Актуальные", "Подарены"]} active="Все" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {GIFT_IDEAS.map((g) => <GiftCard key={g.l} g={g} />)}
            </div>
          </div>

          {/* shared plans */}
          <div style={{
            padding: "18px 20px",
            background: "var(--bg-elev-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Совместные планы</span>
              <Button variant="ghost" size="sm" icon="plus">Добавить план</Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SHARED_PLANS.map((p) => (
                <div key={p.l} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 100px",
                  gap: 14,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name={p.progress > 0 ? "heart" : "star"} size={14} style={{ color: "var(--p-girl)" }} />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{p.l}</span>
                  </div>
                  <span style={{
                    fontSize: 11, color: "var(--text-3)",
                    padding: "2px 8px", borderRadius: 999,
                    background: "var(--bg-elev-2)",
                    border: "1px solid var(--border-subtle)",
                    justifySelf: "start",
                  }}>{p.tag}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}><Progress value={p.progress} color="var(--p-girl)" height={3} /></div>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", minWidth: 28, textAlign: "right" }}>{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.GirlModule = GirlModule;
