import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { Modal, Field, fieldStyle, ConfirmModal } from '../../components/Modal.jsx';
import { Switch } from '../../components/primitives.jsx';
import { useNewsAdmin, useCreateNews, useUpdateNews, useDeleteNews } from '../../hooks/admin/useNewsAdmin.js';
import { AdminButton, EmptyState, Badge } from './AdminUI.jsx';
import { fmtDate } from '../../lib/adminFormat.js';

const ICON_OPTIONS = ['globe', 'settings', 'star', 'users', 'target', 'zap', 'bell'];

function NewsForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'globe');
  const [pushNotify, setPushNotify] = useState(initial?.push_notify ?? false);
  const [published, setPublished] = useState(initial?.published ?? true);

  return (
    <Modal title={initial ? 'Изменить новость' : 'Новая новость'} width={460} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Заголовок"><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} /></Field>
        <Field label="Категория"><input value={category} onChange={e => setCategory(e.target.value)} style={fieldStyle} placeholder="Обслуживание / Конкурс / Сообщество…" /></Field>
        <Field label="Описание">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        </Field>
        <Field label="Иконка">
          <select value={icon} onChange={e => setIcon(e.target.value)} style={fieldStyle}>
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Switch checked={pushNotify} onChange={setPushNotify} /> Push-уведомление
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Switch checked={published} onChange={setPublished} /> Опубликовано
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <AdminButton onClick={onClose}>Отмена</AdminButton>
          <AdminButton variant="primary" onClick={() => onSave({ title, category, description, icon, push_notify: pushNotify, published })} disabled={!title || !category}>Сохранить</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminNews() {
  const { data: news = [], isLoading } = useNewsAdmin();
  const create = useCreateNews(), update = useUpdateNews(), del = useDeleteNews();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AdminButton variant="primary" onClick={() => setFormOpen(true)} style={{ alignSelf: 'flex-start' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={14} /> Новая новость</span>
      </AdminButton>

      {formOpen && <NewsForm onClose={() => setFormOpen(false)} onSave={(v) => create.mutate(v, { onSuccess: () => setFormOpen(false) })} />}
      {editing && <NewsForm initial={editing} onClose={() => setEditing(null)} onSave={(v) => update.mutate({ id: editing.id, ...v }, { onSuccess: () => setEditing(null) })} />}
      {confirmDelete && <ConfirmModal title="Удалить новость?" text={confirmDelete.title} confirmLabel="Удалить" onConfirm={() => del.mutate(confirmDelete.id)} onClose={() => setConfirmDelete(null)} />}

      {isLoading ? (
        <EmptyState icon="globe" text="Загрузка..." />
      ) : news.length === 0 ? (
        <EmptyState icon="globe" text="Новостей пока нет" />
      ) : (
        <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
          {news.map(n => (
            <div key={n.id} style={{ padding: 20, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in oklab, var(--info) 16%, transparent)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={n.icon} size={15} />
                </span>
                <Badge tone="info">{n.category}</Badge>
                {!n.published && <Badge tone="neutral">Черновик</Badge>}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(n.created_at)}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 550 }}>{n.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>{n.description}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <AdminButton onClick={() => setEditing(n)}>Изменить</AdminButton>
                <AdminButton onClick={() => setConfirmDelete(n)} danger>Удалить</AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
