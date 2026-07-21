/*
 * Реестр разделов админ-панели (admin.nexoraos.ru). key совпадает с тем,
 * что использует adminNavByPath() для заголовка/подзаголовка в топ-баре.
 */
export const ADMIN_NAV = [
  { key: 'dashboard',     path: '/',              icon: 'grid',     label: 'Дашборд',
    subtitle: 'Обзор системы и ключевые метрики' },

  { key: 'users',         path: '/users',         icon: 'users',    label: 'Пользователи',
    group: 'Управление', subtitle: 'Аккаунты, планы, действия' },
  { key: 'subscriptions', path: '/subscriptions', icon: 'coin',     label: 'Подписки',
    group: 'Управление', subtitle: 'Планы, MRR и активные пользователи' },
  { key: 'flags',         path: '/feature-flags', icon: 'zap',      label: 'Feature Flags',
    group: 'Управление', subtitle: 'Управление функциями продукта' },

  { key: 'changelog',     path: '/changelog',     icon: 'bookmark', label: 'Changelog',
    group: 'Контент', subtitle: 'История релизов продукта' },
  { key: 'news',          path: '/news',          icon: 'globe',    label: 'Новости',
    group: 'Контент', subtitle: 'Анонсы и объявления для пользователей' },
  { key: 'feedback',      path: '/feedback',      icon: 'message',  label: 'Обратная связь',
    group: 'Контент', subtitle: 'Жалобы и предложения от пользователей' },

  { key: 'analytics',     path: '/analytics',     icon: 'activity', label: 'Аналитика',
    group: 'Аналитика', subtitle: 'Поведение и вовлечённость пользователей' },
  { key: 'storage',       path: '/storage',       icon: 'archive',  label: 'Хранилище',
    group: 'Аналитика', subtitle: 'Использование и рост хранилища' },

  { key: 'logs',          path: '/logs',          icon: 'list',     label: 'Логи',
    group: 'Мониторинг', subtitle: 'Системный журнал действий' },
  { key: 'errors',        path: '/errors',        icon: 'flame',    label: 'Ошибки',
    group: 'Мониторинг', subtitle: 'Ошибки приложения за последнее время' },
  { key: 'security',      path: '/security',      icon: 'shield',   label: 'Безопасность',
    group: 'Мониторинг', subtitle: 'Обзор угроз и подозрительной активности' },
  { key: 'status',        path: '/status',        icon: 'circle',   label: 'Статус',
    group: 'Мониторинг', subtitle: 'Статус сервисов в реальном времени' },
];

export const ADMIN_GROUPS = ['Управление', 'Контент', 'Аналитика', 'Мониторинг'];

export function adminNavByPath(pathname) {
  if (pathname.startsWith('/users/') && pathname !== '/users/') {
    return { key: 'users', label: 'Профиль пользователя', subtitle: 'Детальная информация и действия' };
  }
  return ADMIN_NAV.find(n => n.path === pathname) ?? ADMIN_NAV[0];
}
