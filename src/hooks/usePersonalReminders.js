import { useMemo } from 'react';
import { useCarProfile, useCarDeadlines } from './useCar.js';
import { usePartnerProfile } from './usePartner.js';
import { useSubscriptions, useWarranties, useUtilityBills, useProducts } from './useHome.js';
import { useHiddenPages } from './useHiddenPages.js';
import { plural } from '../lib/plural.js';

/* Пороги напоминаний, в днях (или км) */
const CAR_DAYS   = 14;
const CAR_KM     = 500;
const DATE_DAYS  = 14;   // ДР, годовщина
const SUB_DAYS   = 3;    // списание подписки
const WARR_DAYS  = 30;   // гарантия истекает

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

/* Дней до следующего наступления даты (по дню и месяцу) */
function daysToNext(dateStr) {
  if (!dateStr) return null;
  const src = new Date(dateStr);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), src.getMonth(), src.getDate());
  if (next < now) next = new Date(now.getFullYear() + 1, src.getMonth(), src.getDate());
  return Math.round((next - now) / 86400000);
}

function inDays(n) {
  if (n === 0) return 'сегодня';
  if (n === 1) return 'завтра';
  return `через ${plural(n, 'день', 'дня', 'дней')}`;
}

/*
 * Агрегирует напоминания личных модулей (машина / отношения / дом).
 * Модули, скрытые в настройках, не учитываются.
 * Элемент: { module, icon, tone, label, sub, to, urgency } — urgency меньше = срочнее.
 */
export function usePersonalReminders() {
  const { data: hidden = [] }    = useHiddenPages();
  const { data: carProfile }     = useCarProfile();
  const { data: deadlines = [] } = useCarDeadlines();
  const { data: partner }        = usePartnerProfile();
  const { data: subs = [] }      = useSubscriptions();
  const { data: warrs = [] }     = useWarranties();
  const { data: bills = [] }     = useUtilityBills();
  const { data: products = [] }  = useProducts();

  return useMemo(() => {
    const items = [];

    /* ── Машина ── */
    if (!hidden.includes('car')) {
      for (const d of deadlines) {
        const days = daysUntil(d.due_date);
        if (days != null && days >= 0 && days <= CAR_DAYS) {
          items.push({ module: 'car', icon: 'car', tone: days <= 3 ? '--danger' : '--warn', label: d.label, sub: inDays(days), to: '/personal/car', urgency: days });
        }
        if (d.due_km != null && carProfile) {
          const left = d.due_km - carProfile.mileage;
          if (left >= 0 && left <= CAR_KM) {
            items.push({ module: 'car', icon: 'car', tone: '--warn', label: d.label, sub: `через ${left.toLocaleString('ru')} км`, to: '/personal/car', urgency: left / 100 });
          }
        }
      }
    }

    /* ── Отношения ── */
    if (!hidden.includes('partner') && partner) {
      const first = partner.name?.split(' ')[0] ?? '';
      const bd = daysToNext(partner.birthday);
      if (bd != null && bd <= DATE_DAYS) {
        items.push({ module: 'partner', icon: 'heart', tone: '--p-girl', label: `ДР ${first}`.trim(), sub: inDays(bd), to: '/personal/partner', urgency: bd });
      }
      const an = daysToNext(partner.anniversary);
      if (an != null && an <= DATE_DAYS) {
        items.push({ module: 'partner', icon: 'heart', tone: '--p-girl', label: 'Годовщина', sub: inDays(an), to: '/personal/partner', urgency: an });
      }
    }

    /* ── Дом ── */
    if (!hidden.includes('homemod')) {
      for (const s of subs) {
        const days = daysUntil(s.next_charge);
        if (days != null && days >= 0 && days <= SUB_DAYS) {
          items.push({ module: 'home', icon: 'repeat', tone: '--p-home', label: s.name, sub: `списание ${inDays(days)} · ${Number(s.amount).toLocaleString('ru')} ₽`, to: '/personal/home', urgency: days });
        }
      }
      for (const w of warrs) {
        const days = daysUntil(w.until);
        if (days != null && days >= 0 && days <= WARR_DAYS) {
          items.push({ module: 'home', icon: 'zap', tone: '--warn', label: `Гарантия: ${w.name}`, sub: `истекает ${inDays(days)}`, to: '/personal/home', urgency: days + 10 });
        }
      }
      const unpaid = bills.find(b => !b.paid);
      if (unpaid) {
        items.push({ module: 'home', icon: 'home', tone: '--warn', label: 'Счёт ЖКХ не оплачен', sub: `${Number(unpaid.amount).toLocaleString('ru')} ₽`, to: '/personal/home', urgency: 5 });
      }
      const outProducts = products.filter(p => p.status === 'out');
      if (outProducts.length > 0) {
        items.push({
          module: 'home', icon: 'archive', tone: '--danger', label: 'Закончились продукты',
          sub: outProducts.length === 1 ? outProducts[0].name : `${outProducts.length} позиций`,
          to: '/personal/home', urgency: 2,
        });
      }
    }

    return items.sort((a, b) => a.urgency - b.urgency);
  }, [hidden, carProfile, deadlines, partner, subs, warrs, bills, products]);
}
