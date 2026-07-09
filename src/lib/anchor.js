/*
 * Позиционирование fixed-попапов у кнопки с учётом body { zoom }.
 * getBoundingClientRect() возвращает визуальные пиксели, а left/top
 * fixed-элемента внутри зумированного body масштабируются ещё раз —
 * поэтому делим на zoom и ограничиваем экраном.
 */
export function anchoredPos(rect, { width, height = 0, gap = 4, margin = 8 } = {}) {
  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const vw = window.innerWidth / zoom;
  const vh = window.innerHeight / zoom;
  const right  = rect.right / zoom;
  const bottom = rect.bottom / zoom;
  const top    = rect.top / zoom;

  // правый край попапа к правому краю кнопки, не выходя за экран
  const left = Math.max(margin, Math.min(right - width, vw - width - margin));

  // вниз, если помещается, иначе вверх; всегда в пределах экрана
  let y = bottom + gap;
  if (height && y + height > vh - margin) {
    y = Math.max(margin, top - height - gap);
  }
  y = Math.min(y, vh - margin - (height || 0));

  return { left, top: Math.max(margin, y) };
}
