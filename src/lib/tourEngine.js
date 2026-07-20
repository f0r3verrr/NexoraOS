/* Ждём появления DOM-узла таргета (переход react-joyride между роутами:
   страница ещё монтируется/грузит данные, когда шаг уже выбран). */
export function waitForElement(selector, { timeout = 4000, interval = 60 } = {}) {
  if (selector === 'body') return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (document.querySelector(selector)) return resolve(true);
      if (Date.now() - start >= timeout) return resolve(false);
      setTimeout(tick, interval);
    };
    tick();
  });
}
