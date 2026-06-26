import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, Badge } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from '../hooks/useOrders.js';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions.js';
import { useProjects } from '../hooks/useProjects.js';
import { useContacts } from '../hooks/useContacts.js';
import { ru } from '../lib/plural.js';

/* ─── Constants ──────────────────────────────────────────── */

const STATUSES   = ['Новый', 'В работе', 'Готово', 'Переговоры'];
const STATUS_TONE = { 'В работе': 'info', 'Готово': 'success', 'Переговоры': 'warn', 'Новый': 'neutral' };
const BUDGET_KEY  = 'nexora-budget';

const EXP_CATS = [
  { key: 'taxes',  label: 'Налоги',      icon: 'landmark', color: 'var(--p-diploma)'   },
  { key: 'subs',   label: 'Подписки',    icon: 'repeat',   color: 'var(--p-sites)'     },
  { key: 'tools',  label: 'Инструменты', icon: 'command',  color: 'var(--p-youmin)'    },
  { key: 'rent',   label: 'Аренда',      icon: 'archive',  color: 'var(--p-openresto)' },
  { key: 'salary', label: 'Зарплата',    icon: 'users',    color: 'var(--p-bots)'      },
  { key: 'other',  label: 'Прочее',      icon: 'more',     color: 'var(--text-3)'      },
];

/* ─── Helpers ────────────────────────────────────────────── */

const fmt  = (n) => Number(n).toLocaleString('ru');
const fmtK = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}к` : String(Math.round(n));

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('ru', { month: 'short' }).replace('.', '') };
  });
}

function inMonth(dateStr, year, month) {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

function thisMonthBounds() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/* ─── Charts ─────────────────────────────────────────────── */

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  const H = 140;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--p-openresto)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Доходы</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--danger)', opacity: 0.75 }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Расходы</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: H + 22 }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <div key={f} style={{ position: 'absolute', left: 0, right: 0, top: H * (1 - f), borderTop: '1px solid var(--border-subtle)', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, top: -8, fontSize: 9, color: 'var(--text-muted)' }}>{fmtK(maxVal * f)}</span>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 28, right: 0, bottom: 0, top: 0, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 22 }}>
          {data.map((d, i) => {
            const iH = Math.max((d.income / maxVal) * H, d.income > 0 ? 3 : 0);
            const eH = Math.max((d.expense / maxVal) * H, d.expense > 0 ? 3 : 0);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: H }}>
                  <div title={`Доходы: ${fmt(d.income)} ₽`} style={{ flex: 1, height: iH, background: 'color-mix(in oklab, var(--p-openresto) 75%, transparent)', borderRadius: '3px 3px 0 0', transition: 'height 500ms cubic-bezier(.4,0,.2,1)' }} />
                  <div title={`Расходы: ${fmt(d.expense)} ₽`} style={{ flex: 1, height: eH, background: 'color-mix(in oklab, var(--danger) 65%, transparent)', borderRadius: '3px 3px 0 0', transition: 'height 500ms cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ segments, total, centerLabel }) {
  const R = 42, CX = 54, CY = 54, SW = 14;
  const circ = 2 * Math.PI * R;
  const tot = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cum = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg viewBox="0 0 108 108" style={{ width: 108, height: 108, flex: 'none' }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-elev-3)" strokeWidth={SW} />
        {segments.map((seg, i) => {
          if (!seg.value) return null;
          const frac  = seg.value / tot;
          const dashL = Math.max(frac * circ - 2, 0);
          const off   = circ / 4 - cum * circ;
          cum += frac;
          return (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={seg.color} strokeWidth={SW}
              strokeDasharray={`${dashL} ${circ - dashL}`}
              strokeDashoffset={off}
              strokeLinecap="butt"
              opacity={0.88}
            />
          );
        })}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize={12} fontWeight="700" fill="var(--text)" fontFamily="var(--font-mono)">{fmtK(total)}</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize={8.5} fill="var(--text-muted)">{centerLabel}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
        {segments.slice(0, 5).map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: seg.color, flex: 'none' }} />
            <span style={{ flex: 1, fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{Math.round(seg.value / tot * 100)}%</span>
          </div>
        ))}
        {segments.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет данных</span>}
      </div>
    </div>
  );
}

/* ─── Row context menu ───────────────────────────────────── */

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const zoom = parseFloat(document.body.style.zoom) || 1;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ x: (r.right - 148) / zoom, y: (r.bottom + 4) / zoom });
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)'}
        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: open ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 100ms', color: 'var(--text-3)' }}>
        <Icon name="more" size={13} />
      </button>
      {open && createPortal(
        <>
          {/* Backdrop closes menu when clicking outside */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 298 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 299, background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 9, padding: 4, minWidth: 148, boxShadow: 'var(--shadow-2)' }}>
            <button onClick={() => { setOpen(false); onEdit(); }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Icon name="edit" size={13} /> Редактировать
            </button>
            <button onClick={() => { setOpen(false); onDelete(); }}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 8%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Icon name="trash" size={13} /> Удалить
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

/* ─── Input helpers ──────────────────────────────────────── */

const INPUT_SX = {
  height: 36, padding: '0 12px', background: 'var(--bg-elev-1)',
  border: '1px solid var(--border-subtle)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
};

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Order Modal ────────────────────────────────────────── */

function OrderModal({ order, onClose }) {
  const bgRef = useRef(false);
  const isEdit = !!order;
  const { data: projects = [] } = useProjects();
  const { data: contacts = [] } = useContacts();
  const create = useCreateOrder();
  const update = useUpdateOrder();
  const del    = useDeleteOrder();

  const [desc,     setDesc]     = useState(order?.description ?? '');
  const [amount,   setAmount]   = useState(String(order?.amount ?? ''));
  const [status,   setStatus]   = useState(order?.status ?? 'Новый');
  const [projId,   setProjId]   = useState(order?.project_id ?? '');
  const [contId,   setContId]   = useState(order?.contact_id ?? '');
  const [deadline, setDeadline] = useState(order?.deadline ?? '');
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!desc.trim()) { setError('Введи описание'); return; }
    const payload = { description: desc.trim(), amount: parseFloat(amount) || 0, status, project_id: projId || null, contact_id: contId || null, deadline: deadline || null };
    if (isEdit) await update.mutateAsync({ id: order.id, ...payload });
    else        await create.mutateAsync(payload);
    onClose();
  };

  const doDelete = async () => {
    await del.mutateAsync(order.id);
    onClose();
  };

  const select_sx = { ...INPUT_SX, padding: '0 10px', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { bgRef.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && bgRef.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать заказ' : 'Новый заказ'}</span>
          {isEdit && (
            <button onClick={doDelete}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 12%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 12, color: 'var(--danger)', border: '1px solid color-mix(in oklab, var(--danger) 22%, transparent)', background: 'transparent', cursor: 'pointer', transition: 'background 100ms' }}>
              <Icon name="trash" size={12} /> Удалить
            </button>
          )}
        </div>

        <FormField label="Описание *">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Дипломная работа · экономика"
            style={{ ...INPUT_SX, width: '100%' }} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Сумма (₽)">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="30 000"
              style={{ ...INPUT_SX, width: '100%' }} />
          </FormField>
          <FormField label="Статус">
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...select_sx, width: '100%' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Проект">
            <select value={projId} onChange={e => setProjId(e.target.value)} style={{ ...select_sx, width: '100%' }}>
              <option value="">— нет —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Клиент">
            <select value={contId} onChange={e => setContId(e.target.value)} style={{ ...select_sx, width: '100%' }}>
              <option value="">— нет —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Дедлайн">
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ ...INPUT_SX, width: '100%' }} />
          </FormField>
        </div>

        {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Expense Modal ──────────────────────────────────────── */

function ExpenseModal({ tx, onClose }) {
  const bgRef  = useRef(false);
  const isEdit = !!tx;
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const del    = useDeleteTransaction();

  const [desc,   setDesc]   = useState(tx?.description ?? '');
  const [amount, setAmount] = useState(String(tx?.amount ?? ''));
  const [cat,    setCat]    = useState(tx?.category ?? 'other');
  const [date,   setDate]   = useState(tx?.date ?? new Date().toISOString().slice(0, 10));
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!desc.trim()) { setError('Введи описание'); return; }
    const payload = { type: 'expense', description: desc.trim(), amount: parseFloat(amount) || 0, category: cat, date };
    if (isEdit) await update.mutateAsync({ id: tx.id, ...payload });
    else        await create.mutateAsync(payload);
    onClose();
  };

  const doDelete = async () => { await del.mutateAsync(tx.id); onClose(); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { bgRef.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && bgRef.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 420, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать расход' : 'Новый расход'}</span>
          {isEdit && (
            <button onClick={doDelete}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 12%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 12, color: 'var(--danger)', border: '1px solid color-mix(in oklab, var(--danger) 22%, transparent)', background: 'transparent', cursor: 'pointer', transition: 'background 100ms' }}>
              <Icon name="trash" size={12} /> Удалить
            </button>
          )}
        </div>

        <FormField label="Описание *">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Аренда офиса, подписка Adobe…"
            style={{ ...INPUT_SX, width: '100%' }} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Сумма (₽)">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5 000"
              style={{ ...INPUT_SX, width: '100%' }} />
          </FormField>
          <FormField label="Дата">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...INPUT_SX, width: '100%' }} />
          </FormField>
        </div>

        <FormField label="Категория">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {EXP_CATS.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'all 120ms', border: `1px solid ${cat === c.key ? c.color : 'var(--border-subtle)'}`, background: cat === c.key ? `color-mix(in oklab, ${c.color} 14%, transparent)` : 'var(--bg-elev-1)', color: cat === c.key ? c.color : 'var(--text-3)' }}>
                <Icon name={c.icon} size={12} /> {c.label}
              </button>
            ))}
          </div>
        </FormField>

        {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>{isEdit ? 'Сохранить' : 'Добавить'}</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Budget modal ───────────────────────────────────────── */

function BudgetModal({ current, onSave, onClose }) {
  const [val, setVal] = useState(String(current || ''));
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: 340, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Цель дохода на месяц</span>
        <FormField label="Сумма (₽)">
          <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="100 000" autoFocus
            onKeyDown={e => e.key === 'Enter' && (onSave(+val), onClose())}
            style={{ ...INPUT_SX, width: '100%' }} />
        </FormField>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={() => { onSave(+val); onClose(); }}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Metric card ────────────────────────────────────────── */

function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{ flex: 1, padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ─── Overview tab ───────────────────────────────────────── */

function OverviewTab({ orders, transactions, budget, onEditBudget }) {
  const { year, month } = thisMonthBounds();
  const months = getLast6Months();

  const paidOrders     = orders.filter(o => o.paid);
  const totalIncome    = paidOrders.reduce((s, o) => s + Number(o.amount), 0);
  const totalExpenses  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const thisMonthInc   = paidOrders.filter(o => inMonth(o.created_at, year, month)).reduce((s, o) => s + Number(o.amount), 0);
  const thisMonthExp   = transactions.filter(t => t.type === 'expense' && inMonth(t.date, year, month)).reduce((s, t) => s + Number(t.amount), 0);
  const pending        = orders.filter(o => !o.paid && o.status !== 'Переговоры').reduce((s, o) => s + Number(o.amount), 0);
  const profit         = thisMonthInc - thisMonthExp;
  const budgetPct      = budget > 0 ? Math.min((thisMonthInc / budget) * 100, 100) : 0;

  // Monthly bar chart data
  const barData = months.map(m => ({
    label: m.label,
    income:  paidOrders.filter(o => inMonth(o.created_at, m.year, m.month)).reduce((s, o) => s + Number(o.amount), 0),
    expense: transactions.filter(t => t.type === 'expense' && inMonth(t.date, m.year, m.month)).reduce((s, t) => s + Number(t.amount), 0),
  }));

  // Donut chart — expenses by category
  const expByCategory = EXP_CATS.map(c => ({
    label: c.label, color: c.color,
    value: transactions.filter(t => t.type === 'expense' && t.category === c.key).reduce((s, t) => s + Number(t.amount), 0),
  })).filter(x => x.value > 0);

  // Donut chart — income by project
  const incByProject = Object.values(
    paidOrders.reduce((acc, o) => {
      const key = o.project?.name ?? 'Без проекта';
      const colorToken = o.project?.color_token ?? '--p-openresto';
      if (!acc[key]) acc[key] = { label: key, color: `var(${colorToken})`, value: 0 };
      acc[key].value += Number(o.amount);
      return acc;
    }, {})
  );

  return (
    <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Доход за месяц"  value={`${fmt(thisMonthInc)} ₽`} color="var(--success)"  sub={budget > 0 ? `цель: ${fmt(budget)} ₽` : undefined} />
        <MetricCard label="Расходы за месяц" value={`${fmt(thisMonthExp)} ₽`} color="var(--danger)"  />
        <MetricCard label="Прибыль за месяц" value={`${fmt(profit)} ₽`}       color={profit >= 0 ? 'var(--success)' : 'var(--danger)'} />
        <MetricCard label="Ожидает оплаты"   value={`${fmt(pending)} ₽`}      color="var(--warn)"    sub={ru.orders(orders.filter(o => !o.paid && o.status !== 'Переговоры').length)} />
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Прогресс к цели</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{fmt(thisMonthInc)} <span style={{ color: 'var(--text-muted)' }}>/ {fmt(budget)} ₽</span></span>
              <button onClick={onEditBudget}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, transition: 'color 120ms' }}>
                <Icon name="edit" size={12} /> Изменить
              </button>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--bg-elev-3)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${budgetPct}%`, background: budgetPct >= 100 ? 'var(--success)' : 'var(--p-openresto)', borderRadius: 999, transition: 'width 600ms ease-out' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0</span>
            <span style={{ fontSize: 11, color: budgetPct >= 100 ? 'var(--success)' : 'var(--text-muted)', fontWeight: budgetPct >= 100 ? 600 : 400 }}>{Math.round(budgetPct)}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtK(budget)} ₽</span>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Доходы vs расходы</div>
          <BarChart data={barData} />
        </div>
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Структура</div>
          {incByProject.length > 0 ? (
            <DonutChart segments={incByProject} total={totalIncome} centerLabel="доходы ₽" />
          ) : expByCategory.length > 0 ? (
            <DonutChart segments={expByCategory} total={totalExpenses} centerLabel="расходы ₽" />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет данных</div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Средний чек', value: paidOrders.length > 0 ? `${fmt(Math.round(totalIncome / paidOrders.length))} ₽` : '—' },
          { label: 'Всего оплачено', value: ru.orders(paidOrders.length) },
          { label: 'В работе сейчас', value: ru.orders(orders.filter(o => o.status === 'В работе').length) },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Orders tab ─────────────────────────────────────────── */

function OrdersTab({ orders, isLoading, onEdit, onNew }) {
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [search,  setSearch]  = useState('');
  const [filterS, setFilterS] = useState('');
  const [filterP, setFilterP] = useState('');
  const { data: projects = [] } = useProjects();

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.description?.toLowerCase().includes(q) && !o.contact?.name?.toLowerCase().includes(q)) return false;
    if (filterS && o.status !== filterS) return false;
    if (filterP && o.project_id !== filterP) return false;
    return true;
  }), [orders, search, filterS, filterP]);

  const grid = '1fr 130px 120px 120px 110px 88px 64px';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по описанию или клиенту…"
            style={{ width: '100%', height: 32, padding: '0 10px 0 30px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {/* Status filter */}
        <select value={filterS} onChange={e => setFilterS(e.target.value)}
          style={{ height: 32, padding: '0 10px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: filterS ? 'var(--text)' : 'var(--text-muted)', outline: 'none', cursor: 'pointer' }}>
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Project filter */}
        <select value={filterP} onChange={e => setFilterP(e.target.value)}
          style={{ height: 32, padding: '0 10px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: filterP ? 'var(--text)' : 'var(--text-muted)', outline: 'none', cursor: 'pointer' }}>
          <option value="">Все проекты</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || filterS || filterP) && (
          <button onClick={() => { setSearch(''); setFilterS(''); setFilterP(''); }}
            style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="x" size={11} /> Сбросить
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} из {orders.length}</span>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: grid, padding: '8px 28px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', flex: 'none' }}>
        <div>Описание</div><div>Клиент</div><div>Проект</div><div>Сумма</div><div>Статус</div><div>Дедлайн</div><div>Действия</div>
      </div>

      {/* Rows */}
      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 14, background: 'var(--bg-elev-2)', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Icon name="wallet" size={28} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{orders.length === 0 ? 'Нет заказов — создай первый' : 'Ничего не найдено'}</span>
          </div>
        ) : (
          filtered.map(o => {
            const colorToken = o.project?.color_token ?? '--p-openresto';
            return (
              <div key={o.id}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'grid', gridTemplateColumns: grid, padding: '10px 28px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', transition: 'background 80ms', background: 'transparent' }}>
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{o.description}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.contact?.name ?? '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
                  {o.project
                    ? <><span style={{ width: 7, height: 7, borderRadius: 2, background: `var(${colorToken})`, flex: 'none' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.project.name}</span></>
                    : '—'}
                </span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: o.paid ? 'var(--success)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(o.amount)} ₽
                </span>
                <div>
                  <select value={o.status} onChange={e => updateOrder.mutate({ id: o.id, status: e.target.value })}
                    style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 11, color: 'var(--text)', padding: '3px 7px', outline: 'none', cursor: 'pointer' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {o.deadline ? new Date(o.deadline).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateOrder.mutate({ id: o.id, paid: !o.paid })}
                    title={o.paid ? 'Отменить оплату' : 'Отметить оплаченным'}
                    style={{ width: 22, height: 22, borderRadius: 5, background: o.paid ? 'color-mix(in oklab, var(--success) 20%, transparent)' : 'var(--bg-elev-2)', border: `1px solid ${o.paid ? 'color-mix(in oklab, var(--success) 40%, transparent)' : 'var(--border-subtle)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
                    {o.paid && <Icon name="check" size={11} style={{ color: 'var(--success)' }} stroke={2.5} />}
                  </button>
                  <RowMenu onEdit={() => onEdit(o)} onDelete={() => deleteOrder.mutate(o.id)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Expenses tab ───────────────────────────────────────── */

function ExpensesTab({ transactions, onEdit, onNew }) {
  const deleteTransaction = useDeleteTransaction();
  const [filterCat, setFilterCat] = useState('');

  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && (!filterCat || t.category === filterCat))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filterCat]
  );

  const totalExp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const { year, month } = thisMonthBounds();
  const monthExp = transactions.filter(t => t.type === 'expense' && inMonth(t.date, year, month)).reduce((s, t) => s + Number(t.amount), 0);

  const cat = (key) => EXP_CATS.find(c => c.key === key) ?? EXP_CATS[EXP_CATS.length - 1];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flex: 'none', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setFilterCat('')}
            style={{ height: 28, padding: '0 11px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${!filterCat ? 'var(--border)' : 'var(--border-subtle)'}`, background: !filterCat ? 'var(--bg-elev-3)' : 'transparent', color: !filterCat ? 'var(--text)' : 'var(--text-3)', transition: 'all 120ms' }}>
            Все
          </button>
          {EXP_CATS.map(c => (
            <button key={c.key} onClick={() => setFilterCat(c.key === filterCat ? '' : c.key)}
              style={{ height: 28, padding: '0 11px', borderRadius: 7, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 120ms', border: `1px solid ${filterCat === c.key ? c.color : 'var(--border-subtle)'}`, background: filterCat === c.key ? `color-mix(in oklab, ${c.color} 12%, transparent)` : 'transparent', color: filterCat === c.key ? c.color : 'var(--text-3)' }}>
              <Icon name={c.icon} size={11} /> {c.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Месяц: <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{fmt(monthExp)} ₽</span></span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Всего: <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{fmt(totalExp)} ₽</span></span>
      </div>

      {/* List */}
      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 32px' }}>
        {expenses.length === 0 ? (
          <div style={{ padding: '56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Icon name="trending_up" size={28} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{transactions.length === 0 ? 'Нет расходов — добавь первый' : 'Ничего не найдено'}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {expenses.map((tx, i) => {
              const c = cat(tx.category);
              const isLast = i === expenses.length - 1;
              return (
                <div key={tx.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 4px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', transition: 'background 80ms', borderRadius: 8 }}>
                  {/* Category icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in oklab, ${c.color} 14%, var(--bg-elev-2))`, border: `1px solid color-mix(in oklab, ${c.color} 22%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flex: 'none' }}>
                    <Icon name={c.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.label} · {new Date(tx.date).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</div>
                  </div>
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--danger)', fontWeight: 500, letterSpacing: '-0.01em', flex: 'none' }}>
                    −{fmt(tx.amount)} ₽
                  </span>
                  <RowMenu onEdit={() => onEdit(tx)} onDelete={() => deleteTransaction.mutate(tx.id)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────── */

function TabBtn({ active, onClick, children, badge }) {
  return (
    <button onClick={onClick}
      style={{ height: 28, padding: '0 13px', borderRadius: 7, fontSize: 12, fontWeight: active ? 500 : 400, background: active ? 'var(--bg-elev-3)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-3)', border: active ? '1px solid var(--border)' : '1px solid transparent', cursor: 'pointer', transition: 'all 140ms', display: 'flex', alignItems: 'center', gap: 6 }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)'; }}>
      {children}
      {badge != null && <span style={{ fontSize: 10, background: 'var(--bg-elev-1)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{badge}</span>}
    </button>
  );
}

/* ─── Main screen ────────────────────────────────────────── */

export default function Finances() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: orders       = [], isLoading } = useOrders();
  const { data: transactions = [] }            = useTransactions();

  // Tab lives in the URL so the sidebar can highlight the active section
  const tab = searchParams.get('tab') || 'overview';
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  const [orderModal,   setOM]     = useState(null);
  const [expenseModal, setEM]     = useState(null);
  const [budgetModal,  setBM]     = useState(false);
  const [budget, setBudget]       = useState(() => +(localStorage.getItem(BUDGET_KEY) || 0));

  // Handle action param from sidebar (e.g. new-order)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-order') {
      setOM(false);
      setSearchParams({ tab: searchParams.get('tab') || 'orders' }, { replace: true });
    }
  }, [searchParams]);

  const saveBudget = useCallback((v) => {
    setBudget(v);
    localStorage.setItem(BUDGET_KEY, String(v));
  }, []);

  const handleNewExpense = () => { setEM(false); };

  const monthIncome = useMemo(() => {
    const { year, month } = thisMonthBounds();
    return orders.filter(o => o.paid && inMonth(o.created_at, year, month)).reduce((s, o) => s + Number(o.amount), 0);
  }, [orders]);

  return (
    <>
      {orderModal   !== null && <OrderModal   order={orderModal || null}   onClose={() => setOM(null)} />}
      {expenseModal !== null && <ExpenseModal tx={expenseModal || null}    onClose={() => setEM(null)} />}
      {budgetModal           && <BudgetModal  current={budget}             onSave={saveBudget} onClose={() => setBM(false)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Финансы"
            sub={isLoading ? '…' : `${fmt(monthIncome)} ₽ в этом месяце`}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'var(--bg-elev-2)', borderRadius: 9, border: '1px solid var(--border-subtle)' }}>
                  <TabBtn active={tab === 'overview'}  onClick={() => setTab('overview')}>Обзор</TabBtn>
                  <TabBtn active={tab === 'orders'}    onClick={() => setTab('orders')}    badge={orders.length}>Заказы</TabBtn>
                  <TabBtn active={tab === 'expenses'}  onClick={() => setTab('expenses')}  badge={transactions.filter(t => t.type === 'expense').length}>Расходы</TabBtn>
                </div>
                <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
                {/* Budget */}
                <button onClick={() => setBM(true)}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 120ms' }}>
                  <Icon name="target" size={14} />
                  {budget > 0 ? `Цель: ${fmtK(budget)} ₽` : 'Цель'}
                </button>
                {/* Actions */}
                {tab === 'expenses' && <Button variant="secondary" size="sm" icon="plus" onClick={handleNewExpense}>Расход</Button>}
              </div>
            }
          />

          {tab === 'overview' && (
            <OverviewTab orders={orders} transactions={transactions} budget={budget} onEditBudget={() => setBM(true)} />
          )}
          {tab === 'orders' && (
            <OrdersTab orders={orders} isLoading={isLoading} onEdit={setOM} onNew={() => setOM(false)} />
          )}
          {tab === 'expenses' && (
            <ExpensesTab transactions={transactions} onEdit={setEM} onNew={handleNewExpense} />
          )}
        </main>
      </div>
    </>
  );
}
