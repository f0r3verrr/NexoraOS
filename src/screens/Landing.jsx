import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { GradientCanvas } from './Login.jsx';

/*
 * Публичный лендинг на / для гостей.
 * Мокап приложения собран на CSS — без скриншотов, чтобы всегда был чётким.
 */

const FEATURES = [
  { icon: 'sun_today', color: '--p-openresto', title: 'Задачи и «Сегодня»',
    desc: 'План на день с «лягушкой» — самым важным делом. Inbox для быстрых мыслей, канбан-доски и диаграмма Ганта для проектов.' },
  { icon: 'calendar', color: '--p-sites', title: 'Календарь',
    desc: 'Неделя и месяц, повторяющиеся события, привязка к проектам. События дня видны прямо на дашборде.' },
  { icon: 'note', color: '--p-youmin', title: 'Заметки и дневник',
    desc: 'Markdown-заметки по папкам и проектам. Дневник с настроением, энергией и сериями записей.' },
  { icon: 'wallet', color: '--success', title: 'Финансы и CRM',
    desc: 'Доходы, расходы, цель месяца. Мини-CRM для заказов и контактов — если фрилансишь или ведёшь клиентов.' },
  { icon: 'heart', color: '--p-girl', title: 'Личные модули',
    desc: 'Машина: ОСАГО, ТО и сканы документов. Дом: подписки, коммуналка, гарантии. Отношения: даты, размеры, идеи подарков.' },
  { icon: 'film', color: '--p-diploma', title: 'Watchlist и цели',
    desc: 'Фильмы и сериалы с оценками и историей пересмотров. Цели с прогрессом и трекер привычек с огоньками.' },
];

const PRINCIPLES = [
  { icon: 'layers', title: 'Всё в одном месте',
    desc: 'Не десять приложений с подписками, а один тёмный кабинет, где живёт вся твоя жизнь. Отключай ненужные разделы в настройках.' },
  { icon: 'lock', title: 'Приватность всерьёз',
    desc: 'Серверы в России. Файлы недоступны по прямым ссылкам. Никакой рекламы, аналитики и передачи данных третьим лицам.' },
  { icon: 'zap', title: 'Открытая бета — бесплатно',
    desc: 'Сервис развивается каждую неделю. Пользуйся бесплатно и влияй на то, каким он станет.' },
];

/* ─── CSS-мокап приложения ───────────────────────────────── */
function AppMockup() {
  const bars = [34, 58, 42, 70, 52, 84, 64];
  return (
    <div className="ld-mockup" style={{
      background: 'color-mix(in oklab, var(--bg-elev-1) 92%, transparent)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8), 0 0 60px -20px color-mix(in oklab, var(--p-openresto) 30%, transparent)',
      overflow: 'hidden',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Титлбар */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        {['#f66', '#fb5', '#5c5'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: 99, background: c, opacity: 0.75 }} />)}
        <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>nexoraos.ru/dashboard</span>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Рейл */}
        <div style={{ width: 44, borderRight: '1px solid var(--border-subtle)', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {['home', 'inbox', 'sun_today', 'calendar', 'note', 'wallet', 'heart'].map((ic, i) => (
            <span key={ic} style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? 'var(--text)' : 'var(--text-muted)', background: i === 0 ? 'color-mix(in oklab, var(--p-openresto) 16%, var(--bg-elev-3))' : 'transparent' }}>
              <Icon name={ic} size={13} />
            </span>
          ))}
        </div>

        {/* Контент */}
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Добрый день. <span style={{ color: 'var(--text-3)' }}>3 задачи на сегодня.</span></div>

          {/* Метрики */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['Задачи', '3', '--p-openresto'], ['Inbox', '2', '--warn'], ['Доход', '84к', '--success']].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{l}</div>
                <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{v}</div>
                <div style={{ height: 3, borderRadius: 99, marginTop: 5, background: `color-mix(in oklab, var(${c}) 55%, transparent)` }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Задачи */}
            <div style={{ flex: 1.3, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Созвон с командой', true, '--p-openresto'], ['Оплатить ОСАГО', false, '--p-girl'], ['Разобрать Inbox', false, '--warn']].map(([t, done, c]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, border: `1.5px solid ${done ? 'transparent' : 'var(--border-strong)'}`, background: done ? `var(${c})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {done && <Icon name="check" size={8} style={{ color: 'var(--bg)' }} />}
                  </span>
                  <span style={{ fontSize: 10.5, color: done ? 'var(--text-muted)' : 'var(--text-2)', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                </div>
              ))}
            </div>
            {/* Бары */}
            <div style={{ flex: 1, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: `color-mix(in oklab, var(--p-openresto) ${35 + i * 8}%, transparent)` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Лендинг ────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="app-surface" style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <style>{`
        .ld-container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .ld-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .ld-features  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ld-principles{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ld-mockup    { transform: perspective(1200px) rotateY(-6deg) rotateX(2deg); }
        @media (max-width: 900px) {
          .ld-hero-grid { grid-template-columns: 1fr; gap: 36px; }
          .ld-features  { grid-template-columns: repeat(2, 1fr); }
          .ld-principles{ grid-template-columns: 1fr; }
          .ld-mockup    { transform: none; }
          .ld-h1 { font-size: 34px !important; }
        }
        @media (max-width: 560px) {
          .ld-features { grid-template-columns: 1fr; }
        }
        @keyframes ld-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .ld-rise   { animation: ld-rise 600ms cubic-bezier(0.2, 0.7, 0.3, 1) both; }
        .ld-rise-2 { animation-delay: 120ms; }
        .ld-rise-3 { animation-delay: 240ms; }
      `}</style>

      {/* ── Шапка ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'color-mix(in oklab, var(--bg) 82%, transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="ld-container" style={{ height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.png" alt="" style={{ height: 28, borderRadius: 7 }} />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>NexoraOS</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'color-mix(in oklab, var(--p-openresto) 16%, transparent)', color: 'var(--p-openresto)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>beta</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => navigate('/login')}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{ height: 34, padding: '0 16px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 120ms' }}>
            Войти
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}><GradientCanvas /></div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, var(--bg) 100%)' }} />

        <div className="ld-container" style={{ position: 'relative', padding: '72px 24px 90px' }}>
          <div className="ld-hero-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div className="ld-rise" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 999, background: 'color-mix(in oklab, var(--bg-elev-2) 80%, transparent)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                Открытая бета · бесплатно
              </div>

              <h1 className="ld-rise ld-rise-2 ld-h1" style={{ margin: 0, fontSize: 46, fontWeight: 500, lineHeight: 1.12, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                Операционная система<br />
                <span style={{ background: 'linear-gradient(90deg, var(--p-openresto), var(--p-sites), var(--p-youmin))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                  для твоей жизни
                </span>
              </h1>

              <p className="ld-rise ld-rise-2" style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--text-3)', maxWidth: 460 }}>
                Задачи, календарь, заметки, финансы, привычки, машина, дом и отношения —
                вместо десятка приложений один личный кабинет, где всё связано.
              </p>

              <div className="ld-rise ld-rise-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/login?mode=register')}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px -6px color-mix(in oklab, var(--text) 50%, transparent)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px -6px color-mix(in oklab, var(--text) 30%, transparent)'}
                  style={{ height: 46, padding: '0 26px', borderRadius: 12, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 20px -6px color-mix(in oklab, var(--text) 30%, transparent)', transition: 'box-shadow 160ms' }}>
                  Попробовать бету <Icon name="arrow_up_right" size={15} />
                </button>
                <a href="#features"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ height: 46, padding: '0 22px', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 15, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', transition: 'background 120ms' }}>
                  Что внутри
                </a>
              </div>

              <div className="ld-rise ld-rise-3" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="lock" size={12} /> данные в России</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={12} /> без рекламы и трекеров</span>
              </div>
            </div>

            <div className="ld-rise ld-rise-3"><AppMockup /></div>
          </div>
        </div>
      </section>

      {/* ── Возможности ── */}
      <section id="features" className="ld-container" style={{ padding: '30px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Возможности</div>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text)' }}>Один кабинет вместо десяти приложений</h2>
        </div>

        <div className="ld-features">
          {FEATURES.map(f => (
            <div key={f.title}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in oklab, var(${f.color}) 45%, var(--border-subtle))`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
              style={{ padding: '22px 22px 24px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 160ms, transform 160ms' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: `color-mix(in oklab, var(${f.color}) 15%, transparent)`, color: `var(${f.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={18} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{f.title}</span>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-3)' }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Принципы ── */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)' }}>
        <div className="ld-container" style={{ padding: '48px 24px' }}>
          <div className="ld-principles">
            {PRINCIPLES.map(p => (
              <div key={p.title} style={{ display: 'flex', gap: 14 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={p.icon} size={15} />
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 5 }}>{p.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-3)' }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ld-container" style={{ padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Наведи порядок в жизни за один вечер
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-3)' }}>
          Регистрация за минуту. Никаких карт и подписок — это бета.
        </p>
        <button onClick={() => navigate('/login?mode=register')}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 36px -6px color-mix(in oklab, var(--text) 50%, transparent)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
          style={{ height: 48, padding: '0 30px', borderRadius: 12, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'box-shadow 160ms' }}>
          Создать аккаунт бесплатно
        </button>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
          Лучше всего работает на компьютере
        </div>
      </section>

      {/* ── Футер ── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="ld-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>© {new Date().getFullYear()} NexoraOS</span>
          <span style={{ flex: 1 }} />
          <Link to="/privacy" style={{ color: 'var(--text-muted)' }}>Конфиденциальность</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)' }}>Условия</Link>
          <a href="mailto:dmitrii.nekrasov.01@gmail.com" style={{ color: 'var(--text-muted)' }}>Контакт</a>
        </div>
      </footer>
    </div>
  );
}
