import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useHiddenPages } from '../hooks/useHiddenPages.js';
import { useOnboarding, useSetOnboardingStatus, useSetOnboardingStep } from '../hooks/useOnboarding.js';
import { ROUTE_ORDER, ROUTE_META, getStepsForRoute, CENTER_FALLBACK_TARGET } from '../lib/tourSteps.js';
import { waitForElement } from '../lib/tourEngine.js';

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: hidden = [] } = useHiddenPages();
  const { data: onboarding } = useOnboarding();
  const setStatus = useSetOnboardingStatus();
  const setStep = useSetOnboardingStep();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(null); // null = не запущен в этой сессии
  const [targetOverrides, setTargetOverrides] = useState({}); // индекс шага → таргет не найден, показываем по центру
  const navigatedByTour = useRef(false);
  const pausedForIndex = useRef(null); // чтобы не писать шаг в БД повторно за одну паузу

  const visibleSteps = useMemo(() => {
    const routes = ROUTE_ORDER.filter(r => !hidden.includes(ROUTE_META[r]?.key));
    return routes.flatMap(getStepsForRoute);
  }, [hidden]);

  const effectiveSteps = useMemo(
    () => visibleSteps.map((s, i) => (targetOverrides[i] ? { ...s, target: CENTER_FALLBACK_TARGET, placement: 'center' } : s)),
    [visibleSteps, targetOverrides]
  );

  function finishTour(status) {
    setRun(false);
    setStepIndex(null);
    setTargetOverrides({});
    setStatus.mutate({ status, step: 0 });
  }

  function goToStep(nextIndex) {
    if (nextIndex < 0) return;
    if (nextIndex >= visibleSteps.length) { finishTour('completed'); return; }
    const step = visibleSteps[nextIndex];
    setRun(false);
    if (step.route !== pathname) {
      navigatedByTour.current = true;
      navigate(step.route);
    }
    setStepIndex(nextIndex);
  }

  const skipTour = () => finishTour('skipped');

  /* Автостарт для pending/in_progress пользователей */
  useEffect(() => {
    if (!user || stepIndex !== null || !onboarding) return;
    if (onboarding.onboarding_status === 'pending' || onboarding.onboarding_status === 'in_progress') {
      if (!visibleSteps.length) return;
      const start = Math.min(onboarding.onboarding_step ?? 0, visibleSteps.length - 1);
      goToStep(start);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onboarding, visibleSteps.length]);

  /* Переход на роут текущего шага + ожидание монтирования таргета */
  useEffect(() => {
    if (stepIndex == null) return;
    const step = visibleSteps[stepIndex];
    if (!step) return;

    if (pathname !== step.route) {
      if (!navigatedByTour.current && pausedForIndex.current !== stepIndex) {
        // пользователь сам ушёл с роута тура — молча ставим на паузу, не мешаем
        pausedForIndex.current = stepIndex;
        setStep.mutate({ step: stepIndex });
      }
      return;
    }

    navigatedByTour.current = false;
    pausedForIndex.current = null;
    let cancelled = false;
    waitForElement(step.target).then((found) => {
      if (cancelled) return;
      if (!found && step.target !== CENTER_FALLBACK_TARGET) {
        setTargetOverrides((o) => ({ ...o, [stepIndex]: true }));
      }
      // Дать вёрстке осесть (бейджи/счётчики могут перерисоваться после
      // загрузки данных) и заставить Joyride пересчитать позицию спотлайта —
      // иначе он иногда меряет устаревший прямоугольник от предыдущего кадра.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled) return;
        window.dispatchEvent(new Event('resize'));
        setRun(true);
      }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, pathname, visibleSteps]);

  /* Сохранить шаг при уходе со страницы/сворачивании вкладки (не на каждый клик) */
  useEffect(() => {
    if (stepIndex == null) return;
    const persist = () => setStep.mutate({ step: stepIndex });
    const onVisibility = () => { if (document.hidden) persist(); };
    window.addEventListener('beforeunload', persist);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', persist);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  /* Интерфейс рассчитан на экран без скролла — блокируем скролл колесом/тачем,
     пока активно показан шаг тура, чтобы не сбивать подсветку таргета */
  useEffect(() => {
    if (!run) return;
    const prevent = (e) => e.preventDefault();
    document.addEventListener('wheel', prevent, { passive: false });
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      document.removeEventListener('wheel', prevent);
      document.removeEventListener('touchmove', prevent);
    };
  }, [run]);

  /* Стрелки клавиатуры — только пока тур активно показан */
  useEffect(() => {
    if (!run) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToStep(stepIndex + 1);
      else if (e.key === 'ArrowLeft') goToStep(stepIndex - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, stepIndex]);

  const value = { run, stepIndex, steps: effectiveSteps, goToStep, finishTour, skipTour };
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
