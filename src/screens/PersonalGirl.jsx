import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Tabs, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { Modal, Field, fieldStyle } from '../components/Modal.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { ModulePhoto } from '../components/ModuleFiles.jsx';
import { ModuleReminderBanner } from '../components/ModuleReminders.jsx';
import {
  usePartnerProfile, useUpsertPartnerProfile,
  useGiftIdeas, useSaveGiftIdea, useDeleteGiftIdea,
  useSharedPlans, useSaveSharedPlan, useDeleteSharedPlan,
} from '../hooks/usePartner.js';
import { plural } from '../lib/plural.js';

const C = '--p-girl';
const GIFT_TAGS = ['просто так', 'ДР', 'годовщина', '8 марта', 'НГ', 'крупный'];
const PLAN_TAGS = ['вечер', 'путешествие', 'хобби', 'крупное'];
const FAV_ICONS = ['drop', 'heart', 'smile', 'music', 'globe', 'video', 'star', 'book'];

/* Дней до следующего наступления даты (день+месяц) */
function daysToNext(dateStr) {
  if (!dateStr) return null;
  const src = new Date(dateStr);
  const now = new Date(); now.setHours(0,0,0,0);
  let next = new Date(now.getFullYear(), src.getMonth(), src.getDate());
  if (next < now) next = new Date(now.getFullYear() + 1, src.getMonth(), src.getDate());
  return Math.round((next - now) / 86400000);
}
function fmtDayMonth(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}
function togetherFor(sinceStr) {
  if (!sinceStr) return '';
  const since = new Date(sinceStr);
  const now = new Date();
  let months = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth());
  if (now.getDate() < since.getDate()) months--;
  const y = Math.floor(months / 12), m = months % 12;
  const parts = [];
  if (y > 0) parts.push(plural(y, 'год', 'года', 'лет'));
  if (m > 0) parts.push(plural(m, 'месяц', 'месяца', 'месяцев'));
  return parts.join(' ') || 'меньше месяца';
}

/* ─── Профиль ────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }) {
  const upsert = useUpsertPartnerProfile();
  const [name,     setName]     = useState(profile?.name ?? '');
  const [subtitle, setSubtitle] = useState(profile?.subtitle ?? '');
  const [phone,    setPhone]    = useState(profile?.phone ?? '');
  const [since,    setSince]    = useState(profile?.since ?? '');
  const [birthday, setBirthday] = useState(profile?.birthday ?? '');
  const [anniv,    setAnniv]    = useState(profile?.anniversary ?? '');
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Укажи имя'); return; }
    try {
      await upsert.mutateAsync({
        name: name.trim(), subtitle: subtitle.trim() || null, phone: phone.trim() || null,
        since: since || null, birthday: birthday || null, anniversary: anniv || null,
      });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={profile ? 'Профиль' : 'Кто твой человек?'} onClose={onClose}>
      <Field label="Имя"><input value={name} onChange={e => setName(e.target.value)} placeholder="Аня Соколова" autoFocus style={fieldStyle} /></Field>
      <Field label="Пара слов"><input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="магистратура · экономика · НИУ ВШЭ" style={fieldStyle} /></Field>
      <Field label="Телефон"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 916 111 22 33" style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Вместе с"><DatePicker value={since} onChange={v => setSince(v ?? '')} /></Field>
        <Field label="День рождения"><DatePicker value={birthday} onChange={v => setBirthday(v ?? '')} /></Field>
      </div>
      <Field label="Годовщина"><DatePicker value={anniv} onChange={v => setAnniv(v ?? '')} /></Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={upsert.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Редактор списков (размеры / любимое) ───────────────── */
function ListEditorModal({ title, rows: initial, withIcon, onSave, onClose }) {
  const [rows, setRows] = useState(initial.length ? initial.map(r => ({ ...r })) : [{ icon: 'heart', k: '', v: '' }]);
  const set = (i, key, val) => setRows(rs => rs.map((r, ix) => ix === i ? { ...r, [key]: val } : r));

  const submit = () => {
    onSave(rows.filter(r => r.k.trim() && r.v.trim()).map(r => withIcon ? { icon: r.icon ?? 'heart', k: r.k.trim(), v: r.v.trim() } : { k: r.k.trim(), v: r.v.trim() }));
    onClose();
  };

  return (
    <Modal title={title} width={520} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: withIcon ? '36px 130px 1fr 28px' : '130px 1fr 28px', gap: 8, alignItems: 'center' }}>
            {withIcon && (
              <button onClick={() => set(i, 'icon', FAV_ICONS[(FAV_ICONS.indexOf(r.icon ?? 'heart') + 1) % FAV_ICONS.length])}
                title="Сменить иконку"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: `var(${C})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name={r.icon ?? 'heart'} size={14} />
              </button>
            )}
            <input value={r.k} onChange={e => set(i, 'k', e.target.value)} placeholder={withIcon ? 'Кофе' : 'Обувь'} style={fieldStyle} />
            <input value={r.v} onChange={e => set(i, 'v', e.target.value)} placeholder={withIcon ? 'Flat white, без сахара' : '38'} style={fieldStyle} />
            <IconButton icon="x" size="sm" title="Убрать" onClick={() => setRows(rs => rs.filter((_, ix) => ix !== i))} />
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" icon="plus" onClick={() => setRows(rs => [...rs, { icon: 'heart', k: '', v: '' }])}>Строка</Button>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Подарок ────────────────────────────────────────────── */
function GiftModal({ gift, onClose }) {
  const save = useSaveGiftIdea();
  const [text,  setText]  = useState(gift?.text ?? '');
  const [tag,   setTag]   = useState(gift?.tag ?? 'просто так');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!text.trim()) { setError('Опиши идею'); return; }
    try {
      await save.mutateAsync({ id: gift?.id, text: text.trim(), tag });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={gift ? 'Изменить идею' : 'Идея подарка'} onClose={onClose}>
      <Field label="Идея"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Кольцо Tiffany T1 (размер 16.5)" autoFocus rows={2} style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }} /></Field>
      <Field label="Повод">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GIFT_TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              style={{ height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: `1px solid ${tag === t ? `color-mix(in oklab, var(${C}) 45%, transparent)` : 'var(--border-subtle)'}`, background: tag === t ? `color-mix(in oklab, var(${C}) 14%, transparent)` : 'transparent', color: tag === t ? `var(${C})` : 'var(--text-3)' }}>
              {t}
            </button>
          ))}
        </div>
      </Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

function GiftCard({ g, onToggle, onEdit, onDelete }) {
  const used = g.used;
  return (
    <div
      onMouseEnter={e => e.currentTarget.querySelector('.gift-actions').style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.querySelector('.gift-actions').style.opacity = '0'}
      style={{ position: 'relative', padding: '12px 14px', background: used ? 'var(--bg-elev-2)' : 'var(--bg-elev-1)', border: `1px solid ${used ? 'var(--border-subtle)' : `color-mix(in oklab, var(${C}) 20%, var(--border-subtle))`}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, opacity: used ? 0.6 : 1 }}>
      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, textDecoration: used ? 'line-through' : 'none', textDecorationColor: 'var(--text-muted)', paddingRight: 60 }}>{g.text}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}>{g.tag}</span>
        {used && <span>· подарено{g.used_on ? ` · ${g.used_on}` : ''}</span>}
      </div>
      <div className="gift-actions touch-reveal" style={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2 }}>
        <IconButton icon={used ? 'repeat' : 'check'} size="sm" title={used ? 'Вернуть в актуальные' : 'Подарено'} onClick={onToggle} />
        <IconButton icon="edit"  size="sm" title="Изменить" onClick={onEdit} />
        <IconButton icon="trash" size="sm" title="Удалить"  onClick={onDelete} />
      </div>
    </div>
  );
}

/* ─── План ───────────────────────────────────────────────── */
function PlanModal({ plan, onClose }) {
  const save = useSaveSharedPlan();
  const [title, setTitle] = useState(plan?.title ?? '');
  const [tag,   setTag]   = useState(plan?.tag ?? 'вечер');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Опиши план'); return; }
    try {
      await save.mutateAsync({ id: plan?.id, title: title.trim(), tag });
      onClose();
    } catch (e) { setError(e?.message ?? 'Ошибка'); }
  };

  return (
    <Modal title={plan ? 'Изменить план' : 'Совместный план'} onClose={onClose}>
      <Field label="План"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Поехать в Грузию на майские" autoFocus style={fieldStyle} /></Field>
      <Field label="Тип">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PLAN_TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              style={{ height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: `1px solid ${tag === t ? `color-mix(in oklab, var(${C}) 45%, transparent)` : 'var(--border-subtle)'}`, background: tag === t ? `color-mix(in oklab, var(${C}) 14%, transparent)` : 'transparent', color: tag === t ? `var(${C})` : 'var(--text-3)' }}>
              {t}
            </button>
          ))}
        </div>
      </Field>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant="primary" icon="check" onClick={submit} disabled={save.isPending}>Сохранить</Button>
      </div>
    </Modal>
  );
}

/* ─── Экран ──────────────────────────────────────────────── */
export default function PersonalGirl() {
  const navigate = useNavigate();
  const { data: profile, isLoading: pL } = usePartnerProfile();
  const { data: gifts = [] } = useGiftIdeas();
  const { data: plans = [] } = useSharedPlans();
  const upsertProfile = useUpsertPartnerProfile();
  const saveGift      = useSaveGiftIdea();
  const deleteGift    = useDeleteGiftIdea();
  const savePlan      = useSaveSharedPlan();
  const deletePlan    = useDeleteSharedPlan();

  const [profileModal, setProfileModal] = useState(false);
  const [giftModal,    setGiftModal]    = useState(null);
  const [planModal,    setPlanModal]    = useState(null);
  const [listEditor,   setListEditor]   = useState(null);   // 'sizes' | 'favorites'
  const [giftTab,      setGiftTab]      = useState('Все');

  const sizes     = profile?.sizes ?? [];
  const favorites = profile?.favorites ?? [];

  const filteredGifts = useMemo(() => {
    if (giftTab === 'Актуальные') return gifts.filter(g => !g.used);
    if (giftTab === 'Подарены')   return gifts.filter(g => g.used);
    return gifts;
  }, [gifts, giftTab]);

  const activeGifts = gifts.filter(g => !g.used).length;
  const bdDays  = daysToNext(profile?.birthday);
  const anDays  = daysToNext(profile?.anniversary);

  const toggleGift = (g) => {
    const used = !g.used;
    saveGift.mutate({
      id: g.id, used,
      used_on: used ? new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
    });
  };

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      {profileModal && <ProfileModal profile={profile} onClose={() => setProfileModal(false)} />}
      {giftModal && <GiftModal gift={giftModal === 'new' ? null : giftModal} onClose={() => setGiftModal(null)} />}
      {planModal && <PlanModal plan={planModal === 'new' ? null : planModal} onClose={() => setPlanModal(null)} />}
      {listEditor === 'sizes' && (
        <ListEditorModal title="Размеры" rows={sizes} withIcon={false}
          onSave={rows => upsertProfile.mutate({ name: profile.name, sizes: rows })}
          onClose={() => setListEditor(null)} />
      )}
      {listEditor === 'favorites' && (
        <ListEditorModal title="Любимое" rows={favorites} withIcon
          onSave={rows => upsertProfile.mutate({ name: profile.name, favorites: rows })}
          onClose={() => setListEditor(null)} />
      )}

      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          breadcrumb="Личное · модуль"
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${C})` }} />
            {profile?.name?.split(' ')[0] ?? 'Отношения'}
          </span>}
          sub={profile?.since ? `вместе с ${new Date(profile.since).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })} · ${togetherFor(profile.since)}` : 'самый важный человек'}
          right={<>
            {profile?.phone && <Button variant="ghost" size="sm" icon="phone" onClick={() => window.open(`tel:${profile.phone.replace(/\s/g, '')}`)}>Позвонить</Button>}
            <Button variant="ghost" size="sm" icon="heart" onClick={() => navigate('/calendar?new=1')}>Запланировать</Button>
            <Button variant="secondary" size="sm" icon="plus" onClick={() => setGiftModal('new')}>Идея подарка</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>
          <ModuleReminderBanner module="partner" />

          {/* hero */}
          {pL ? null : !profile ? (
            <div style={{ padding: '48px 24px', background: `linear-gradient(135deg, color-mix(in oklab, var(${C}) 10%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 60%)`, border: `1px solid color-mix(in oklab, var(${C}) 25%, var(--border-subtle))`, borderRadius: 14, marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 48, height: 48, borderRadius: 999, background: `color-mix(in oklab, var(${C}) 16%, transparent)`, color: `var(${C})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart" size={22} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Расскажи о своём человеке</span>
              <Button variant="primary" icon="plus" onClick={() => setProfileModal(true)}>Заполнить профиль</Button>
            </div>
          ) : (
            <div className="rstack-lg" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, padding: '24px 28px', background: `linear-gradient(135deg, color-mix(in oklab, var(${C}) 14%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 60%)`, border: `1px solid color-mix(in oklab, var(${C}) 25%, var(--border-subtle))`, borderRadius: 14, marginBottom: 20, position: 'relative', alignItems: 'center' }}>
              <ModulePhoto module="partner-photo" shape="circle" size={220} accent={C} label="фото" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, color: `color-mix(in oklab, var(${C}) 80%, var(--text))`, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>мой человек</span>
                  <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.02em' }}>{profile.name}</h2>
                  {profile.subtitle && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{profile.subtitle}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 640 }}>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-elev-2)', border: `1px solid ${bdDays != null && bdDays <= 14 ? `color-mix(in oklab, var(${C}) 40%, transparent)` : 'var(--border-subtle)'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>День рождения</span>
                    <span style={{ fontSize: 18, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {fmtDayMonth(profile.birthday)}
                      {bdDays != null && <span style={{ color: bdDays <= 14 ? `var(${C})` : 'var(--text-3)' }}> · через {plural(bdDays, 'день', 'дня', 'дней')}</span>}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-elev-2)', border: `1px solid ${anDays != null && anDays <= 14 ? `color-mix(in oklab, var(${C}) 40%, transparent)` : 'var(--border-subtle)'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Годовщина</span>
                    <span style={{ fontSize: 18, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {fmtDayMonth(profile.anniversary)}
                      {anDays != null && <span style={{ color: anDays <= 14 ? `var(${C})` : 'var(--text-3)' }}> · через {plural(anDays, 'день', 'дня', 'дней')}</span>}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <IconButton icon="edit" size="sm" title="Изменить профиль" onClick={() => setProfileModal(true)} />
              </div>
            </div>
          )}

          {/* размеры + любимое */}
          <div className="rstack-lg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ padding: '18px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Размеры</span>
                <IconButton icon="edit" size="sm" title="Редактировать" onClick={() => profile && setListEditor('sizes')} />
              </div>
              {sizes.length === 0 ? (
                <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>Одежда, обувь, кольцо — пригодится для подарков</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 12, columnGap: 18 }}>
                  {sizes.map(s => (
                    <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.k}</span>
                      <span style={{ fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '18px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Любимое</span>
                <IconButton icon="edit" size="sm" title="Редактировать" onClick={() => profile && setListEditor('favorites')} />
              </div>
              {favorites.length === 0 ? (
                <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>Кофе, цветы, еда, музыка — чтобы не забывать мелочи</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {favorites.map(f => (
                    <div key={f.k} style={{ display: 'grid', gridTemplateColumns: '20px 90px 1fr', alignItems: 'baseline', gap: 12 }}>
                      <Icon name={f.icon ?? 'heart'} size={13} style={{ color: 'var(--text-3)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{f.k}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{f.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* идеи подарков */}
          <div style={{ padding: '18px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Банк идей для подарков</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {activeGifts} актуальных{gifts.length - activeGifts > 0 ? ` · ${gifts.length - activeGifts} подарено` : ''}
                </span>
              </div>
              <Tabs items={['Все', 'Актуальные', 'Подарены']} active={giftTab} onSelect={setGiftTab} />
            </div>
            {filteredGifts.length === 0 ? (
              <div style={{ padding: '18px 0', textAlign: 'center' }}>
                <button onClick={() => setGiftModal('new')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  + Записать первую идею — пригодится к празднику
                </button>
              </div>
            ) : (
              <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {filteredGifts.map(g => (
                  <GiftCard key={g.id} g={g}
                    onToggle={() => toggleGift(g)}
                    onEdit={() => setGiftModal(g)}
                    onDelete={() => deleteGift.mutate(g.id)} />
                ))}
              </div>
            )}
          </div>

          {/* совместные планы */}
          <div style={{ padding: '18px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Совместные планы</span>
              <Button variant="ghost" size="sm" icon="plus" onClick={() => setPlanModal('new')}>Добавить план</Button>
            </div>
            {plans.length === 0 ? (
              <div style={{ padding: '14px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Путешествия, спектакли, большие цели — вдвоём</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {plans.map(p => (
                  <div key={p.id}
                    onMouseEnter={e => e.currentTarget.querySelector('.plan-actions').style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.querySelector('.plan-actions').style.opacity = '0'}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 110px', gap: 14, alignItems: 'center', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Icon name={p.progress > 0 ? 'heart' : 'star'} size={14} style={{ color: `var(${C})`, flex: 'none' }} />
                      <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', justifySelf: 'start' }}>{p.tag}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><Progress value={p.progress} color={`var(${C})`} height={3} /></div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right' }}>{p.progress}%</span>
                    </div>
                    <div className="plan-actions touch-reveal" style={{ opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <IconButton icon="arrow_down" size="sm" title="−10%" onClick={() => savePlan.mutate({ id: p.id, progress: Math.max(0, p.progress - 10) })} />
                      <IconButton icon="arrow_up_right" size="sm" title="+10%" onClick={() => savePlan.mutate({ id: p.id, progress: Math.min(100, p.progress + 10) })} />
                      <IconButton icon="edit"  size="sm" title="Изменить" onClick={() => setPlanModal(p)} />
                      <IconButton icon="trash" size="sm" title="Удалить"  onClick={() => deletePlan.mutate(p.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
