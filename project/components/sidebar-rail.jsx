/* V1 navigation — icon rail (left, 60px) */

const RAIL_NAV_TOP = [
  { key: "home",     icon: "home",      label: "Главная" },
  { key: "inbox",    icon: "inbox",     label: "Inbox",     badge: 12 },
  { key: "today",    icon: "sun_today", label: "Сегодня",   badge: 8 },
  { key: "calendar", icon: "calendar",  label: "Календарь" },
  { key: "kanban",   icon: "layers",    label: "Доски" },
  { key: "gantt",    icon: "trending_up", label: "План · Гантт" },
];

const RAIL_NAV_LIBRARY = [
  { key: "projects", icon: "briefcase", label: "Проекты" },
  { key: "notes",    icon: "note",      label: "Заметки" },
  { key: "journal",  icon: "edit",      label: "Дневник" },
  { key: "files",    icon: "file",      label: "Файлы" },
  { key: "finances", icon: "wallet",    label: "Финансы" },
  { key: "crm",      icon: "users",     label: "CRM" },
  { key: "goals",    icon: "target",    label: "Цели" },
];

const RAIL_NAV_BOTTOM = [
  { key: "vault",    icon: "lock",      label: "Vault" },
  { key: "settings", icon: "settings",  label: "Настройки" },
];

function RailDot({ item, active }) {
  return (
    <button title={item.label} style={{
      width: 40, height: 40,
      borderRadius: 10,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      color: active ? "var(--text)" : "var(--text-3)",
      background: active ? "var(--bg-elev-3)" : "transparent",
      position: "relative",
      transition: "background 120ms, color 120ms",
    }}>
      <Icon name={item.icon} size={18} />
      {item.badge && (
        <span style={{
          position: "absolute", top: 3, right: 3,
          minWidth: 16, height: 16, padding: "0 4px",
          borderRadius: 999,
          background: "var(--danger)",
          color: "white",
          fontSize: 10, fontWeight: 500, fontFamily: "var(--font-mono)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "2px solid var(--bg-elev-1)",
        }}>{item.badge}</span>
      )}
      {active && (
        <span style={{
          position: "absolute", left: -10, top: 10, bottom: 10, width: 2,
          borderRadius: 999, background: "var(--text)",
        }} />
      )}
    </button>
  );
}

function SidebarRail({ activeKey }) {
  return (
    <div style={{
      width: 60, flex: "none",
      background: "var(--bg-elev-1)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "12px 0",
      gap: 4,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "linear-gradient(135deg, color-mix(in oklab, var(--p-openresto) 60%, var(--bg)), color-mix(in oklab, var(--p-youmin) 60%, var(--bg)))",
        color: "var(--text)", fontSize: 13, fontWeight: 500,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 8,
      }} title="NexoraOS">N</div>

      {RAIL_NAV_TOP.map((n) => <RailDot key={n.key} item={n} active={n.key === activeKey} />)}

      <div style={{ height: 1, width: 24, background: "var(--border-subtle)", margin: "8px 0" }} />

      {RAIL_NAV_LIBRARY.map((n) => <RailDot key={n.key} item={n} active={n.key === activeKey} />)}

      <div style={{ flex: 1 }} />

      {RAIL_NAV_BOTTOM.map((n) => <RailDot key={n.key} item={n} active={n.key === activeKey} />)}

      <div style={{ marginTop: 4 }}>
        <Avatar initials="К" color="var(--p-openresto)" size={32} />
      </div>
    </div>
  );
}

window.SidebarRail = SidebarRail;
