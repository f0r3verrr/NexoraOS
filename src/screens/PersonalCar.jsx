import { useState, useMemo } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, SpinInput } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Modal, Field, fieldStyle } from '../components/Modal.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { ModuleFilesGrid, ModulePhoto } from '../components/ModuleFiles.jsx';
import { ModuleReminderBanner } from '../components/ModuleReminders.jsx';
import {
  useCarProfile, useUpsertCarProfile,
  useCarDeadlines, useSaveCarDeadline, useDeleteCarDeadline,
  useCarService, useSaveCarService, useDeleteCarService,
} from '../hooks/useCar.js';
import { plural } from '../lib/plural.js';

const C = '--p-car';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((d - now) / 86400000);
}
function fmtRu(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ─── Профиль ────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }) {
  const upsert = useUpsertCarProfile();
  const [name,    setName]    = useState(profile?.name ?? '');
  const [plate,   setPlate]   = useState(profile?.plate ?? '');
  const [spec,    setSpec]    = useState(profile?.spec ?? '');
  const [status,  setStatus]  = useState(profile?.status ?? 'в порядке');
  const [mileage, setMileage] = useState(String(profile?.mileage ?? ''));
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Укажи название'); return; }
    try {
      await upsert.mutateAsync({ name: name.trim(), plate: plate.trim() || null, spec: spec.trim() || null, status: status.trim() || 'в порядке', mileage: parseInt(mileage) || 0 });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={profile ? 'Машина' : 'Добавить машину'} onClose={onClose}>
      <Field label="Название"><input value={name} onChange={e => setName(e.target.value)} placeholder="Hyundai Tucson, 2019" autoFocus style={fieldStyle} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Госномер"><input value={plate} onChange={e => setPlate(e.target.value)} placeholder="М 245 ОН 77" style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }} /></Field>
        <Field label="Пробег, км"><SpinInput value={mileage} onChange={setMileage} placeholder="91240" min={0} step={100} /></Field>
      </div>
      <Field label="Характеристики"><input value={spec} onChange={e => setSpec(e.target.value)} placeholder="2.0 бензин · АКПП" style={fieldStyle} /></Field>
      <Field label="Статус"><input value={status} onChange={e => setStatus(e.target.value)} placeholder="в порядке" style={fieldStyle} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={upsert.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Срок ───────────────────────────────────────────────── */
function DeadlineModal({ deadline, onClose }) {
  const save = useSaveCarDeadline();
  const [label,   setLabel]   = useState(deadline?.label ?? '');
  const [byDate,  setByDate]  = useState(deadline ? deadline.due_date != null : true);
  const [dueDate, setDueDate] = useState(deadline?.due_date ?? todayStr());
  const [dueKm,   setDueKm]   = useState(String(deadline?.due_km ?? ''));
  const [note,    setNote]    = useState(deadline?.note ?? '');
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!label.trim()) { setError('Укажи название'); return; }
    try {
      await save.mutateAsync({
        id: deadline?.id,
        label: label.trim(),
        due_date: byDate ? dueDate : null,
        due_km: byDate ? null : (parseInt(dueKm) || null),
        note: note.trim() || null,
      });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={deadline ? 'Изменить срок' : 'Новый срок'} sub="ОСАГО, ТО, техосмотр…" onClose={onClose}>
      <Field label="Название"><input value={label} onChange={e => setLabel(e.target.value)} placeholder="ОСАГО" autoFocus style={fieldStyle} /></Field>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['По дате', true], ['По пробегу', false]].map(([l, v]) => (
          <button key={l} onClick={() => setByDate(v)}
            style={{ height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${byDate === v ? `var(${C})` : 'var(--border-subtle)'}`, background: byDate === v ? `color-mix(in oklab, var(${C}) 14%, transparent)` : 'transparent', color: byDate === v ? `var(${C})` : 'var(--text-3)' }}>
            {l}
          </button>
        ))}
      </div>
      {byDate ? (
        <Field label="Дата"><DatePicker value={dueDate} onChange={v => v && setDueDate(v)} /></Field>
      ) : (
        <Field label="Пробег, км"><SpinInput value={dueKm} onChange={setDueKm} placeholder="95000" min={0} step={500} /></Field>
      )}
      <Field label="Заметка"><input value={note} onChange={e => setNote(e.target.value)} placeholder="14 240 ₽" style={fieldStyle} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

function CountdownTile({ deadline, mileage, onEdit, onDelete }) {
  const days = daysUntil(deadline.due_date);
  const kmLeft = deadline.due_km != null && mileage != null ? deadline.due_km - mileage : null;
  const urgent = (days != null && days <= 14) || (kmLeft != null && kmLeft <= 500);

  return (
    <div
      onMouseEnter={e => e.currentTarget.querySelector('.dl-actions').style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.querySelector('.dl-actions').style.opacity = '0'}
      style={{ position: 'relative', padding: '14px 16px', background: urgent ? 'color-mix(in oklab, var(--danger) 10%, var(--bg-elev-1))' : 'var(--bg-elev-1)', border: `1px solid ${urgent ? 'color-mix(in oklab, var(--danger) 30%, var(--border))' : 'var(--border-subtle)'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{deadline.label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 500, color: urgent ? 'var(--danger)' : 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {days != null ? days : kmLeft != null ? kmLeft.toLocaleString('ru') : '—'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{days != null ? 'дней' : kmLeft != null ? 'км' : ''}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {deadline.due_date ? `до ${fmtRu(deadline.due_date)}` : deadline.due_km != null ? `на ${deadline.due_km.toLocaleString('ru')} км` : ''}
        </span>
        {deadline.note && <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{deadline.note}</span>}
      </div>
      <div className="dl-actions touch-reveal" style={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2 }}>
        <IconButton icon="edit"  size="sm" title="Изменить" onClick={onEdit} />
        <IconButton icon="trash" size="sm" title="Удалить"  onClick={onDelete} />
      </div>
    </div>
  );
}

/* ─── Запись ТО ──────────────────────────────────────────── */
function ServiceModal({ entry, onClose }) {
  const save = useSaveCarService();
  const [date,  setDate]  = useState(entry?.date ?? todayStr());
  const [km,    setKm]    = useState(String(entry?.km ?? ''));
  const [title, setTitle] = useState(entry?.title ?? '');
  const [place, setPlace] = useState(entry?.place ?? '');
  const [cost,  setCost]  = useState(String(entry?.cost ?? ''));
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Опиши работы'); return; }
    try {
      await save.mutateAsync({ id: entry?.id, date, km: parseInt(km) || null, title: title.trim(), place: place.trim() || null, cost: parseFloat(cost) || 0 });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={entry ? 'Изменить запись' : 'Запись в журнал ТО'} onClose={onClose}>
      <Field label="Что делали"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Замена масла, фильтра" autoFocus style={fieldStyle} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Дата"><DatePicker value={date} onChange={v => v && setDate(v)} /></Field>
        <Field label="Пробег, км"><SpinInput value={km} onChange={setKm} placeholder="91240" min={0} step={100} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Где"><input value={place} onChange={e => setPlace(e.target.value)} placeholder="СТО Молот" style={fieldStyle} /></Field>
        <Field label="Стоимость, ₽"><SpinInput value={cost} onChange={setCost} placeholder="6500" min={0} step={500} /></Field>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Экран ──────────────────────────────────────────────── */
export default function PersonalCar() {
  const { data: profile, isLoading: pL }   = useCarProfile();
  const { data: deadlines = [] }           = useCarDeadlines();
  const { data: service = [] }             = useCarService();
  const upsertProfile  = useUpsertCarProfile();
  const deleteDeadline = useDeleteCarDeadline();
  const deleteService  = useDeleteCarService();

  const [profileModal,  setProfileModal]  = useState(false);
  const [deadlineModal, setDeadlineModal] = useState(null);   // null | 'new' | deadline
  const [serviceModal,  setServiceModal]  = useState(null);   // null | 'new' | entry
  const [editKm,        setEditKm]        = useState(null);   // null | строка ввода

  const urgentCount = deadlines.filter(d => {
    const days = daysUntil(d.due_date);
    const kmLeft = d.due_km != null && profile ? d.due_km - profile.mileage : null;
    return (days != null && days <= 14) || (kmLeft != null && kmLeft <= 500);
  }).length;

  /* Затраты за 12 месяцев + по месяцам за 6 */
  const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearCost = service.filter(s => new Date(s.date) >= yearAgo).reduce((a, s) => a + Number(s.cost), 0);

  const monthlyCosts = useMemo(() => {
    const res = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const sum = service
        .filter(s => { const sd = new Date(s.date); return `${sd.getFullYear()}-${sd.getMonth()}` === key; })
        .reduce((a, s) => a + Number(s.cost), 0);
      res.push({ label: d.toLocaleDateString('ru', { month: 'short' }), sum });
    }
    return res;
  }, [service]);
  const maxCost = Math.max(...monthlyCosts.map(m => m.sum), 1);

  const saveKm = () => {
    const v = parseInt(editKm);
    if (v > 0) upsertProfile.mutate({ name: profile.name, mileage: v });
    setEditKm(null);
  };

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      {profileModal && <ProfileModal profile={profile} onClose={() => setProfileModal(false)} />}
      {deadlineModal && <DeadlineModal deadline={deadlineModal === 'new' ? null : deadlineModal} onClose={() => setDeadlineModal(null)} />}
      {serviceModal && <ServiceModal entry={serviceModal === 'new' ? null : serviceModal} onClose={() => setServiceModal(null)} />}

      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${C})` }} />
            Машина
          </span>}
          sub={profile ? [profile.name, profile.plate].filter(Boolean).join(' · ') : 'настрой свой автомобиль'}
          right={
            <Button variant="secondary" size="sm" icon="plus" onClick={() => setServiceModal('new')}>Запись в журнал</Button>
          }
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>
          <ModuleReminderBanner module="car" />

          {/* hero: машина + сканы документов */}
          <div className="rstack-lg" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
            {pL ? <div /> : !profile ? (
              <div style={{ padding: '48px 24px', background: `linear-gradient(135deg, color-mix(in oklab, var(${C}) 12%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 60%)`, border: `1px solid color-mix(in oklab, var(${C}) 25%, var(--border-subtle))`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ width: 48, height: 48, borderRadius: 12, background: `color-mix(in oklab, var(${C}) 16%, transparent)`, color: `var(${C})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="car" size={22} />
                </span>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Машина ещё не добавлена</span>
                <Button variant="primary" icon="plus" onClick={() => setProfileModal(true)}>Добавить машину</Button>
              </div>
            ) : (
              <div style={{ background: `linear-gradient(135deg, color-mix(in oklab, var(${C}) 12%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 60%)`, border: `1px solid color-mix(in oklab, var(${C}) 25%, var(--border-subtle))`, borderRadius: 14, position: 'relative', overflow: 'hidden', minHeight: 208 }}>
                {/* фото во всю правую часть, растворяется в фон */}
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '46%' }}>
                  <ModulePhoto module="car-photo" shape="fill" accent={C} label="фото авто" />
                </div>

                <div style={{ position: 'relative', padding: '22px 24px', maxWidth: '56%', display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="car" size={16} style={{ color: `var(${C})` }} />
                    <span style={{ fontSize: 11, color: `var(${C})`, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{profile.status}</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.015em' }}>{profile.name}</h2>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {profile.plate && (
                      <span style={{ fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: 6, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)', letterSpacing: '0.05em' }}>
                        {profile.plate}
                      </span>
                    )}
                    {profile.spec && <span>{profile.spec}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>пробег</span>
                    {editKm !== null ? (
                      <input autoFocus type="number" value={editKm} onChange={e => setEditKm(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveKm(); if (e.key === 'Escape') setEditKm(null); }}
                        onBlur={saveKm}
                        className="no-ring"
                        style={{ ...fieldStyle, width: 140, fontFamily: 'var(--font-mono)', fontSize: 18 }} />
                    ) : (
                      <span onClick={() => setEditKm(String(profile.mileage))} title="Обновить пробег"
                        style={{ fontSize: 26, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', cursor: 'pointer', borderBottom: '1px dashed var(--border-strong)' }}>
                        {Number(profile.mileage).toLocaleString('ru')}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>км</span>
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                  <IconButton icon="edit" size="sm" title="Изменить данные" onClick={() => setProfileModal(true)} />
                </div>
              </div>
            )}

            {/* сканы документов — живут только в этом модуле */}
            <div style={{ padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Документы</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>СТС · ПТС · ОСАГО · В/У</span>
              </div>
              <ModuleFilesGrid module="car-docs" accent={C} columns={3} hint="Сфоткай или загрузи сканы — они хранятся только здесь" />
            </div>
          </div>

          {/* сроки */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Сроки</span>
              {urgentCount > 0 && <span style={{ fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{urgentCount} срочно</span>}
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setDeadlineModal('new')}>Добавить срок</Button>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ padding: '20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Добавь сроки ОСАГО, техосмотра и ТО — здесь будет обратный отсчёт
              </div>
            ) : (
              <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {deadlines.map(d => (
                  <CountdownTile key={d.id} deadline={d} mileage={profile?.mileage}
                    onEdit={() => setDeadlineModal(d)}
                    onDelete={() => deleteDeadline.mutate(d.id)} />
                ))}
              </div>
            )}
          </div>

          {/* журнал + затраты */}
          <div className="rstack-lg" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Журнал ТО</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>за 12 месяцев · {yearCost.toLocaleString('ru')} ₽</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {service.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                    Журнал пуст — добавь первую запись
                  </div>
                ) : (
                  service.map((s, i) => (
                    <div key={s.id}
                      onMouseEnter={e => e.currentTarget.querySelector('.sv-actions').style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.querySelector('.sv-actions').style.opacity = '0'}
                      style={{ display: 'grid', gridTemplateColumns: '92px 1fr 80px 80px 48px', padding: '12px 18px', gap: 12, borderBottom: i === service.length - 1 ? 'none' : '1px solid var(--border-subtle)', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(s.date).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.title}</span>
                        {s.place && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.place}</span>}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {s.km != null ? `${Number(s.km).toLocaleString('ru')} км` : '—'}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(s.cost).toLocaleString('ru')} ₽
                      </span>
                      <div className="sv-actions touch-reveal" style={{ opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <IconButton icon="edit"  size="sm" onClick={() => setServiceModal(s)} />
                        <IconButton icon="trash" size="sm" onClick={() => deleteService.mutate(s.id)} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* затраты по месяцам */}
            <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Затраты на авто</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>6 месяцев</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
                {monthlyCosts.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {m.sum > 0 ? `${(m.sum / 1000).toFixed(m.sum >= 10000 ? 0 : 1)}к` : ''}
                    </span>
                    <div style={{ width: '100%', height: `${Math.max(m.sum / maxCost * 70, m.sum > 0 ? 6 : 2)}%`, background: m.sum > 0 ? `color-mix(in oklab, var(${C}) 55%, transparent)` : 'var(--bg-elev-3)', borderRadius: 4 }} />
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{m.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-3)' }}>
                {service.length > 0 ? `${plural(service.length, 'запись', 'записи', 'записей')} в журнале` : 'Затраты появятся из журнала ТО'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
