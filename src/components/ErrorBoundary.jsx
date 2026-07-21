import { Component } from 'react';
import { reportClientError } from '../lib/errorReporting.js';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportClientError({
      route: window.location.pathname,
      message: error?.message ?? String(error),
      stack: error?.stack ?? info?.componentStack,
      severity: 'error',
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, background: 'var(--bg, #101012)', color: 'var(--text, #f4f4f4)', fontFamily: 'system-ui, sans-serif',
        textAlign: 'center', padding: 24,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Что-то пошло не так</div>
        <div style={{ fontSize: 13, color: 'var(--text-3, #999)', maxWidth: 360 }}>
          Ошибка уже отправлена нам автоматически. Попробуйте обновить страницу.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: 'var(--text, #f4f4f4)', color: 'var(--bg, #101012)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Обновить страницу
        </button>
      </div>
    );
  }
}
