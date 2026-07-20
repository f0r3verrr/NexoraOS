/*
 * Реестр шагов интерактивного тура по приложению.
 * Каждый шаг целится в иконку соответствующего раздела в рейле сайдбара
 * ([data-tour="rail-<key>"]) — она рендерится сразу на любой странице,
 * в отличие от содержимого самой панели (у Notes/Cinema/Vault/Personal-*
 * панель вообще null, поэтому таргет внутри неё никогда не находится и
 * тур ждёт полный таймаут прежде чем сдаться).
 */

/* Безопасный "виртуальный" таргет для центрированных шагов без привязки к
   элементу — рейл всегда в вьюпорте на любой странице, в отличие от 'body'
   (у react-joyride на 'body' съезжает скролл на середину всего документа). */
export const CENTER_FALLBACK_TARGET = '[data-tour="rail-home"]';

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
    target: CENTER_FALLBACK_TARGET,
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
    target: '[data-tour="rail-inbox"]',
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
    target: '[data-tour="rail-today"]',
    placement: 'right',
    title: 'Утро / день / вечер',
    content: 'Задачи автоматически группируются по времени суток, а «главная лягушка» — самая важная задача дня — всегда наверху.',
  },

  // ---- Календарь ----
  {
    id: 'calendar-rail',
    route: '/calendar',
    target: '[data-tour="rail-calendar"]',
    placement: 'right',
    title: 'Календарь',
    content: 'Планируйте события по дням, неделям и месяцам. Задачи с дедлайном из «Сегодня» тоже появляются здесь.',
  },

  // ---- Доски (Kanban) ----
  {
    id: 'kanban-rail',
    route: '/kanban',
    target: '[data-tour="rail-kanban"]',
    placement: 'right',
    title: 'Доски',
    content: 'Канбан-доска для проектных задач — перетаскивайте карточки между колонками «Бэклог → В работе → Готово».',
  },

  // ---- Гантт ----
  {
    id: 'gantt-rail',
    route: '/gantt',
    target: '[data-tour="rail-gantt"]',
    placement: 'right',
    title: 'Гантт',
    content: 'Временная шкала проектов и вех — удобно видеть, что и когда должно быть готово.',
  },

  // ---- Проекты ----
  {
    id: 'projects-rail',
    route: '/projects',
    target: '[data-tour="rail-projects"]',
    placement: 'right',
    title: 'Проекты',
    content: 'Группируйте задачи, заметки и файлы по проектам — откройте карточку проекта, чтобы увидеть всё вместе.',
  },

  // ---- Заметки ----
  {
    id: 'notes-rail',
    route: '/notes',
    target: '[data-tour="rail-notes"]',
    placement: 'right',
    title: 'Заметки',
    content: 'Быстрые заметки и markdown-документы, разложенные по папкам.',
  },

  // ---- Дневник ----
  {
    id: 'journal-rail',
    route: '/journal',
    target: '[data-tour="rail-journal"]',
    placement: 'right',
    title: 'Дневник',
    content: 'Ежедневные записи с настроением и энергией — помогает отслеживать самочувствие и вести стрик.',
  },

  // ---- Файлы ----
  {
    id: 'files-rail',
    route: '/files',
    target: '[data-tour="rail-files"]',
    placement: 'right',
    title: 'Файлы',
    content: 'Храните документы, фото и таблицы — с поиском и фильтрами по типу.',
  },

  // ---- Финансы ----
  {
    id: 'finances-rail',
    route: '/finances',
    target: '[data-tour="rail-finances"]',
    placement: 'right',
    title: 'Финансы',
    content: 'Заказы, доходы и расходы с аналитикой по месяцам — пригодится, если ведёте подработки или свой бизнес.',
  },

  // ---- CRM ----
  {
    id: 'crm-rail',
    route: '/crm',
    target: '[data-tour="rail-crm"]',
    placement: 'right',
    title: 'CRM',
    content: 'Контакты и сделки по статусам — от «Новый» до «Готово», с сегментами для группировки.',
  },

  // ---- Цели ----
  {
    id: 'goals-rail',
    route: '/goals',
    target: '[data-tour="rail-goals"]',
    placement: 'right',
    title: 'Цели',
    content: 'Долгосрочные цели и привычки — отмечайте прогресс и ведите стрики.',
  },

  // ---- Watchlist (Cinema) ----
  {
    id: 'cinema-rail',
    route: '/cinema',
    target: '[data-tour="rail-cinema"]',
    placement: 'right',
    title: 'Watchlist',
    content: 'Список фильмов и сериалов на посмотреть — с оценками и поиском по базе Кинопоиска.',
  },

  // ---- Машина ----
  {
    id: 'car-rail',
    route: '/personal/car',
    target: '[data-tour="rail-car"]',
    placement: 'right',
    title: 'Машина',
    content: 'ТО, страховка и расходы на обслуживание — всё про личный автомобиль в одном месте.',
  },

  // ---- Отношения ----
  {
    id: 'partner-rail',
    route: '/personal/partner',
    target: '[data-tour="rail-partner"]',
    placement: 'right',
    title: 'Отношения',
    content: 'Важные даты, подарки и заметки — чтобы ничего не забыть.',
  },

  // ---- Дом и подписки ----
  {
    id: 'home-rail',
    route: '/personal/home',
    target: '[data-tour="rail-homemod"]',
    placement: 'right',
    title: 'Дом и подписки',
    content: 'Учёт подписок, коммунальных платежей и домашних дел.',
  },

  // ---- Vault ----
  {
    id: 'vault-rail',
    route: '/vault',
    target: '[data-tour="rail-vault"]',
    placement: 'right',
    title: 'Vault',
    content: 'Приватное хранилище паролей и заметок — эти данные видны только вам.',
  },

  // ---- Настройки ----
  {
    id: 'settings-rail',
    route: '/settings',
    target: '[data-tour="rail-settings"]',
    placement: 'right',
    title: 'Настройки',
    content: 'Профиль, внешний вид, уведомления и управление разделами приложения. Здесь же можно пройти это обучение заново.',
  },
];

/* Авторские шаги для роута; для ещё не описанного роута — общий шаг
   по иконке рейла (не по содержимому панели — оно бывает null). */
export function getStepsForRoute(route) {
  const authored = TOUR_STEPS.filter(s => s.route === route);
  if (authored.length) return authored;

  const meta = ROUTE_META[route];
  if (!meta) return [];
  return [{
    id: `${meta.key}-fallback`,
    route,
    target: `[data-tour="rail-${meta.key}"]`,
    placement: 'right',
    title: meta.label,
    content: `Раздел «${meta.label}».`,
  }];
}
