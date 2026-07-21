import { useEffect, useRef } from 'react';

/* Свайп влево для закрытия выезжающего слева Drawer (мобильная навигация).
   Прямая работа с DOM (без re-render на каждый touchmove) — тот же подход,
   что и в других drag-взаимодействиях приложения. */
export function useSwipeToClose(onClose, { threshold = 80 } = {}) {
  const ref = useRef(null);
  const startX = useRef(null);
  const dx = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = (e) => {
      startX.current = e.touches[0].clientX;
      dragging.current = true;
      el.style.transition = 'none';
    };
    const onMove = (e) => {
      if (!dragging.current) return;
      const d = Math.min(0, e.touches[0].clientX - startX.current);
      dx.current = d;
      el.style.transform = `translateX(${d}px)`;
    };
    const onEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      el.style.transition = 'transform 180ms ease-out';
      if (dx.current < -threshold) {
        onClose();
      } else {
        el.style.transform = 'translateX(0)';
      }
      dx.current = 0;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [onClose, threshold]);

  return ref;
}
