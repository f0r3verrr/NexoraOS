import { useEffect, useState } from 'react';

const QUERY = '(max-width: 1023px)';

/* Единый порог мобильного/планшетного "compact"-режима шапки и навигации.
   ≥1024px — десктоп без изменений; <1024px — гамбургер + выезжающий Drawer
   вместо рейки/панели (см. Sidebar.jsx, AdminLayout.jsx). */
export function useIsCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = (e) => setCompact(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return compact;
}
