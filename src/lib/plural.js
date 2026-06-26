/** Russian plural form: plural(5, 'файл', 'файла', 'файлов') → '5 файлов' */
export function plural(n, one, few, many) {
  const abs    = Math.abs(Math.floor(n));
  const mod10  = abs % 10;
  const mod100 = abs % 100;
  let form;
  if (mod100 >= 11 && mod100 <= 19) form = many;
  else if (mod10 === 1)              form = one;
  else if (mod10 >= 2 && mod10 <= 4) form = few;
  else                               form = many;
  return `${n} ${form}`;
}

export const ru = {
  files:    n => plural(n, 'файл',     'файла',     'файлов'),
  tasks:    n => plural(n, 'задача',   'задачи',    'задач'),
  notes:    n => plural(n, 'заметка',  'заметки',   'заметок'),
  contacts: n => plural(n, 'контакт',  'контакта',  'контактов'),
  orders:   n => plural(n, 'заказ',    'заказа',    'заказов'),
  projects: n => plural(n, 'проект',   'проекта',   'проектов'),
  events:   n => plural(n, 'событие',  'события',   'событий'),
  habits:   n => plural(n, 'привычка', 'привычки',  'привычек'),
  goals:    n => plural(n, 'цель',     'цели',      'целей'),
  days:     n => plural(n, 'день',     'дня',       'дней'),
  hours:    n => plural(n, 'час',      'часа',      'часов'),
  mins:     n => plural(n, 'минута',   'минуты',    'минут'),
};
