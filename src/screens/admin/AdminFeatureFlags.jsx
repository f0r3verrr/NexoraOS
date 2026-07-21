import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { Modal, Field, fieldStyle, ConfirmModal } from '../../components/Modal.jsx';
import { Switch } from '../../components/primitives.jsx';
import {
  useFeatureFlags, useCreateFlag, useUpdateFlag, useToggleFlag, useDeleteFlag, useSetFlagUsers,
} from '../../hooks/admin/useFeatureFlags.js';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';

const STATUS_TONE = { enabled: 'success', beta: 'warn', disabled: 'neutral', internal: 'info' };
const STATUS_LABEL = { enabled: 'Включено', beta: 'Бета', disabled: 'Отключено', internal: 'Внутреннее' };
const AUDIENCE_LABEL = { everyone: 'Для всех', admins: 'Только админы', selected: 'Для выбранных' };
const FLAG_ICONS = { enabled: 'zap', beta: 'star', disabled: 'x', internal: 'lock' };

function FlagForm({ initial, onSave, onClose }) {
  const [key, setKey] = useState(initial?.key ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [audience, setAudience] = useState(initial?.audience ?? 'everyone');
  const [status, setStatus] = useState(initial?.status ?? 'disabled');

  return (
    <Modal title={initial ? 'Изменить фичу' : 'Новая фича'} width={440} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!initial && (
          <Field label="Ключ (snake_case)">
            <input value={key} onChange={e => setKey(e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase())} style={fieldStyle} placeholder="media_library" />
          </Field>
        )}
        <Field label="Название"><input value={name} onChange={e => setName(e.target.value)} style={fieldStyle} /></Field>
        <Field label="Описание"><input value={description} onChange={e => setDescription(e.target.value)} style={fieldStyle} /></Field>
        <Field label="Аудитория">
          <select value={audience} onChange={e => setAudience(e.target.value)} style={fieldStyle}>
            {Object.entries(AUDIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Статус">
          <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <AdminButton onClick={onClose}>Отмена</AdminButton>
          <AdminButton variant="primary" onClick={() => onSave({ key, name, description, audience, status })} disabled={!key || !name}>Сохранить</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminFeatureFlags() {
  const { data: flags = [], isLoading } = useFeatureFlags();
  const { data: users = [] } = useAdminUsers();
  const createFlag = useCreateFlag();
  const updateFlag = useUpdateFlag();
  const toggleFlag = useToggleFlag();
  const deleteFlag = useDeleteFlag();
  const setFlagUsers = useSetFlagUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [usersPickerFor, setUsersPickerFor] = useState(null);

  const handleToggle = (fl) => {
    const next = fl.status === 'enabled' ? 'disabled' : 'enabled';
    toggleFlag.mutate({ id: fl.id, status: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <AdminButton variant="primary" onClick={() => setFormOpen(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={14} /> Новая фича</span>
        </AdminButton>
      </div>

      {formOpen && (
        <FlagForm onClose={() => setFormOpen(false)} onSave={(vals) => createFlag.mutate(vals, { onSuccess: () => setFormOpen(false) })} />
      )}
      {editing && (
        <FlagForm initial={editing} onClose={() => setEditing(null)}
          onSave={(vals) => updateFlag.mutate({ id: editing.id, ...vals }, { onSuccess: () => setEditing(null) })} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Удалить фичу?" text={confirmDelete.key} confirmLabel="Удалить"
          onConfirm={() => deleteFlag.mutate(confirmDelete.id)} onClose={() => setConfirmDelete(null)} />
      )}
      {usersPickerFor && (
        <Modal title={`Пользователи для «${usersPickerFor.key}»`} width={420} onClose={() => setUsersPickerFor(null)}>
          <UserMultiSelect
            users={users}
            onSave={(ids) => setFlagUsers.mutate({ id: usersPickerFor.id, userIds: ids }, { onSuccess: () => setUsersPickerFor(null) })}
            onClose={() => setUsersPickerFor(null)}
          />
        </Modal>
      )}

      {isLoading ? (
        <EmptyState icon="zap" text="Загрузка..." />
      ) : flags.length === 0 ? (
        <EmptyState icon="zap" text="Фич пока нет — создайте первую" />
      ) : (
        <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
          {flags.map(fl => (
            <div key={fl.id} style={{ padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'color-mix(in oklab, var(--p-openresto) 16%, transparent)', color: 'var(--p-openresto)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={FLAG_ICONS[fl.status] ?? 'zap'} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fl.key}</div>
                <button onClick={() => fl.audience === 'selected' ? setUsersPickerFor(fl) : null}
                  style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, background: 'none', border: 'none', padding: 0, cursor: fl.audience === 'selected' ? 'pointer' : 'default', textAlign: 'left' }}>
                  {AUDIENCE_LABEL[fl.audience]}{fl.audience === 'selected' ? ` · ${fl.selected_count}` : ''}
                </button>
              </div>
              <Badge tone={STATUS_TONE[fl.status]}>{STATUS_LABEL[fl.status]}</Badge>
              <Switch checked={fl.status === 'enabled'} onChange={() => handleToggle(fl)} />
              <button onClick={() => setEditing(fl)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }}>
                <Icon name="edit" size={14} />
              </button>
              <button onClick={() => setConfirmDelete(fl)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMultiSelect({ users, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {users.map(u => (
          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
            {u.email}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <AdminButton onClick={onClose}>Отмена</AdminButton>
        <AdminButton variant="primary" onClick={() => onSave([...selected])}>Сохранить</AdminButton>
      </div>
    </div>
  );
}
