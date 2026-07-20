import { Button } from './primitives.jsx';

/* Кастомный тултип react-joyride, оформленный в токенах приложения */
export function TourTooltip({ index, size, step, isLastStep, backProps, primaryProps, skipProps, tooltipProps }) {
  return (
    <div {...tooltipProps} style={{
      width: 320, maxWidth: '90vw',
      background: 'var(--bg-elev-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-modal)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{step.title}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{index + 1} / {size}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{step.content}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <button {...skipProps} style={{
          fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px 2px', textDecoration: 'underline', textUnderlineOffset: 2,
        }}>Пропустить</button>
        <span style={{ flex: 1 }} />
        {index > 0 && <Button {...backProps} variant="secondary" size="sm">Назад</Button>}
        <Button {...primaryProps} variant="primary" size="sm">{isLastStep ? 'Готово' : 'Далее'}</Button>
      </div>
    </div>
  );
}
