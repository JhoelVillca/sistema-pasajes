// ============================================================================
// CrudPanel.jsx — Componente CRUD genérico reutilizable
//
// Props:
//   title        — Título del panel (ej: "Ciudades")
//   icon         — Emoji/ícono (ej: "🏙️")
//   columns      — Array de { key, label, render? }
//   fields       — Array de { name, label, type, required?, options?, placeholder?,
//                    conditionalRequired?, showOnly? }
//   apiFns       — { list, create, update, remove }
//   emptyForm    — Objeto con valores por defecto del formulario
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export default function CrudPanel({
  title,
  icon,
  columns,
  fields,
  apiFns,
  emptyForm,
}) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null); // null = crear, object = editar
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // ── Fetch data ──
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFns.list();
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFns]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Toast helper ──
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Open modal (create / edit) ──
  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    // Poblar form con los valores del item
    const populated = { ...emptyForm };
    fields.forEach(f => {
      if (item[f.name] !== undefined) {
        populated[f.name] = item[f.name] ?? '';
      }
    });
    setForm(populated);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
  }

  // ── Form change ──
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // ── Save (create or update) ──
  async function handleSave(e) {
    e.preventDefault();

    // Construir payload limpio
    const payload = {};
    fields.forEach(f => {
      if (f.showOnly) return; // campos de solo lectura no van al payload
      const val = form[f.name];
      // Omitir password vacío en edición
      if (f.name === 'password' && editing && !val) return;
      if (val !== '' && val !== undefined) {
        payload[f.name] = f.type === 'number' ? Number(val) : val;
      }
    });

    try {
      setSaving(true);
      if (editing) {
        await apiFns.update(editing.id, payload);
        showToast('success', `${title.slice(0, -1) || title} actualizado`);
      } else {
        await apiFns.create(payload);
        showToast('success', `${title.slice(0, -1) || title} creado`);
      }
      closeModal();
      await fetchItems();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      const status = err.response?.status;
      if (status === 409) {
        showToast('conflict', msg);
      } else {
        showToast('error', msg);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar "${item.nombre || item.nombre_completo || item.placa || `#${item.id}`}"?`)) return;
    try {
      await apiFns.remove(item.id);
      showToast('success', 'Eliminado correctamente');
      await fetchItems();
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message);
    }
  }

  // ── Render field ──
  function renderField(f) {
    const isRequired = f.required && (!editing || f.name !== 'password');
    // ConditionalRequired: requerido solo en creación
    const isConditionalReq = f.conditionalRequired && !editing;

    if (f.type === 'select') {
      return (
        <div className="form-group" key={f.name}>
          <label className="form-label" htmlFor={`crud-${f.name}`}>{f.label}</label>
          <select
            id={`crud-${f.name}`}
            name={f.name}
            className="form-input form-select"
            value={form[f.name] || ''}
            onChange={handleChange}
            required={isRequired || isConditionalReq}
            disabled={saving}
          >
            <option value="">— Seleccionar —</option>
            {(f.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="form-group" key={f.name}>
        <label className="form-label" htmlFor={`crud-${f.name}`}>
          {f.label}
          {f.name === 'password' && editing && (
            <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--color-text-muted)' }}>
              {' '}(dejar vacío para mantener)
            </span>
          )}
        </label>
        <input
          id={`crud-${f.name}`}
          name={f.name}
          type={f.type === 'number' ? 'number' : f.type === 'password' ? 'password' : 'text'}
          className="form-input"
          placeholder={f.placeholder || ''}
          value={form[f.name] || ''}
          onChange={handleChange}
          required={isRequired || isConditionalReq}
          disabled={saving || f.showOnly}
          min={f.type === 'number' ? 0 : undefined}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="crud-panel">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'conflict' && '⚠️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" type="button" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="crud-header">
        <div>
          <h2 className="crud-title">{icon} {title}</h2>
          <p className="crud-subtitle">{items.length} registro{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Nuevo
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="state-container" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="state-container" style={{ minHeight: 200 }}>
          <span className="state-icon">⚠️</span>
          <p className="state-message">{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={fetchItems}>Reintentar</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        items.length === 0 ? (
          <div className="state-container" style={{ minHeight: 200 }}>
            <span className="state-icon">📭</span>
            <p className="state-title">Sin registros</p>
            <p className="state-message">Haz clic en "Nuevo" para crear el primero.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th style={{ width: 120, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(item[col.key], item) : (item[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => handleDelete(item)} title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editing ? `✏️ Editar` : `＋ Nuevo`} {title.slice(0, -1) || title}
              </h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              {fields.filter(f => !f.showOnly || editing).map(f => renderField(f))}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner-sm" /> Guardando…</> : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
