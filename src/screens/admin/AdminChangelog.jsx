import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { supabase } from '../../lib/supabase.js';
import { Modal, Field, fieldStyle, ConfirmModal } from '../../components/Modal.jsx';
import { Switch } from '../../components/primitives.jsx';
import {
  useChangelogAdmin, useCreateChangelog, useUpdateChangelog, usePublishChangelog, useDeleteChangelog,
} from '../../hooks/admin/useChangelogAdmin.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { fmtDate } from '../../lib/adminFormat.js';

const PRIORITY_LABEL = { low: 'Низкий', normal: 'Обычный', high: 'Важно' };
const PRIORITY_TONE = { low: 'neutral', normal: 'info', high: 'danger' };

async function uploadCover(file) {
  const path = `covers/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from('admin-content').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('admin-content').getPublicUrl(path);
  return data.publicUrl;
}

function ChangelogForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [version, setVersion] = useState(initial?.version ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? '');
  const [releaseDate, setReleaseDate] = useState(initial?.release_date ?? new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState(initial?.priority ?? 'normal');
  const [buttonText, setButtonText] = useState(initial?.button_text ?? '');
  const [buttonLink, setButtonLink] = useState(initial?.button_link ?? '');
  const [visibility, setVisibility] = useState(initial?.visibility ?? 'all');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setCoverUrl(await uploadCover(file)); } catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const save = () => onSave({
    title, version, description, cover_image_url: coverUrl, release_date: releaseDate,
    priority, button_text: buttonText, button_link: buttonLink, visibility, published,
  });

  return (
    <Modal title={initial ? 'Изменить релиз' : 'Новый релиз'} width={520} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Версия"><input value={version} onChange={e => setVersion(e.target.value)} style={fieldStyle} placeholder="v1.6.0" /></Field>
          <Field label="Дата релиза"><input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} style={fieldStyle} /></Field>
        </div>
        <Field label="Заголовок"><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} /></Field>
        <Field label="Описание (Markdown)">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        </Field>
        <Field label="Обложка (необязательно)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 12, color: 'var(--text-2)' }} />
            {uploading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Загрузка…</span>}
            {coverUrl && !uploading && <Icon name="check" size={14} style={{ color: 'var(--success)' }} />}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Текст кнопки"><input value={buttonText} onChange={e => setButtonText(e.target.value)} style={fieldStyle} placeholder="Необязательно" /></Field>
          <Field label="Ссылка кнопки"><input value={buttonLink} onChange={e => setButtonLink(e.target.value)} style={fieldStyle} placeholder="https://…" /></Field>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Приоритет">
            <select value={priority} onChange={e => setPriority(e.target.value)} style={fieldStyle}>
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Видимость">
            <select value={visibility} onChange={e => setVisibility(e.target.value)} style={fieldStyle}>
              <option value="all">Все пользователи</option>
              <option value="admins">Только админы</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Switch checked={published} onChange={setPublished} />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Опубликовано</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <AdminButton onClick={onClose}>Отмена</AdminButton>
          <AdminButton variant="primary" onClick={save} disabled={!title || !version || !description}>Сохранить</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminChangelog() {
  const { data: entries = [], isLoading } = useChangelogAdmin();
  const create = useCreateChangelog();
  const update = useUpdateChangelog();
  const publish = usePublishChangelog();
  const del = useDeleteChangelog();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
      <AdminButton variant="primary" onClick={() => setFormOpen(true)} style={{ alignSelf: 'flex-start' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={14} /> Новый релиз</span>
      </AdminButton>

      {formOpen && <ChangelogForm onClose={() => setFormOpen(false)} onSave={(v) => create.mutate(v, { onSuccess: () => setFormOpen(false) })} />}
      {editing && <ChangelogForm initial={editing} onClose={() => setEditing(null)} onSave={(v) => update.mutate({ id: editing.id, ...v }, { onSuccess: () => setEditing(null) })} />}
      {confirmDelete && (
        <ConfirmModal title="Удалить релиз?" text={confirmDelete.version} confirmLabel="Удалить"
          onConfirm={() => del.mutate(confirmDelete.id)} onClose={() => setConfirmDelete(null)} />
      )}

      {isLoading ? (
        <EmptyState icon="bookmark" text="Загрузка..." />
      ) : entries.length === 0 ? (
        <EmptyState icon="bookmark" text="Релизов пока нет" />
      ) : entries.map(c => (
        <div key={c.id} style={{ padding: 22, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{c.version}</span>
            <Badge tone={PRIORITY_TONE[c.priority]}>{PRIORITY_LABEL[c.priority]}</Badge>
            {!c.published && <Badge tone="neutral">Черновик</Badge>}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtDate(c.release_date)}</span>
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 550, marginBottom: 8 }}>{c.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{c.description}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <AdminButton onClick={() => publish.mutate({ id: c.id, published: !c.published })}>{c.published ? 'Снять с публикации' : 'Опубликовать'}</AdminButton>
            <AdminButton onClick={() => setEditing(c)}>Изменить</AdminButton>
            <AdminButton onClick={() => setConfirmDelete(c)} danger>Удалить</AdminButton>
          </div>
        </div>
      ))}
    </div>
  );
}
