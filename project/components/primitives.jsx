/* Reusable primitives (used by screens) + Components artboard showcase */

/* ====== Primitives ====== */

function Button({ variant = "ghost", size = "md", icon, trailing, children, style, onClick }) {
  const sizes = {
    sm: { h: 28, padX: 10, fs: 13, gap: 6, iconSize: 14, radius: 8 },
    md: { h: 32, padX: 12, fs: 13, gap: 8, iconSize: 15, radius: 8 },
    lg: { h: 36, padX: 14, fs: 14, gap: 8, iconSize: 16, radius: 10 },
  }[size];

  const variants = {
    primary: {
      background: "var(--text)",
      color: "var(--bg)",
      border: "1px solid var(--text)",
    },
    secondary: {
      background: "var(--bg-elev-2)",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-2)",
      border: "1px solid transparent",
    },
    outline: {
      background: "transparent",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "color-mix(in oklab, var(--danger) 14%, transparent)",
      color: "var(--danger)",
      border: "1px solid color-mix(in oklab, var(--danger) 35%, transparent)",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizes.gap,
        height: sizes.h,
        padding: `0 ${sizes.padX}px`,
        borderRadius: sizes.radius,
        fontSize: sizes.fs,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        transition: "background 120ms ease-out, border-color 120ms ease-out",
        ...variants,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sizes.iconSize} />}
      {children}
      {trailing}
    </button>
  );
}

function IconButton({ icon, size = "md", title, onClick, style }) {
  const d = { sm: 24, md: 28, lg: 32 }[size];
  const s = { sm: 14, md: 16, lg: 18 }[size];
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: d, height: d,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8,
        color: "var(--text-2)",
        background: "transparent",
        transition: "background 120ms ease-out, color 120ms ease-out",
        ...style,
      }}
    >
      <Icon name={icon} size={s} />
    </button>
  );
}

function Input({ value, placeholder, icon, trailing, size = "md", style }) {
  const h = { sm: 28, md: 34, lg: 40 }[size];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: h,
        padding: "0 12px",
        background: "var(--bg-elev-2)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        color: "var(--text-2)",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      <span style={{
        flex: 1, color: value ? "var(--text)" : "var(--text-muted)",
        fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value || placeholder}
      </span>
      {trailing}
    </div>
  );
}

function Kbd({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 18, height: 18, padding: "0 5px",
      borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11,
      color: "var(--text-3)",
      background: "var(--bg-elev-3)",
      border: "1px solid var(--border-subtle)",
    }}>
      {children}
    </span>
  );
}

function Badge({ tone = "neutral", variant = "soft", children, dot, icon }) {
  const toneColors = {
    neutral: "var(--text-2)",
    success: "var(--success)",
    warn: "var(--warn)",
    danger: "var(--danger)",
    info:   "var(--info)",
  };
  const c = tone.startsWith("--") ? `var(${tone})` : toneColors[tone];

  const styles = variant === "soft" ? {
    background: `color-mix(in oklab, ${c} 14%, transparent)`,
    color: c,
    border: `1px solid color-mix(in oklab, ${c} 22%, transparent)`,
  } : {
    background: "transparent",
    color: c,
    border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
  };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 22, padding: "0 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...styles,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

function ProjectTag({ projectToken, label, size = "md" }) {
  const s = size === "sm" ? { fs: 11, dot: 6, gap: 5 } : { fs: 12, dot: 7, gap: 6 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      fontSize: s.fs,
      color: "var(--text-3)",
      fontWeight: 500,
    }}>
      <span style={{
        width: s.dot, height: s.dot, borderRadius: 999,
        background: `var(${projectToken})`,
      }} />
      {label}
    </span>
  );
}

function Checkbox({ checked, priority }) {
  // priority adds a coloured outline for !p1 etc.
  const ringColor = priority === 1 ? "var(--danger)"
    : priority === 2 ? "var(--warn)"
    : priority === 3 ? "var(--info)"
    : "var(--border-strong)";
  return (
    <span style={{
      width: 16, height: 16,
      borderRadius: 5,
      border: `1.5px solid ${ringColor}`,
      background: checked ? ringColor : "transparent",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
      transition: "background 120ms",
    }}>
      {checked && <Icon name="check" size={11} style={{ color: "var(--bg)" }} stroke={2.5} />}
    </span>
  );
}

function Avatar({ initials, color = "var(--p-openresto)", size = 28 }) {
  return (
    <span style={{
      width: size, height: size,
      borderRadius: 999,
      background: `color-mix(in oklab, ${color} 22%, transparent)`,
      color: color,
      fontSize: Math.round(size * 0.42),
      fontWeight: 500,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      flex: "none",
    }}>
      {initials}
    </span>
  );
}

function Tabs({ items, active }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--bg-elev-2)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
      {items.map((it) => {
        const isActive = it === active;
        return (
          <span key={it} style={{
            height: 26, padding: "0 12px",
            display: "inline-flex", alignItems: "center",
            fontSize: 13, fontWeight: 500,
            borderRadius: 6,
            color: isActive ? "var(--text)" : "var(--text-3)",
            background: isActive ? "var(--bg-elev-3)" : "transparent",
          }}>{it}</span>
        );
      })}
    </div>
  );
}

function Progress({ value, color = "var(--text-2)", height = 4 }) {
  return (
    <div style={{
      height, width: "100%",
      background: "var(--bg-elev-3)",
      borderRadius: 999, overflow: "hidden",
    }}>
      <div style={{
        height: "100%", width: `${Math.max(0, Math.min(100, value))}%`,
        background: color, borderRadius: 999,
      }} />
    </div>
  );
}

function Tooltip({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 10px",
      background: "var(--bg-elev-3)",
      color: "var(--text)",
      fontSize: 12,
      borderRadius: 6,
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-2)",
    }}>
      {children}
    </span>
  );
}

function Toast({ icon = "check", children, action }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 12,
      padding: "10px 12px",
      background: "var(--bg-elev-3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      boxShadow: "var(--shadow-2)",
      minWidth: 320,
      fontSize: 13,
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: 999,
        background: "color-mix(in oklab, var(--success) 16%, transparent)",
        color: "var(--success)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={14} stroke={2} />
      </span>
      <span style={{ flex: 1, color: "var(--text)" }}>{children}</span>
      {action && <button style={{ color: "var(--text-2)", fontSize: 13, fontWeight: 500 }}>{action}</button>}
    </div>
  );
}

function Dropdown({ items, title = "Действия" }) {
  return (
    <div style={{
      width: 240,
      padding: 6,
      background: "var(--bg-elev-3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      boxShadow: "var(--shadow-2)",
    }}>
      <div style={{ padding: "6px 10px", color: "var(--text-3)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>{title}</div>
      {items.map((it, i) => (
        it === "—" ? (
          <div key={i} style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
        ) : (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 10px",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 13,
            background: it.active ? "var(--bg-hover)" : "transparent",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {it.icon && <Icon name={it.icon} size={15} style={{ color: "var(--text-3)" }} />}
              {it.label}
            </span>
            {it.kbd && <Kbd>{it.kbd}</Kbd>}
          </div>
        )
      ))}
    </div>
  );
}

/* ====== Components showcase artboards ====== */

const primShowcaseStyles = {
  card: {
    background: "var(--bg-elev-1)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    padding: 24,
    color: "var(--text)",
    fontFamily: "var(--font-sans)",
    height: "100%",
    boxSizing: "border-box",
    display: "flex", flexDirection: "column", gap: 20,
  },
  title: { fontSize: 13, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" },
  group: { display: "flex", flexDirection: "column", gap: 10 },
  groupLabel: { fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },
};

function ButtonsCard() {
  return (
    <div style={primShowcaseStyles.card}>
      <div style={primShowcaseStyles.title}>Кнопки</div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Варианты</span>
        <div style={primShowcaseStyles.row}>
          <Button variant="primary" icon="plus">Новая задача</Button>
          <Button variant="secondary" icon="filter">Фильтры</Button>
          <Button variant="outline">Отложить</Button>
          <Button variant="ghost" icon="check">Готово</Button>
          <Button variant="danger" icon="trash">Удалить</Button>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Размеры</span>
        <div style={primShowcaseStyles.row}>
          <Button variant="secondary" size="sm">sm — 28</Button>
          <Button variant="secondary" size="md">md — 32</Button>
          <Button variant="secondary" size="lg">lg — 36</Button>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Иконки</span>
        <div style={primShowcaseStyles.row}>
          <IconButton icon="search" />
          <IconButton icon="bell" />
          <IconButton icon="moon" />
          <IconButton icon="settings" />
          <IconButton icon="more" />
        </div>
      </div>
    </div>
  );
}

function InputsCard() {
  return (
    <div style={primShowcaseStyles.card}>
      <div style={primShowcaseStyles.title}>Поля и поиск</div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Глобальный поиск</span>
        <Input
          icon="search"
          placeholder="Найти задачу, заметку, контакт…"
          trailing={<Kbd>⌘K</Kbd>}
          style={{ width: "100%" }}
          size="lg"
        />
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Поле задачи (NLP-парсер)</span>
        <Input
          value="Позвонить Ане завтра в 15:00 #youmin !p1"
          icon="plus"
          trailing={<span style={{ display: "inline-flex", gap: 6 }}>
            <ProjectTag projectToken="--p-youmin" label="youmin" size="sm" />
            <Badge tone="danger">!p1</Badge>
            <Badge tone="info">завтра 15:00</Badge>
          </span>}
          style={{ width: "100%" }}
          size="lg"
        />
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Пустое поле</span>
        <Input placeholder="Захвати мысль…" icon="zap" style={{ width: "100%" }} />
      </div>
    </div>
  );
}

function BadgesCard() {
  return (
    <div style={primShowcaseStyles.card}>
      <div style={primShowcaseStyles.title}>Бейджи, теги, приоритеты</div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Семантика</span>
        <div style={primShowcaseStyles.row}>
          <Badge tone="neutral" dot>в работе</Badge>
          <Badge tone="success" dot>оплачен</Badge>
          <Badge tone="warn" dot>ожидает</Badge>
          <Badge tone="danger" dot>просрочено</Badge>
          <Badge tone="info" dot>сегодня</Badge>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Проекты</span>
        <div style={primShowcaseStyles.row}>
          <ProjectTag projectToken="--p-youmin" label="Youmin / QA" />
          <ProjectTag projectToken="--p-openresto" label="OpenResto" />
          <ProjectTag projectToken="--p-diploma" label="Дипломы" />
          <ProjectTag projectToken="--p-sites" label="Сайты" />
          <ProjectTag projectToken="--p-bots" label="Боты" />
          <ProjectTag projectToken="--p-girl" label="Аня" />
          <ProjectTag projectToken="--p-car" label="Машина" />
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Приоритет (чекбокс)</span>
        <div style={primShowcaseStyles.row}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Checkbox priority={1} />!p1 — срочно</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Checkbox priority={2} />!p2 — важно</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Checkbox priority={3} />!p3 — обычно</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Checkbox checked priority={2} />выполнено</span>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Аватары</span>
        <div style={primShowcaseStyles.row}>
          <Avatar initials="К" color="var(--p-openresto)" />
          <Avatar initials="А" color="var(--p-girl)" />
          <Avatar initials="МК" color="var(--p-youmin)" />
          <Avatar initials="ДН" color="var(--p-diploma)" />
          <Avatar initials="+3" color="var(--text-3)" size={28} />
        </div>
      </div>
    </div>
  );
}

function OverlaysCard() {
  return (
    <div style={primShowcaseStyles.card}>
      <div style={primShowcaseStyles.title}>Tabs, прогресс, всплывашки</div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Tabs</span>
        <Tabs items={["Обзор", "Задачи", "Заметки", "Файлы", "Финансы"]} active="Задачи" />
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Прогресс</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}><span>OpenResto · MVP</span><span style={{ fontFamily: "var(--font-mono)" }}>68%</span></div>
            <Progress value={68} color="var(--p-openresto)" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}><span>Дипломы · 4 заказа</span><span style={{ fontFamily: "var(--font-mono)" }}>40%</span></div>
            <Progress value={40} color="var(--p-diploma)" />
          </div>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Tooltip / Kbd</span>
        <div style={primShowcaseStyles.row}>
          <Tooltip>Отложить на завтра <Kbd>H</Kbd></Tooltip>
          <Tooltip>Открыть в боковой панели <Kbd>⌘</Kbd> <Kbd>↵</Kbd></Tooltip>
        </div>
      </div>

      <div style={primShowcaseStyles.group}>
        <span style={primShowcaseStyles.groupLabel}>Toast</span>
        <Toast action="Отменить">Задача «Созвон с командой Youmin» отмечена выполненной</Toast>
      </div>
    </div>
  );
}

function DropdownCard() {
  return (
    <div style={primShowcaseStyles.card}>
      <div style={primShowcaseStyles.title}>Dropdown / Command menu</div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <Dropdown
          title="Задача"
          items={[
            { icon: "check", label: "Выполнить", kbd: "E" },
            { icon: "snooze", label: "Отложить на завтра", kbd: "H" },
            { icon: "calendar", label: "Запланировать…", kbd: "S" },
            { icon: "flag", label: "Изменить приоритет", kbd: "P" },
            "—",
            { icon: "paperclip", label: "Прикрепить файл" },
            { icon: "edit", label: "Редактировать" },
            { icon: "trash", label: "Удалить", kbd: "⌫" },
          ]}
        />

        <div style={{
          width: 320,
          padding: 6,
          background: "var(--bg-elev-3)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "var(--shadow-2)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px",
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--text-3)", fontSize: 13,
          }}>
            <Icon name="search" size={15} />
            <span>анна</span>
          </div>
          <div style={{ padding: "6px 10px 2px", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>контакты · 2</div>
          {[
            { i: "users", l: "Аня (девушка)", m: "звонок 18:30 · сегодня" },
            { i: "users", l: "Анна Соколова", m: "клиент Дипломы · 3 заказа" },
          ].map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: i === 0 ? "var(--bg-hover)" : "transparent" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <Icon name={it.i} size={15} style={{ color: "var(--text-3)" }} />
                {it.l}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{it.m}</span>
            </div>
          ))}
          <div style={{ padding: "6px 10px 2px", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>задачи · 1</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <Icon name="check" size={15} style={{ color: "var(--text-3)" }} />
              Позвонить Ане в 15:00
            </span>
            <ProjectTag projectToken="--p-girl" label="Аня" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Button, IconButton, Input, Kbd, Badge, ProjectTag, Checkbox, Avatar, Tabs, Progress, Tooltip, Toast, Dropdown,
  ButtonsCard, InputsCard, BadgesCard, OverlaysCard, DropdownCard,
});
