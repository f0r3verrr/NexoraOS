/*
 * Реестр шагов интерактивного тура по приложению.
 * TOUR_STEPS — авторские шаги (первая волна: Дашборд, Inbox, Сегодня).
 * Остальные роуты едут на общем шаге-заглушке (getStepsForRoute), который
 * указывает на общую панель раздела ([data-tour="page-panel"], всегда
 * присутствует в PanelChrome) — так тур никогда не ломается на роуте
 * без авторского контента.
 */

export const ROUTE_ORDER = [
  '/dashboard', '/inbox', '/today', '/calendar', '/kanban', '/gantt',
  '/projects', '/notes', '/journal', '/files', '/finances', '/crm', '/goals', '/cinema',
  '/personal/car', '/personal/partner', '/personal/home',
  '/vault', '/settings',
];

export const ROUTE_META = {
  '/dashboard':        { key: 'home',     label: 'Главная' },
  '/inbox':            { key: 'inbox',    label: 'Inbox' },
  '/today':            { key: 'today',    label: 'Сегодня' },
  '/calendar':         { key: 'calendar', label: 'Календарь' },
  '/kanban':           { key: 'kanban',   label: 'Доски' },
  '/gantt':            { key: 'gantt',    label: 'Гантт' },
  '/projects':         { key: 'projects', label: 'Проекты' },
  '/notes':            { key: 'notes',    label: 'Заметки' },
  '/journal':          { key: 'journal',  label: 'Дневник' },
  '/files':            { key: 'files',    label: 'Файлы' },
  '/finances':         { key: 'finances', label: 'Финансы' },
  '/crm':              { key: 'crm',      label: 'CRM' },
  '/goals':            { key: 'goals',    label: 'Цели' },
  '/cinema':           { key: 'cinema',   label: 'Watchlist' },
  '/personal/car':     { key: 'car',      label: 'Машина' },
  '/personal/partner': { key: 'partner',  label: 'Отношения' },
  '/personal/home':    { key: 'homemod',  label: 'Дом и подписки' },
  '/vault':            { key: 'vault',    label: 'Vault' },
  '/settings':         { key: 'settings', label: 'Настройки' },
};

export const TOUR_STEPS = [
  // ---- Дашборд ----
  {
    id: 'dashboard-welcome',
    route: '/dashboard',
    target: 'body',
    placement: 'center',
    title: 'Добро пожаловать в NexoraOS',
    content: 'Это ваш личный центр управления делами. Пройдёмся коротко по разделам — займёт пару минут. В любой момент можно нажать «Пропустить».',
  },
  {
    id: 'dashboard-rail-inbox',
    route: '/dashboard',
    target: '[data-tour="rail-inbox"]',
    placement: 'right',
    title: 'Inbox',
    content: 'Сюда падает всё новое — из Telegram, почты, голосом или через веб-форму. Разбирайте по одному элементу, не теряя контекст.',
  },
  {
    id: 'dashboard-rail-today',
    route: '/dashboard',
    target: '[data-tour="rail-today"]',
    placement: 'right',
    title: 'Сегодня',
    content: 'Ваш план на день: задачи с дедлайном, «главная лягушка» и прогресс выполнения.',
  },

  // ---- Inbox ----
  {
    id: 'inbox-views',
    route: '/inbox',
    target: '[data-tour="inbox-views"]',
    placement: 'right',
    title: 'Разделы Inbox',
    content: '«Не разобрано» — то, что ещё нужно обработать. «Разобрано» — архив. «Отложенные» — то, к чему вернётесь позже.',
  },
  {
    id: 'inbox-sources',
    route: '/inbox',
    target: '[data-tour="page-panel"]',
    placement: 'right',
    title: 'Источники',
    content: 'Когда появятся элементы из разных каналов — Telegram, почта, голос — здесь же можно будет отфильтровать по источнику.',
  },

  // ---- Сегодня ----
  {
    id: 'today-add',
    route: '/today',
    target: '[data-tour="today-add"]',
    placement: 'bottom',
    title: 'Добавить задачу',
    content: 'Быстро создайте задачу на сегодня — с временем, приоритетом и привязкой к проекту.',
  },
  {
    id: 'today-panel',
    route: '/today',
    target: '[data-tour="page-panel"]',
    placement: 'right',
    title: 'Утро / день / вечер',
    content: 'Задачи автоматически группируются по времени суток, а «главная лягушка» — самая важная задача дня — всегда наверху.',
  },
];

/* Авторские шаги для роута, либо один общий шаг-заглушка */
export function getStepsForRoute(route) {
  const authored = TOUR_STEPS.filter(s => s.route === route);
  if (authored.length) return authored;

  const meta = ROUTE_META[route];
  if (!meta) return [];
  return [{
    id: `${meta.key}-fallback`,
    route,
    target: '[data-tour="page-panel"]',
    placement: 'right',
    title: meta.label,
    content: `Раздел «${meta.label}». Подробный тур для этой страницы появится позже.`,
  }];
}
