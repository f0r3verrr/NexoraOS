import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useTour } from '../contexts/TourContext.jsx';
import { TourTooltip } from './TourTooltip.jsx';

export function TourOverlay() {
  const { run, stepIndex, steps, goToStep, finishTour } = useTour();
  if (!steps.length) return null;

  function handleCallback(data) {
    const { status, type, index, action } = data;

    if (status === STATUS.FINISHED) { finishTour('completed'); return; }
    if (status === STATUS.SKIPPED)  { finishTour('skipped'); return; }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      goToStep(action === ACTIONS.PREV ? index - 1 : index + 1);
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex ?? 0}
      callback={handleCallback}
      tooltipComponent={TourTooltip}
      continuous
      showSkipButton
      disableOverlayClose
      disableScrolling
      spotlightClicks={false}
      spotlightPadding={4}
      floaterProps={{ offset: 14 }}
      styles={{
        options: { overlayColor: 'rgba(3,3,5,0.88)', arrowColor: 'var(--bg-elev-2)', zIndex: 10000 },
        spotlight: { borderRadius: 10, border: '2px solid var(--p-openresto)' },
      }}
    />
  );
}
