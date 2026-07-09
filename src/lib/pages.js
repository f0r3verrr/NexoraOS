/*
 * Реестр отключаемых страниц (Настройки → Страницы).
 * key совпадает с ключами рейлов Sidebar. Базовые страницы
 * (Дашборд, Inbox, Сегодня, Настройки) отключить нельзя — их здесь нет.
 */
export const HIDEABLE_PAGES = [
  { key: 'calendar', path: '/calendar',         icon: 'calendar',    label: 'Календарь',       group: 'Планирование' },
  { key: 'kanban',   path: '/kanban',           icon: 'layers',      label: 'Доски',           group: 'Планирование' },
  { key: 'gantt',    path: '/gantt',            icon: 'trending_up', label: 'Гантт',           group: 'Планирование' },
  { key: 'projects', path: '/projects',         icon: 'briefcase',   label: 'Проекты',         group: 'Библиотека' },
  { key: 'notes',    path: '/notes',            icon: 'note',        label: 'Заметки',         group: 'Библиотека' },
  { key: 'journal',  path: '/journal',          icon: 'edit',        label: 'Дневник',         group: 'Библиотека' },
  { key: 'files',    path: '/files',            icon: 'file',        label: 'Файлы',           group: 'Библиотека' },
  { key: 'finances', path: '/finances',         icon: 'wallet',      label: 'Финансы',         group: 'Библиотека' },
  { key: 'crm',      path: '/crm',              icon: 'users',       label: 'CRM',             group: 'Библиотека' },
  { key: 'goals',    path: '/goals',            icon: 'target',      label: 'Цели',            group: 'Библиотека' },
  { key: 'cinema',   path: '/cinema',           icon: 'film',        label: 'Watchlist',       group: 'Библиотека' },
  { key: 'vault',    path: '/vault',            icon: 'lock',        label: 'Vault',           group: 'Библиотека' },
  { key: 'car',      path: '/personal/car',     icon: 'car',         label: 'Машина',          group: 'Личное' },
  { key: 'partner',  path: '/personal/partner', icon: 'heart',       label: 'Отношения',       group: 'Личное' },
  { key: 'homemod',  path: '/personal/home',    icon: 'home',        label: 'Дом и подписки',  group: 'Личное' },
];

export const PAGE_GROUPS = ['Планирование', 'Библиотека', 'Личное'];

/* path → key для guard'а роутов */
export function pageKeyByPath(pathname) {
  const page = HIDEABLE_PAGES.find(p => pathname === p.path || pathname.startsWith(p.path + '/'));
  return page?.key ?? null;
}
