import { useState, useMemo } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Tabs, SpinInput } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Modal, Field, fieldStyle, ConfirmModal } from '../components/Modal.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { ModuleFilesGrid } from '../components/ModuleFiles.jsx';
import { ModuleReminderBanner } from '../components/ModuleReminders.jsx';
import {
  useSubscriptions, useSaveSubscription, useDeleteSubscription,
  useUtilityBills, useSaveUtilityBill, useDeleteUtilityBill,
  useHomeAccesses, useSaveHomeAccess, useDeleteHomeAccess,
  useWarranties, useSaveWarranty, useDeleteWarranty,
  useProducts, useSaveProduct, useDeleteProduct,
} from '../hooks/useHome.js';

const C = '--p-home';
const CATS = ['Дом', 'Работа', 'Развлечения', 'Облако'];
const CAT_META = {
  'Дом':          { icon: 'home',  color: '--p-home' },
  'Работа':       { icon: 'zap',   color: '--p-openresto' },
  'Развлечения':  { icon: 'video', color: '--p-girl' },
  'Облако':       { icon: 'globe', color: '--p-sites' },
};

const PRODUCT_CATS = ['Еда', 'Бытовая химия', 'Гигиена', 'Другое'];
const STATUS_META = {
  ok:  { label: 'Есть',          tone: 'success', next: 'low' },
  low: { label: 'Заканчивается', tone: 'warn',     next: 'out' },
  out: { label: 'Закончилось',   tone: 'danger',   next: 'ok' },
};
const PROD_TABS = ['Все', 'Есть', 'Заканчивается', 'Закончилось'];
const PROD_TAB_TO_STATUS = { 'Есть': 'ok', 'Заканчивается': 'low', 'Закончилось': 'out' };
const PRODUCT_CAT_COLOR = {
  'Еда':            '--success',
  'Бытовая химия':  '--info',
  'Гигиена':        '--p-girl',
  'Другое':         '--text-muted',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}
function fmtNext(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

/* ─── Metric ─────────────────────────────────────────────── */
function MetricCard({ label, value, unit, sub, icon, accent = C }) {
  return (
    <div style={{ padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
        {icon && (
          <span style={{ width: 24, height: 24, borderRadius: 7, background: `color-mix(in oklab, var(${accent}) 14%, transparent)`, color: `var(${accent})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name={icon} size={13} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{unit}</span>}
      </div>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

/* ─── Подписка ───────────────────────────────────────────── */
function SubModal({ sub, onClose }) {
  const save = useSaveSubscription();
  const [name,   setName]   = useState(sub?.name ?? '');
  const [cat,    setCat]    = useState(sub?.category ?? 'Дом');
  const [amount, setAmount] = useState(String(sub?.amount ?? ''));
  const [period, setPeriod] = useState(sub?.period ?? 'month');
  const [next,   setNext]   = useState(sub?.next_charge ?? todayStr());
  const [note,   setNote]   = useState(sub?.note ?? '');
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Укажи название'); return; }
    const meta = CAT_META[cat] ?? CAT_META['Дом'];
    try {
      await save.mutateAsync({
        id: sub?.id, name: name.trim(), category: cat,
        amount: parseFloat(amount) || 0, period, next_charge: next,
        color_token: meta.color, note: note.trim() || null,
      });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={sub ? 'Изменить подписку' : 'Новая подписка'} onClose={onClose}>
      <Field label="Название"><input value={name} onChange={e => setName(e.target.value)} placeholder="Spotify Family" autoFocus style={fieldStyle} /></Field>
      <Field label="Категория">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${cat === c ? `var(${CAT_META[c].color})` : 'var(--border-subtle)'}`, background: cat === c ? `color-mix(in oklab, var(${CAT_META[c].color}) 14%, transparent)` : 'transparent', color: cat === c ? `var(${CAT_META[c].color})` : 'var(--text-3)' }}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Сумма, ₽"><SpinInput value={amount} onChange={setAmount} placeholder="599" min={0} step={50} /></Field>
        <Field label="Период">
          <div style={{ display: 'flex', gap: 6 }}>
            {[['месяц', 'month'], ['год', 'year']].map(([l, v]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${period === v ? `var(${C})` : 'var(--border-subtle)'}`, background: period === v ? `color-mix(in oklab, var(${C}) 14%, transparent)` : 'transparent', color: period === v ? `var(${C})` : 'var(--text-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Следующее списание"><DatePicker value={next} onChange={v => v && setNext(v)} /></Field>
      <Field label="Заметка"><input value={note} onChange={e => setNote(e.target.value)} placeholder="по счётчикам" style={fieldStyle} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Счёт ЖКХ ───────────────────────────────────────────── */
function BillModal({ onClose }) {
  const save = useSaveUtilityBill();
  const [month,  setMonth]  = useState(monthKey());
  const [amount, setAmount] = useState('');
  const [error,  setError]  = useState('');

  const submit = async () => {
    const v = parseFloat(amount);
    if (!v) { setError('Укажи сумму'); return; }
    try {
      const m = new Date(month); m.setDate(1);
      await save.mutateAsync({ month: monthKey(m), amount: v, paid: false });
      onClose();
    } catch (e) { setError(e?.code === '23505' ? 'Счёт за этот месяц уже есть' : e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title="Счёт ЖКХ" sub="за месяц" onClose={onClose}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Месяц"><DatePicker value={month} onChange={v => v && setMonth(v)} /></Field>
        <Field label="Сумма, ₽"><SpinInput value={amount} onChange={setAmount} placeholder="8240" autoFocus min={0} step={100} /></Field>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Добавить</Button>
      </div>
    </Modal>
  );
}

/* ─── Доступ ─────────────────────────────────────────────── */
function AccessModal({ access, onClose }) {
  const save = useSaveHomeAccess();
  const [label, setLabel] = useState(access?.label ?? '');
  const [value, setValue] = useState(access?.value ?? '');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!label.trim() || !value.trim()) { setError('Заполни оба поля'); return; }
    try {
      await save.mutateAsync({ id: access?.id, label: label.trim(), value: value.trim() });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={access ? 'Изменить доступ' : 'Новый доступ'} sub="Wi-Fi, роутер, домофон…" onClose={onClose}>
      <Field label="Что"><input value={label} onChange={e => setLabel(e.target.value)} placeholder="Wi-Fi · домашний" autoFocus style={fieldStyle} /></Field>
      <Field label="Значение"><input value={value} onChange={e => setValue(e.target.value)} placeholder="KIR-home / пароль" style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Гарантия ───────────────────────────────────────────── */
function WarrantyModal({ warranty, onClose }) {
  const save = useSaveWarranty();
  const [name,    setName]    = useState(warranty?.name ?? '');
  const [bought,  setBought]  = useState(warranty?.bought ?? todayStr());
  const [until,   setUntil]   = useState(warranty?.until ?? todayStr());
  const [receipt, setReceipt] = useState(warranty?.has_receipt ?? true);
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Укажи название'); return; }
    try {
      await save.mutateAsync({ id: warranty?.id, name: name.trim(), bought, until, has_receipt: receipt });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={warranty ? 'Изменить гарантию' : 'Гарантия на технику'} onClose={onClose}>
      <Field label="Что за техника"><input value={name} onChange={e => setName(e.target.value)} placeholder="Холодильник Bosch" autoFocus style={fieldStyle} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Куплено"><DatePicker value={bought} onChange={v => v && setBought(v)} /></Field>
        <Field label="Гарантия до"><DatePicker value={until} onChange={v => v && setUntil(v)} /></Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={receipt} onChange={e => setReceipt(e.target.checked)} />
        Чек сохранён
      </label>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Полка холодильника ─────────────────────────────────── */
function ProductChip({ product, onCycle, onEdit, onDelete }) {
  const meta = STATUS_META[product.status] ?? STATUS_META.ok;
  const isOut = product.status === 'out';
  return (
    <div
      onMouseEnter={e => e.currentTarget.querySelector('.chip-actions').style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.querySelector('.chip-actions').style.opacity = '0'}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
        minWidth: 112, padding: '9px 11px', borderRadius: 10,
        background: isOut ? 'color-mix(in oklab, var(--bg-elev-2) 55%, transparent)' : 'var(--bg-elev-2)',
        border: `1.5px ${isOut ? 'dashed' : 'solid'} color-mix(in oklab, var(--${meta.tone}) ${isOut ? 28 : 42}%, var(--border-subtle))`,
        opacity: isOut ? 0.75 : 1,
        boxShadow: '0 4px 8px -4px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 30 }}>{product.name}</span>
      {product.note && (
        <span style={{ fontSize: 10.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.note}</span>
      )}
      <button onClick={() => onCycle(product)} title="Клик — сменить статус" style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <Badge tone={meta.tone} dot>{meta.label}</Badge>
      </button>
      <div className="chip-actions" style={{ position: 'absolute', top: 7, right: 7, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2 }}>
        <IconButton icon="edit"  size="sm" onClick={() => onEdit(product)} />
        <IconButton icon="trash" size="sm" onClick={() => onDelete(product.id)} />
      </div>
    </div>
  );
}

function FridgeShelf({ category, items, onCycle, onEdit, onDelete, last }) {
  const color = PRODUCT_CAT_COLOR[category] ?? '--text-muted';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: `var(${color})`, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{category}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{items.length}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingBottom: 14 }}>
        {items.map(p => <ProductChip key={p.id} product={p} onCycle={onCycle} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
      {/* стеклянная полка холодильника */}
      {!last && (
        <div style={{
          height: 2, borderRadius: 999, marginBottom: 16,
          background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--text) 20%, transparent) 12%, color-mix(in oklab, var(--text) 20%, transparent) 88%, transparent)',
          boxShadow: '0 6px 10px -5px rgba(0,0,0,0.55)',
        }} />
      )}
    </div>
  );
}

/* ─── Продукт ────────────────────────────────────────────── */
function ProductModal({ product, onClose }) {
  const save = useSaveProduct();
  const [name,   setName]   = useState(product?.name ?? '');
  const [cat,    setCat]    = useState(product?.category ?? 'Еда');
  const [status, setStatus] = useState(product?.status ?? 'ok');
  const [note,   setNote]   = useState(product?.note ?? '');
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Укажи название'); return; }
    try {
      await save.mutateAsync({ id: product?.id, name: name.trim(), category: cat, status, note: note.trim() || null });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={product ? 'Изменить продукт' : 'Новый продукт'} sub="как список у холодильника" onClose={onClose}>
      <Field label="Название"><input value={name} onChange={e => setName(e.target.value)} placeholder="Молоко" autoFocus style={fieldStyle} /></Field>
      <Field label="Категория">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRODUCT_CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${cat === c ? `var(${C})` : 'var(--border-subtle)'}`, background: cat === c ? `color-mix(in oklab, var(${C}) 14%, transparent)` : 'transparent', color: cat === c ? `var(${C})` : 'var(--text-3)' }}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Статус">
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <button key={v} onClick={() => setStatus(v)}
              style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${status === v ? `var(--${m.tone})` : 'var(--border-subtle)'}`, background: status === v ? `color-mix(in oklab, var(--${m.tone}) 14%, transparent)` : 'transparent', color: status === v ? `var(--${m.tone})` : 'var(--text-3)' }}>
              {m.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Заметка"><input value={note} onChange={e => setNote(e.target.value)} placeholder="какая марка, где покупать…" style={fieldStyle} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Экран ──────────────────────────────────────────────── */
export default function PersonalHome() {
  const { data: subs = [] }     = useSubscriptions();
  const { data: bills = [] }    = useUtilityBills();
  const { data: accesses = [] } = useHomeAccesses();
  const { data: warrs = [] }    = useWarranties();
  const { data: products = [] } = useProducts();
  const saveBill      = useSaveUtilityBill();
  const deleteBill    = useDeleteUtilityBill();
  const deleteSub     = useDeleteSubscription();
  const deleteAccess  = useDeleteHomeAccess();
  const deleteWarr    = useDeleteWarranty();
  const saveProduct   = useSaveProduct();
  const deleteProduct = useDeleteProduct();

  const [subModal,      setSubModal]      = useState(null);
  const [billModal,     setBillModal]     = useState(false);
  const [accessModal,   setAccessModal]   = useState(null);
  const [warrantyModal, setWarrantyModal] = useState(null);
  const [productModal,  setProductModal]  = useState(null);
  const [confirmBill,   setConfirmBill]   = useState(null);
  const [tab,           setTab]           = useState('Все');
  const [prodTab,       setProdTab]       = useState('Все');

  const monthlyTotal = subs.filter(s => s.period === 'month').reduce((a, s) => a + Number(s.amount), 0);
  const yearlyTotal  = subs.filter(s => s.period === 'year').reduce((a, s) => a + Number(s.amount), 0);
  const lastBill     = bills[0];
  const activeWarrs  = warrs.filter(w => !w.until || new Date(w.until) >= new Date()).length;

  const filteredSubs = useMemo(() => tab === 'Все' ? subs : subs.filter(s => s.category === tab), [subs, tab]);
  const last6 = useMemo(() => [...bills].slice(0, 6).reverse(), [bills]);
  const maxBill = Math.max(...last6.map(b => Number(b.amount)), 1);
  const unpaid = bills.find(b => !b.paid);

  const filteredProducts = useMemo(
    () => prodTab === 'Все' ? products : products.filter(p => p.status === PROD_TAB_TO_STATUS[prodTab]),
    [products, prodTab]
  );
  const productsByCat = useMemo(() => {
    const map = {};
    for (const p of filteredProducts) {
      const cat = p.category || 'Другое';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [filteredProducts]);
  const shelves = PRODUCT_CATS.filter(cat => productsByCat[cat]?.length > 0);
  const cycleStatus = (p) => saveProduct.mutate({ id: p.id, status: STATUS_META[p.status]?.next ?? 'ok' });

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      {subModal      && <SubModal sub={subModal === 'new' ? null : subModal} onClose={() => setSubModal(null)} />}
      {billModal     && <BillModal onClose={() => setBillModal(false)} />}
      {accessModal   && <AccessModal access={accessModal === 'new' ? null : accessModal} onClose={() => setAccessModal(null)} />}
      {warrantyModal && <WarrantyModal warranty={warrantyModal === 'new' ? null : warrantyModal} onClose={() => setWarrantyModal(null)} />}
      {productModal  && <ProductModal product={productModal === 'new' ? null : productModal} onClose={() => setProductModal(null)} />}
      {confirmBill && (
        <ConfirmModal
          title="Удалить счёт?"
          text={`${new Date(confirmBill.month).toLocaleDateString('ru', { month: 'long', year: 'numeric' })} · ${Number(confirmBill.amount).toLocaleString('ru')} ₽ — счёт исчезнет из графика.`}
          onConfirm={() => deleteBill.mutate(confirmBill.id)}
          onClose={() => setConfirmBill(null)}
        />
      )}

      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${C})` }} />
            Дом и подписки
          </span>}
          sub="регулярные платежи, коммуналка, гарантии"
          right={
            <Button variant="secondary" size="sm" icon="plus" onClick={() => setSubModal('new')}>Подписка</Button>
          }
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>
          <ModuleReminderBanner module="home" />

          {/* метрики */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <MetricCard icon="repeat" accent="--p-home" label="Подписки в месяц" value={monthlyTotal.toLocaleString('ru')} unit="₽" sub={`${subs.filter(s => s.period === 'month').length} активных`} />
            <MetricCard icon="home" accent="--p-home" label={lastBill ? `ЖКХ · ${new Date(lastBill.month).toLocaleDateString('ru', { month: 'long' })}` : 'ЖКХ'} value={lastBill ? Number(lastBill.amount).toLocaleString('ru') : '—'} unit={lastBill ? '₽' : undefined} sub={lastBill ? (lastBill.paid ? 'оплачено' : 'к оплате') : 'нет счетов'} />
            <MetricCard icon="globe" accent="--p-openresto" label="Годовые платежи" value={yearlyTotal ? yearlyTotal.toLocaleString('ru') : '—'} unit={yearlyTotal ? '₽' : undefined} sub="домен, хостинг и т.п." />
            <MetricCard icon="zap" accent="--p-sites" label="Гарантий активно" value={String(activeWarrs)} sub={warrs.length > activeWarrs ? `${warrs.length - activeWarrs} истекло` : undefined} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* подписки */}
            <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Подписки и регулярные платежи</span>
                <Tabs items={['Все', ...CATS.filter(c => subs.some(s => s.category === c))]} active={tab} onSelect={setTab} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '22px 1.8fr 1fr 1fr 48px', padding: '8px 18px', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)' }}>
                <span /><span>Сервис</span><span style={{ textAlign: 'right' }}>Сумма</span><span style={{ paddingLeft: 14 }}>Списание</span><span />
              </div>
              {filteredSubs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  {subs.length === 0 ? 'Добавь первую подписку' : 'Нет подписок в этой категории'}
                </div>
              ) : (
                filteredSubs.map(s => {
                  const meta = CAT_META[s.category] ?? CAT_META['Дом'];
                  return (
                    <div key={s.id}
                      onMouseEnter={e => e.currentTarget.querySelector('.sub-actions').style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.querySelector('.sub-actions').style.opacity = '0'}
                      style={{ display: 'grid', gridTemplateColumns: '22px 1.8fr 1fr 1fr 48px', padding: '10px 18px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: `color-mix(in oklab, var(${s.color_token}) 14%, transparent)`, color: `var(${s.color_token})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={meta.icon} size={12} />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, minWidth: 0 }}>
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.category}{s.note ? ` · ${s.note}` : ''}</span>
                      </div>
                      <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                        {Number(s.amount).toLocaleString('ru')} ₽
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>/{s.period === 'year' ? 'г' : 'мес'}</span>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', paddingLeft: 14 }}>{fmtNext(s.next_charge)}</span>
                      <div className="sub-actions" style={{ opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <IconButton icon="edit"  size="sm" onClick={() => setSubModal(s)} />
                        <IconButton icon="trash" size="sm" onClick={() => deleteSub.mutate(s.id)} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* коммуналка */}
              <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Коммуналка</span>
                  <Button variant="ghost" size="sm" icon="plus" onClick={() => setBillModal(true)}>Счёт</Button>
                </div>
                {last6.length === 0 ? (
                  <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Добавь первый счёт — появится график</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                    {last6.map(b => (
                      <div key={b.id} title="Клик — удалить" onClick={() => setConfirmBill(b)}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{(Number(b.amount) / 1000).toFixed(1)}к</span>
                        <div style={{ width: '100%', height: `${Number(b.amount) / maxBill * 72}%`, background: b.paid ? `color-mix(in oklab, var(${C}) 24%, transparent)` : `var(${C})`, borderRadius: 4, border: b.paid ? `1px solid color-mix(in oklab, var(${C}) 40%, transparent)` : 'none', boxSizing: 'border-box' }} />
                        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(b.month).toLocaleDateString('ru', { month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {unpaid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <Badge tone="warn" dot>{Number(unpaid.amount).toLocaleString('ru')} ₽ · к оплате</Badge>
                    <span style={{ flex: 1 }} />
                    <Button variant="secondary" size="sm" icon="check" onClick={() => saveBill.mutate({ id: unpaid.id, paid: true })}>Оплатил</Button>
                  </div>
                )}
              </div>

              {/* доступы */}
              <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Сеть и доступы</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="lock" size={13} style={{ color: 'var(--text-3)' }} />
                    <IconButton icon="plus" size="sm" onClick={() => setAccessModal('new')} />
                  </div>
                </div>
                {accesses.length === 0 ? (
                  <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Wi-Fi пароли, роутер, домофон…</div>
                ) : (
                  accesses.map(a => (
                    <div key={a.id}
                      onMouseEnter={e => e.currentTarget.querySelector('.acc-actions').style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.querySelector('.acc-actions').style.opacity = '0'}
                      style={{ position: 'relative', padding: '10px 12px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{a.value}</span>
                      <div className="acc-actions" style={{ position: 'absolute', top: 6, right: 6, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2 }}>
                        <IconButton icon="edit"  size="sm" onClick={() => setAccessModal(a)} />
                        <IconButton icon="trash" size="sm" onClick={() => deleteAccess.mutate(a.id)} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* гарантии + продукты | чеки */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>
          <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Гарантии на технику</span>
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setWarrantyModal('new')}>Добавить</Button>
            </div>
            {warrs.length === 0 ? (
              <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Добавь технику — не потеряешь сроки гарантий</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {warrs.map(w => {
                  const expired = w.until && new Date(w.until) < new Date();
                  return (
                    <div key={w.id}
                      onMouseEnter={e => e.currentTarget.querySelector('.wr-actions').style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.querySelector('.wr-actions').style.opacity = '0'}
                      style={{ position: 'relative', padding: '12px 14px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, opacity: expired ? 0.55 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklab, var(${C}) 14%, transparent)`, color: `var(${C})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="zap" size={15} />
                        </span>
                        {expired ? <Badge tone="neutral">истекла</Badge> : w.has_receipt ? <Badge tone="success" dot>чек есть</Badge> : <Badge tone="warn" dot>без чека</Badge>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{w.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                          {w.bought ? `куплено ${new Date(w.bought).toLocaleDateString('ru', { month: '2-digit', year: 'numeric' })}` : ''}
                          {w.until ? ` · до ${new Date(w.until).toLocaleDateString('ru', { month: '2-digit', year: 'numeric' })}` : ''}
                        </span>
                      </div>
                      <div className="wr-actions" style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2 }}>
                        <IconButton icon="edit"  size="sm" onClick={() => setWarrantyModal(w)} />
                        <IconButton icon="trash" size="sm" onClick={() => deleteWarr.mutate(w.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* продукты — полки холодильника, рядом с гарантиями (компактнее, чем отдельным блоком) */}
          <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden', background: 'var(--bg-elev-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 18px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: 'color-mix(in oklab, var(--info) 16%, transparent)', color: 'var(--info)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="archive" size={13} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Продукты</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tabs items={PROD_TABS} active={prodTab} onSelect={setProdTab} />
                <Button variant="ghost" size="sm" icon="plus" onClick={() => setProductModal('new')}>Добавить</Button>
              </div>
            </div>

            <div style={{
              padding: '18px 18px 6px',
              background: 'linear-gradient(180deg, color-mix(in oklab, var(--info) 5%, transparent), transparent 45%)',
            }}>
              {shelves.length === 0 ? (
                <div style={{ padding: '22px 0 30px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  {products.length === 0 ? 'Пусто в холодильнике — добавь первый продукт' : 'Ничего в этой категории'}
                </div>
              ) : (
                shelves.map((cat, i) => (
                  <FridgeShelf
                    key={cat} category={cat} items={productsByCat[cat]}
                    onCycle={cycleStatus} onEdit={setProductModal} onDelete={id => deleteProduct.mutate(id)}
                    last={i === shelves.length - 1}
                  />
                ))
              )}
            </div>
          </div>
          </div>

          {/* чеки — живут только в этом модуле */}
          <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Чеки</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>техника · ремонт · ЖКХ</span>
            </div>
            <ModuleFilesGrid module="home-receipts" accent={C} columns={3} hint="Фото чеков — пригодятся для гарантии и возвратов" />
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
