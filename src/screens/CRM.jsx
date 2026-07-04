import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Avatar } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '../hooks/useContacts.js';
import { useProjects } from '../hooks/useProjects.js';
import { useSegments } from '../hooks/useSegments.js';
import { useContactActivities, useCreateActivity, useDeleteActivity } from '../hooks/useContactActivities.js';
import { useContactReminders, useCreateReminder, useToggleReminder, useDeleteReminder } from '../hooks/useContactReminders.js';
import { useContactTasks, useCreateTask, useToggleTask, useDeleteTask } from '../hooks/useTasks.js';

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

const STATUS_TONE = { 'В работе': 'info', 'Готово': 'success', 'Переговоры': 'warn', 'Новый': 'neutral', 'Архив': 'neutral' };
const STATUSES    = ['Новый', 'В работе', 'Переговоры', 'Готово', 'Архив'];

const ACTIVITY_TYPES = [
  { id: 'note',    label: 'Заметка', icon: 'note' },
  { id: 'call',    label: 'Звонок',  icon: 'phone' },
  { id: 'meeting', label: 'Встреча', icon: 'users' },
  { id: 'email',   label: 'Письмо',  icon: 'message' },
];

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function socialIcon(url) {
  if (!url) return 'globe';
  if (/t\.me|telegram/i.test(url))  return 'send';
  if (/instagram|inst/i.test(url))  return 'camera';
  if (/linkedin/i.test(url))        return 'briefcase';
  if (/vk\.com/i.test(url))         return 'users';
  return 'globe';
}

function fmtMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} млн ₽`;
  return `${Math.round(n).toLocaleString('ru')} ₽`;
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

const inputSx = {
  height: 36, padding: '0 12px',
  background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box',
};

/* ─── Add / Edit Contact Modal ─────────────────────────────────────────────── */
function ContactModal({ contact, onClose }) {
  const isEdit = !!contact;
  const { data: projects = [] } = useProjects();
  const { data: segments = [] } = useSegments();
  const create = useCreateContact();
  const update = useUpdateContact();
  const mousedownOnBackdrop = useRef(false);

  const [name,     setName]     = useState(contact?.name        ?? '');
  const [email,    setEmail]    = useState(contact?.email       ?? '');
  const [phone,    setPhone]    = useState(contact?.phone       ?? '');
  const [social,   setSocial]   = useState(contact?.social_link ?? '');
  const [status,   setStatus]   = useState(contact?.status      ?? 'Новый');
  const [projId,   setProjId]   = useState(contact?.project_id  ?? '');
  const [segId,    setSegId]    = useState(contact?.segment_id  ?? '');
  const [dealAmt,  setDealAmt]  = useState(contact?.deal_amount ? String(contact.deal_amount) : '');
  const [notes,    setNotes]    = useState(contact?.notes       ?? '');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError('Введи имя'); return; }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(), email, phone, social_link: social, status,
        project_id: projId || null, segment_id: segId || null,
        deal_amount: dealAmt ? parseFloat(dealAmt) : null,
        notes,
      };
      if (isEdit) await update.mutateAsync({ id: contact.id, ...payload });
      else        await create.mutateAsync(payload);
      onClose();
    } catch (e) {
      setError(e.message ?? 'Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflow: 'auto' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 20px', width: '100%', maxWidth: 480, boxSizing: 'border-box', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
          {isEdit ? 'Редактировать контакт' : 'Новый контакт'}
        </div>

        <Field label="Имя *">
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Анна Соколова" autoFocus style={inputSx} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Email">
            <input value={email} type="email" onChange={e => setEmail(e.target.value)} placeholder="anna@example.com" style={inputSx} />
          </Field>
          <Field label="Телефон">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 900 000 00 00" style={inputSx} />
          </Field>
        </div>

        <Field label="Ссылка (соцсети, сайт, мессенджер)">
          <div style={{ position: 'relative' }}>
            <Icon name="globe" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input value={social} onChange={e => setSocial(e.target.value)}
              placeholder="https://t.me/username или instagram.com/…" style={{ ...inputSx, paddingLeft: 30 }} />
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Статус">
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Сегмент">
            <select value={segId} onChange={e => setSegId(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }}>
              <option value="">— нет —</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Сумма сделки (₽)">
            <input value={dealAmt} type="number" min="0" step="any"
              onChange={e => setDealAmt(e.target.value)}
              placeholder="0" style={inputSx} />
          </Field>
        </div>

        <Field label="Проект">
          <select value={projId} onChange={e => setProjId(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }}>
            <option value="">— нет —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="Заметки">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="ws-scroll"
            style={{ ...inputSx, height: 'auto', padding: '8px 12px', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }} />
        </Field>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -4 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit} style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? '…' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail panel: Overview tab ───────────────────────────────────────────── */
function OverviewTab({ contact, onStatusChange }) {
  const { data: reminders = [] } = useContactReminders(contact.id);
  const createReminder = useCreateReminder();
  const toggleReminder = useToggleReminder();
  const deleteReminder = useDeleteReminder();
  const [rBody, setRBody] = useState('');
  const [rDate, setRDate] = useState('');
  const colorToken = contact.project?.color_token ?? '--p-openresto';

  const addReminder = async () => {
    if (!rBody.trim() || !rDate) return;
    await createReminder.mutateAsync({ contact_id: contact.id, body: rBody.trim(), remind_at: new Date(rDate).toISOString() });
    setRBody(''); setRDate('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Status */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Статус</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {STATUSES.map(s => {
            const active = contact.status === s;
            const tone   = STATUS_TONE[s];
            return (
              <button key={s} onClick={() => onStatusChange(s)} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                fontWeight: active ? 500 : 400,
                background: active ? `color-mix(in oklab, var(--${tone === 'neutral' ? 'text-2' : tone}) 14%, transparent)` : 'var(--bg-elev-2)',
                border: `1px solid ${active ? `color-mix(in oklab, var(--${tone === 'neutral' ? 'text-2' : tone}) 30%, transparent)` : 'var(--border-subtle)'}`,
                color: active ? (tone === 'neutral' ? 'var(--text-2)' : `var(--${tone})`) : 'var(--text-3)',
              }}>{s}</button>
            );
          })}
        </div>
      </div>

      {/* Contact info */}
      {(contact.email || contact.phone || contact.social_link) && (
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contact.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
              <Icon name="message" size={14} style={{ color: 'var(--text-3)', flex: 'none' }} />
              <a href={`mailto:${contact.email}`} style={{ color: 'var(--text-2)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
              <Icon name="phone" size={14} style={{ color: 'var(--text-3)', flex: 'none' }} />
              <a href={`tel:${contact.phone}`} style={{ color: 'var(--text-2)', textDecoration: 'none' }}>{contact.phone}</a>
            </div>
          )}
          {contact.social_link && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
              <Icon name={socialIcon(contact.social_link)} size={14} style={{ color: 'var(--text-3)', flex: 'none' }} />
              <a href={contact.social_link.startsWith('http') ? contact.social_link : `https://${contact.social_link}`}
                target="_blank" rel="noreferrer"
                style={{ color: 'var(--info)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {contact.social_link.replace(/^https?:\/\//, '')}
              </a>
              <Icon name="external" size={12} style={{ color: 'var(--text-3)', flex: 'none' }} />
            </div>
          )}
        </div>
      )}

      {/* Deal amount */}
      {contact.deal_amount > 0 && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--success) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--success) 25%, transparent)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Сумма сделки</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            {Number(contact.deal_amount).toLocaleString('ru')} ₽
          </div>
        </div>
      )}

      {/* Segment */}
      {contact.segment && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-3)' }}>
          <Icon name="layers" size={13} />
          <span>Сегмент:</span>
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{contact.segment.name}</span>
        </div>
      )}

      {/* Project */}
      {contact.project && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${colorToken})`, flex: 'none' }} />
          <span>Проект:</span>
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{contact.project.name}</span>
        </div>
      )}

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Добавлен</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(contact.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Обновлён</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(contact.updated_at ?? contact.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</div>
        </div>
      </div>

      {/* Notes */}
      {contact.notes && (
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Заметки</div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{contact.notes}</p>
        </div>
      )}

      {/* Reminders */}
      <div>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="bell" size={14} style={{ color: 'var(--text-3)' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', flex: 1 }}>Напоминания</span>
          {reminders.filter(r => !r.done).length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--warn)', background: 'color-mix(in oklab, var(--warn) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--warn) 30%, transparent)', padding: '1px 8px', borderRadius: 99, fontWeight: 500 }}>
              {reminders.filter(r => !r.done).length}
            </span>
          )}
        </div>

        {/* Add form */}
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '10px 12px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={rBody} onChange={e => setRBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && rDate && addReminder()}
            placeholder="Что напомнить…"
            style={{ height: 32, padding: '0 11px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icon name="clock" size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input type="datetime-local" value={rDate} onChange={e => setRDate(e.target.value)}
                style={{ width: '100%', height: 30, padding: '0 8px 0 26px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 11, color: 'var(--text-2)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={addReminder} style={{
              height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: rBody.trim() && rDate ? 'var(--text)' : 'var(--bg-elev-2)',
              color: rBody.trim() && rDate ? 'var(--bg)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              transition: 'background 150ms, color 150ms',
              whiteSpace: 'nowrap',
            }}>
              Добавить
            </button>
          </div>
        </div>

        {/* List */}
        {reminders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 0' }}>
            <Icon name="bell" size={22} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет напоминаний</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reminders.map(r => {
              const overdue  = !r.done && new Date(r.remind_at) < new Date();
              const remDate  = new Date(r.remind_at);
              const now      = new Date();
              const diffMs   = remDate - now;
              const diffDays = Math.floor(diffMs / 86400000);
              let timeStr;
              if (r.done) {
                timeStr = remDate.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              } else if (overdue) {
                const days = Math.floor((now - remDate) / 86400000);
                timeStr = days === 0 ? 'Сегодня — просрочено' : `${days} дн. назад`;
              } else if (diffDays === 0) {
                timeStr = `Сегодня · ${remDate.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`;
              } else if (diffDays === 1) {
                timeStr = `Завтра · ${remDate.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`;
              } else {
                timeStr = remDate.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              }

              return (
                <div key={r.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '9px 11px',
                  background: overdue && !r.done
                    ? 'color-mix(in oklab, var(--danger) 5%, var(--bg-elev-1))'
                    : 'var(--bg-elev-1)',
                  border: `1px solid ${overdue && !r.done
                    ? 'color-mix(in oklab, var(--danger) 22%, var(--border-subtle))'
                    : 'var(--border-subtle)'}`,
                  borderRadius: 10,
                  transition: 'border-color 120ms',
                }}>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleReminder.mutate({ id: r.id, done: !r.done, contact_id: contact.id })}
                    style={{
                      flex: 'none', marginTop: 1,
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${r.done ? 'var(--success)' : overdue ? 'var(--danger)' : 'var(--border)'}`,
                      background: r.done ? 'var(--success)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}>
                    {r.done && <Icon name="check" size={11} stroke={2.5} style={{ color: 'white' }} />}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: r.done ? 'var(--text-muted)' : 'var(--text-2)', textDecoration: r.done ? 'line-through' : 'none', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Icon name="clock" size={10} style={{ color: overdue && !r.done ? 'var(--danger)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: 11, color: overdue && !r.done ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeStr}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => deleteReminder.mutate({ id: r.id, contact_id: contact.id })}
                    style={{ flex: 'none', color: 'var(--text-muted)', display: 'flex', padding: 2, borderRadius: 4, cursor: 'pointer', transition: 'color 120ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Detail panel: Activity tab ────────────────────────────────────────────── */
function ActivityTab({ contactId }) {
  const { data: activities = [] } = useContactActivities(contactId);
  const create = useCreateActivity();
  const del    = useDeleteActivity();
  const [type, setType] = useState('note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    await create.mutateAsync({ contact_id: contactId, type, body: body.trim() });
    setBody('');
    setBusy(false);
  };

  const grouped = activities.reduce((acc, a) => {
    const date = new Date(a.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
    (acc[date] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Add form */}
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {ACTIVITY_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} title={t.label} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              height: 28, borderRadius: 6, fontSize: 11, cursor: 'pointer', overflow: 'hidden',
              background: type === t.id ? 'var(--bg-elev-3)' : 'transparent',
              border: `1px solid ${type === t.id ? 'var(--border)' : 'transparent'}`,
              color: type === t.id ? 'var(--text)' : 'var(--text-3)',
            }}>
              <Icon name={t.icon} size={12} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          ))}
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          placeholder="Что произошло… (Ctrl+Enter чтобы сохранить)"
          rows={2} className="ws-scroll"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" onClick={submit} style={{ opacity: body.trim() && !busy ? 1 : 0.5 }}>
            {busy ? '…' : 'Добавить'}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {Object.entries(grouped).map(([date, acts]) => (
        <div key={date}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{date}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {acts.map(a => {
              const t = ACTIVITY_TYPES.find(x => x.id === a.type) ?? ACTIVITY_TYPES[0];
              return (
                <div key={a.id}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}
                  onMouseEnter={e => e.currentTarget.querySelector('.act-del').style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.querySelector('.act-del').style.opacity = '0'}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
                    <Icon name={t.icon} size={12} style={{ color: 'var(--text-3)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>
                      {t.label} · {new Date(a.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{a.body}</div>
                  </div>
                  <button className="act-del" onClick={() => del.mutate({ id: a.id, contact_id: contactId })}
                    style={{ color: 'var(--text-muted)', opacity: 0, transition: 'opacity 120ms', display: 'flex', flex: 'none' }}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Нет активности — добавь первую запись
        </div>
      )}
    </div>
  );
}

/* ─── Detail panel: Tasks tab ───────────────────────────────────────────────── */
function TasksTab({ contactId }) {
  const { data: tasks = [] } = useContactTasks(contactId);
  const create = useCreateTask();
  const toggle = useToggleTask();
  const del    = useDeleteTask();
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');

  const submit = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({ title: title.trim(), due_at: dueAt || null, contact_id: contactId });
    setTitle(''); setDueAt('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Новая задача…"
          style={{ height: 30, padding: '0 10px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)}
            style={{ flex: 1, height: 28, padding: '0 8px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 7, fontSize: 11, color: 'var(--text-2)', outline: 'none' }} />
          <Button variant="primary" size="sm" onClick={submit} style={{ opacity: title.trim() ? 1 : 0.5 }}>Добавить</Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--text-muted)' }}>Нет задач</div>
      ) : tasks.map(t => {
        const overdue = t.due_at && !t.done && new Date(t.due_at) < new Date();
        return (
          <div key={t.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}
            onMouseEnter={e => e.currentTarget.querySelector('.task-del').style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.querySelector('.task-del').style.opacity = '0'}
          >
            <button onClick={() => toggle.mutate({ id: t.id, done: !t.done })} style={{ flex: 'none', marginTop: 1 }}>
              <Icon name={t.done ? 'check_circle' : 'circle'} size={18} stroke={1.8} style={{ color: t.done ? 'var(--success)' : 'var(--text-3)' }} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: t.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{t.title}</div>
              {t.due_at && (
                <div style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {new Date(t.due_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <button className="task-del" onClick={() => del.mutate(t.id)}
              style={{ color: 'var(--danger)', opacity: 0, transition: 'opacity 120ms', display: 'flex', flex: 'none' }}>
              <Icon name="trash" size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Detail panel ──────────────────────────────────────────────────────────── */
function DetailPanel({ contact, onEdit, onClose }) {
  const del    = useDeleteContact();
  const update = useUpdateContact();
  const [tab, setTab] = useState('overview');
  const colorToken = contact.project?.color_token ?? '--p-openresto';

  const handleDelete = async () => {
    if (!confirm(`Удалить «${contact.name}»?`)) return;
    await del.mutateAsync(contact.id);
    onClose();
  };

  useEffect(() => { setTab('overview'); }, [contact.id]);

  const TABS = [{ id: 'overview', label: 'Обзор' }, { id: 'activity', label: 'Активность' }, { id: 'tasks', label: 'Задачи' }];

  return (
    <aside className="ws-scroll" style={{ width: 310, flex: 'none', overflowY: 'auto', padding: '16px 14px 28px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar initials={initials(contact.name)} color={`var(${colorToken})`} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
          {contact.project && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: `var(${colorToken})`, flex: 'none' }} />
              {contact.project.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 1, flex: 'none' }}>
          <IconButton icon="edit"  title="Редактировать" onClick={onEdit} />
          <IconButton icon="trash" title="Удалить" onClick={handleDelete} style={{ color: 'var(--danger)' }} />
          <IconButton icon="x"    title="Закрыть"  onClick={onClose} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 2, gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, height: 26, borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: tab === t.id ? 'var(--bg-elev-3)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text-3)',
            fontWeight: tab === t.id ? 500 : 400,
            border: tab === t.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
            transition: 'background 100ms',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab contact={contact} onStatusChange={s => update.mutate({ id: contact.id, status: s })} />}
      {tab === 'activity'  && <ActivityTab contactId={contact.id} />}
      {tab === 'tasks'     && <TasksTab    contactId={contact.id} />}
    </aside>
  );
}

/* ─── Pipeline accent colors ────────────────────────────────────────────────── */
const STATUS_ACCENT = {
  'Новый':      'var(--border)',
  'В работе':   'var(--info)',
  'Переговоры': 'var(--warn)',
  'Готово':     'var(--success)',
  'Архив':      'var(--border)',
};

/* ─── Pipeline card ─────────────────────────────────────────────────────────── */
function PipelineCard({ contact, isActive, isDragging, onClick, onDragStart, onDragEnd, selected, onToggleSelect, selectionMode }) {
  const colorToken = contact.project?.color_token ?? '--p-openresto';
  const money      = fmtMoney(contact.deal_amount);

  return (
    <div
      draggable={!selectionMode}
      onClick={selectionMode ? () => onToggleSelect(contact.id) : onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: isActive || selected ? 'var(--bg-elev-2)' : 'var(--bg-elev-1)',
        border: `1px solid ${selected ? 'var(--info)' : isActive ? 'var(--border)' : 'var(--border-subtle)'}`,
        borderRadius: 10, padding: '11px 13px',
        cursor: selectionMode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'background 120ms, border-color 120ms, opacity 150ms',
        opacity: isDragging ? 0.35 : 1,
        display: 'flex', flexDirection: 'column', gap: 8,
        userSelect: 'none',
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {selectionMode && (
          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? 'var(--info)' : 'var(--border)'}`, background: selected ? 'var(--info)' : 'transparent', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selected && <Icon name="check" size={12} stroke={2.5} style={{ color: 'white' }} />}
          </div>
        )}
        <Avatar initials={initials(contact.name)} color={`var(${colorToken})`} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
        </div>
        {money && <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 500, flex: 'none' }}>{money}</span>}
      </div>
      {(contact.email || contact.phone) && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
          <Icon name={contact.email ? 'message' : 'phone'} size={11} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email || contact.phone}</span>
        </div>
      )}
      {contact.project && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)', pointerEvents: 'none' }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: `var(${colorToken})`, flex: 'none' }} />
          {contact.project.name}
        </div>
      )}
    </div>
  );
}

/* ─── Pipeline view ─────────────────────────────────────────────────────────── */
function PipelineView({ contacts, activeId, setActiveId, selectedIds, onToggleSelect, selectionMode }) {
  const update                      = useUpdateContact();
  const [dragId,     setDragId]     = useState(null);
  const [overStatus, setOverStatus] = useState(null);
  const colRefs                     = useRef({});

  const dragContact = dragId ? contacts.find(c => c.id === dragId) : null;

  const handleDragStart = (e, contactId) => { setDragId(contactId); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', contactId); };
  const handleDragEnd   = () => { setDragId(null); setOverStatus(null); };
  const handleDragOver  = (e, status) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overStatus !== status) setOverStatus(status); };
  const handleDragLeave = (e, status) => { const col = colRefs.current[status]; if (col && !col.contains(e.relatedTarget)) setOverStatus(prev => prev === status ? null : prev); };
  const handleDrop      = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const c  = contacts.find(x => x.id === id);
    if (c && c.status !== status) update.mutate({ id, status });
    setDragId(null); setOverStatus(null);
  };

  return (
    <div className="ws-scroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 12, padding: '16px 20px 20px', minWidth: 'max-content', alignItems: 'flex-start' }}>
        {STATUSES.map(status => {
          const cards  = contacts.filter(c => c.status === status);
          const isOver = overStatus === status && dragId !== null;
          const accent = STATUS_ACCENT[status];
          const colSum = cards.reduce((s, c) => s + (c.deal_amount ?? 0), 0);

          return (
            <div key={status}
              ref={el => { colRefs.current[status] = el; }}
              onDragOver={e => handleDragOver(e, status)}
              onDragLeave={e => handleDragLeave(e, status)}
              onDrop={e => handleDrop(e, status)}
              style={{ width: 230, display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px' }}>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: isOver ? 'var(--text)' : 'var(--text-2)', letterSpacing: '0.02em', transition: 'color 120ms' }}>{status}</div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', background: 'var(--bg-elev-2)', padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>{cards.length}</span>
                {colSum > 0 && <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtMoney(colSum)}</span>}
              </div>
              <div style={{ height: 2, borderRadius: 99, background: accent, opacity: isOver ? 0.9 : 0.4, transition: 'opacity 150ms' }} />
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minHeight: 80,
                padding: isOver ? 5 : 0,
                background: isOver ? `color-mix(in oklab, ${accent} 7%, transparent)` : 'transparent',
                border: `1.5px ${isOver ? 'dashed' : 'solid'} ${isOver ? `color-mix(in oklab, ${accent} 35%, transparent)` : 'transparent'}`,
                borderRadius: 10, transition: 'background 150ms, border-color 150ms, padding 150ms',
              }}>
                {cards.map(c => (
                  <PipelineCard key={c.id} contact={c}
                    isActive={c.id === activeId} isDragging={dragId === c.id}
                    selected={selectedIds.has(c.id)} selectionMode={selectionMode}
                    onClick={() => { if (!dragId) setActiveId(c.id === activeId ? null : c.id); }}
                    onToggleSelect={onToggleSelect}
                    onDragStart={e => handleDragStart(e, c.id)} onDragEnd={handleDragEnd}
                  />
                ))}
                {cards.length === 0 && !isOver && (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>Пусто</div>
                )}
                {isOver && dragContact && dragContact.status !== status && (
                  <div style={{ height: 58, borderRadius: 9, pointerEvents: 'none', background: `color-mix(in oklab, ${accent} 10%, transparent)`, border: `1.5px dashed color-mix(in oklab, ${accent} 40%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: `color-mix(in oklab, ${accent} 70%, var(--text-3))`, gap: 6 }}>
                    <Icon name="arrow_down" size={13} />{dragContact.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Table view ────────────────────────────────────────────────────────────── */
function TableView({ contacts, activeId, setActiveId, hasPanel, selectedIds, onToggleSelect, onSelectAll, selectionMode }) {
  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id));
  const colsAll  = selectionMode ? '36px 2fr 130px 160px 90px 90px' : '2fr 130px 160px 90px 90px';
  const colsWide = selectionMode ? '36px 2fr 140px 90px'            : '2fr 140px 90px';
  const cols = hasPanel ? colsWide : colsAll;

  return (
    <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', alignItems: 'center', gap: 8 }}>
        {selectionMode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={onSelectAll} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${allSelected ? 'var(--info)' : 'var(--border)'}`, background: allSelected ? 'var(--info)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {allSelected && <Icon name="check" size={12} stroke={2.5} style={{ color: 'white' }} />}
            </button>
          </div>
        )}
        <div>Клиент</div>
        {!hasPanel && <div>Проект</div>}
        <div>{hasPanel ? 'Контакт' : 'Email / телефон'}</div>
        <div>Статус</div>
        {!hasPanel && <div>Добавлен</div>}
      </div>

      {contacts.length === 0 ? (
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Icon name="users" size={28} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ничего не найдено</span>
        </div>
      ) : contacts.map(c => {
        const colorToken = c.project?.color_token ?? '--p-openresto';
        const isActive   = c.id === activeId;
        const isSelected = selectedIds.has(c.id);
        return (
          <div key={c.id} onClick={() => selectionMode ? onToggleSelect(c.id) : setActiveId(c.id === activeId ? null : c.id)}
            onMouseEnter={e => { if (!isActive && !isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'color-mix(in oklab, var(--info) 6%, transparent)' : isActive ? 'var(--bg-elev-1)' : 'transparent'; }}
            style={{
            display: 'grid', gridTemplateColumns: cols, padding: '10px 20px',
            borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', gap: 8,
            background: isSelected ? 'color-mix(in oklab, var(--info) 6%, transparent)' : isActive ? 'var(--bg-elev-1)' : 'transparent',
            cursor: 'pointer', transition: 'background 100ms',
            borderLeft: isSelected ? '2px solid var(--info)' : '2px solid transparent',
          }}>
            {selectionMode && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={e => { e.stopPropagation(); onToggleSelect(c.id); }} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? 'var(--info)' : 'var(--border)'}`, background: isSelected ? 'var(--info)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {isSelected && <Icon name="check" size={12} stroke={2.5} style={{ color: 'white' }} />}
              </button>
            </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar initials={initials(c.name)} color={`var(${colorToken})`} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                {hasPanel && c.project && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: `var(${colorToken})` }} />{c.project.name}
                  </div>
                )}
                {c.deal_amount > 0 && <div style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{fmtMoney(c.deal_amount)}</div>}
              </div>
            </div>

            {!hasPanel && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.project && <><span style={{ width: 6, height: 6, borderRadius: 2, background: `var(${colorToken})`, flex: 'none' }} />{c.project.name}</>}
              </span>
            )}

            <div style={{ minWidth: 0 }}>
              {(c.email || c.phone) && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || c.phone}</div>
              )}
              {!c.email && !c.phone && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
            </div>

            <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>

            {!hasPanel && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {new Date(c.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function CRM() {
  const { data: contacts = [], isLoading } = useContacts();
  const { data: segments = [] }            = useSegments();
  const update        = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId,     setActiveId]     = useState(null);
  const [modalContact, setModalContact] = useState(null);
  const [view,         setView]         = useState('table');
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const search       = searchParams.get('q')      ?? '';
  const filterStatus = searchParams.get('status') ?? '';
  const activeSeg    = searchParams.get('seg')    ?? '';
  const sortBy       = searchParams.get('sort')   ?? '';
  const hideArchive  = searchParams.get('hide')   === 'archive';

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalContact(false);
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.delete('new'); return n; }, { replace: true });
    }
  }, [searchParams.get('new')]);

  // Clear selection when contacts change or selection mode off
  useEffect(() => { if (!selectionMode) setSelectedIds(new Set()); }, [selectionMode]);

  const active = contacts.find(c => c.id === activeId) ?? null;

  const filtered = contacts
    .filter(c => !hideArchive || c.status !== 'Архив')
    .filter(c => !filterStatus || c.status === filterStatus)
    .filter(c => !activeSeg || c.segment_id === activeSeg)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.social_link || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name')   return a.name.localeCompare(b.name, 'ru');
      if (sortBy === 'status') return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      return 0;
    });

  /* ─── Bulk actions ─── */
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filtered.map(c => c.id));
    const allSelected = filtered.every(c => selectedIds.has(c.id));
    setSelectedIds(allSelected ? new Set() : allIds);
  };

  const handleBulkStatus = async (status) => {
    await Promise.all([...selectedIds].map(id => update.mutateAsync({ id, status })));
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить ${selectedIds.size} контакт(ов)?`)) return;
    await Promise.all([...selectedIds].map(id => deleteContact.mutateAsync(id)));
    setSelectedIds(new Set());
    if (selectedIds.has(activeId)) setActiveId(null);
  };

  /* ─── CSV export ─── */
  const handleExport = () => {
    const toExport = selectedIds.size > 0 ? contacts.filter(c => selectedIds.has(c.id)) : contacts;
    const rows = [
      ['Имя', 'Email', 'Телефон', 'Статус', 'Сегмент', 'Проект', 'Сумма сделки', 'Добавлен'],
      ...toExport.map(c => [
        c.name, c.email ?? '', c.phone ?? '', c.status,
        c.segment?.name ?? '', c.project?.name ?? '',
        c.deal_amount ?? '', new Date(c.created_at).toLocaleDateString('ru'),
      ]),
    ];
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'contacts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const totalDeal = contacts.reduce((s, c) => s + (c.deal_amount ?? 0), 0);

  return (
    <>
      {modalContact !== null && (
        <ContactModal contact={modalContact || null} onClose={() => setModalContact(null)} />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="CRM"
            sub={isLoading ? '…' : `${contacts.length} контактов${totalDeal > 0 ? ` · ${fmtMoney(totalDeal)}` : ''}`}
            right={<>
              {/* Export */}
              <button onClick={handleExport} title={selectedIds.size > 0 ? `Экспорт ${selectedIds.size} выбранных` : 'Экспорт всех контактов (CSV)'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 7, fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <Icon name="download" size={13} />
                CSV
              </button>

              {/* Selection mode toggle */}
              <button onClick={() => setSelectionMode(m => !m)} title="Выбрать несколько"
                style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 10px', borderRadius: 7, fontSize: 12, color: selectionMode ? 'var(--info)' : 'var(--text-2)', background: selectionMode ? 'color-mix(in oklab, var(--info) 10%, transparent)' : 'var(--bg-elev-2)', border: `1px solid ${selectionMode ? 'color-mix(in oklab, var(--info) 30%, transparent)' : 'var(--border-subtle)'}`, cursor: 'pointer' }}>
                <Icon name="check_circle" size={14} />
              </button>

              {/* View toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setView('table')} title="Таблица" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'table' ? 'var(--bg-elev-3)' : 'transparent', color: view === 'table' ? 'var(--text)' : 'var(--text-3)', borderRight: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <Icon name="sort" size={14} />
                </button>
                <button onClick={() => setView('pipeline')} title="Pipeline" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'pipeline' ? 'var(--bg-elev-3)' : 'transparent', color: view === 'pipeline' ? 'var(--text)' : 'var(--text-3)', cursor: 'pointer' }}>
                  <Icon name="layers" size={14} />
                </button>
              </div>

            </>}
          />

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', background: 'color-mix(in oklab, var(--info) 6%, var(--bg-elev-1))', borderBottom: '1px solid color-mix(in oklab, var(--info) 20%, var(--border-subtle))' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--info)', minWidth: 0 }}>Выбрано: {selectedIds.size}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>→ Статус:</span>
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleBulkStatus(s)} style={{ padding: '3px 9px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)' }}>{s}</button>
              ))}
              <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
              <button onClick={handleBulkDelete} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'color-mix(in oklab, var(--danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)', color: 'var(--danger)' }}>Удалить</button>
              <button onClick={() => { setSelectedIds(new Set()); setSelectionMode(false); }} style={{ display: 'flex', color: 'var(--text-3)', cursor: 'pointer' }}>
                <Icon name="x" size={15} />
              </button>
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 120px 80px', gap: 12, alignItems: 'center' }}>
                    <Skeleton h={30} w={30} /><Skeleton h={13} w="60%" /><Skeleton h={13} /><Skeleton h={22} w={70} />
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--bg-elev-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="users" size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Контактов пока нет</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Добавь первый контакт в CRM</div>
                  <Button variant="secondary" icon="plus" onClick={() => setModalContact(false)}>Новый контакт</Button>
                </div>
              </div>
            ) : view === 'pipeline' ? (
              <>
                <PipelineView contacts={filtered} activeId={activeId} setActiveId={setActiveId}
                  selectedIds={selectedIds} onToggleSelect={handleToggleSelect} selectionMode={selectionMode} />
                {active && !selectionMode && (
                  <DetailPanel contact={active} onEdit={() => setModalContact(active)} onClose={() => setActiveId(null)} />
                )}
              </>
            ) : (
              <>
                <TableView contacts={filtered} activeId={activeId} setActiveId={setActiveId} hasPanel={!!active && !selectionMode}
                  selectedIds={selectedIds} onToggleSelect={handleToggleSelect} onSelectAll={handleSelectAll} selectionMode={selectionMode} />
                {active && !selectionMode && (
                  <DetailPanel contact={active} onEdit={() => setModalContact(active)} onClose={() => setActiveId(null)} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
