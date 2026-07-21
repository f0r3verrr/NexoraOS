/* Мокнутые данные — реальный биллинг добавится позже, сейчас чистый UI */

export const MOCK_SUB_STATS = [
  { label: 'MRR', value: '842 000 ₽' },
  { label: 'Активные подписки', value: '187' },
  { label: 'Free → Pro конверсия', value: '12.4%' },
  { label: 'Churn за месяц', value: '2.1%' },
];

export const MOCK_MRR = [
  { label: 'фев', value: 520 }, { label: 'мар', value: 610 }, { label: 'апр', value: 670 },
  { label: 'май', value: 720 }, { label: 'июн', value: 790 }, { label: 'июл', value: 842 },
];

export const MOCK_PLANS = [
  { name: 'Free', price: '0 ₽', period: '/мес', activeUsers: '336', features: ['3 проекта', '500 MB хранилища', 'Базовые модули', 'Email поддержка'] },
  { name: 'Pro', price: '590 ₽', period: '/мес', activeUsers: '164', highlight: true, features: ['Неограниченные проекты', '10 GB хранилища', 'Все модули', 'Приоритетная поддержка'] },
  { name: 'Enterprise', price: 'По запросу', period: '', activeUsers: '23', features: ['Всё из Pro', 'SSO и SLA', 'Выделенный менеджер', 'Кастомные интеграции'] },
];
