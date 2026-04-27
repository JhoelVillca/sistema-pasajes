// ============================================================================
// Viajes.jsx — Gestión de programación de viajes (HU-005, HU-006, HU-007)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getRutas,
  getBuses,
  getPersonal,
  getViajes,
  createViaje,
  publicarViaje
} from '../services/api';

const FORM_INITIAL = {
  ruta_id: '',
  bus_id: '',
  chofer_id: '',
  ayudante_id: '',
  fecha_salida: '',
  hora_salida: '',
  tarifa_base: ''
};

export default function Viajes() {
  // ── States para selects (Catálogos) ──
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [ayudantes, setAyudantes] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // ── States para el formulario ──
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  // ── States para la tabla de viajes ──
  const [viajes, setViajes] = useState([]);
  const [loadingViajes, setLoadingViajes] = useState(true);

  // ── States generales ──
  const [toast, setToast] = useState(null);

  // ── Cargar catálogos ──
  const fetchCatalogs = useCallback(async () => {
    try {
      setLoadingCatalogs(true);
      const [rutasData, busesData, choferesData, ayudantesData] = await Promise.all([
        getRutas(),
        getBuses(),
        getPersonal('chofer'),
        getPersonal('ayudante')
      ]);

      // Filtramos en frontend por si el endpoint ignora el query param
      setRutas(rutasData.filter(r => r.estado === 'activo'));
      setBuses(busesData.filter(b => b.estado === 'activo'));
      setChoferes(choferesData.filter(p => p.tipo_personal === 'chofer' && p.estado === 'activo'));
      setAyudantes(ayudantesData.filter(p => p.tipo_personal === 'ayudante' && p.estado === 'activo'));
    } catch (err) {
      showToast('error', `Error al cargar catálogos: ${err.message}`);
    } finally {
      setLoadingCatalogs(false);
    }
  }, []);

  // ── Cargar viajes ──
  const fetchViajes = useCallback(async () => {
    try {
      setLoadingViajes(true);
      const data = await getViajes();
      setViajes(data);
    } catch (err) {
      showToast('error', `Error al cargar viajes: ${err.message}`);
    } finally {
      setLoadingViajes(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
    fetchViajes();
  }, [fetchCatalogs, fetchViajes]);

  // ── Helper Toast ──
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Form Handlers ──
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateViaje(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ruta_id: Number(form.ruta_id),
        bus_id: Number(form.bus_id),
        chofer_id: Number(form.chofer_id),
        ayudante_id: Number(form.ayudante_id),
        fecha_salida: form.fecha_salida,
        hora_salida: form.hora_salida,
        tarifa_base: String(Number(form.tarifa_base).toFixed(2)) // Decimal 10,2
      };

      await createViaje(payload);
      showToast('success', 'Viaje y asientos generados correctamente');
      setForm(FORM_INITIAL);
      fetchViajes();
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Publicar Viaje ──
  async function handlePublicar(id) {
    try {
      await publicarViaje(id);
      showToast('success', 'Viaje publicado. Ahora está en venta.');
      fetchViajes();
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message);
    }
  }

  // ── Render Helpers ──
  function getRutaName(id) {
    const r = rutas.find(x => x.id === id);
    return r ? r.nombre : `#${id}`;
  }
  function getBusPlaca(id) {
    const b = buses.find(x => x.id === id);
    return b ? `${b.placa} (${b.numero_unidad})` : `#${id}`;
  }

  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">🗓️ Programación de Viajes</h1>
        <p className="page-subtitle">Gestiona la creación y publicación de viajes (HU-005, HU-006, HU-007)</p>
      </div>

      {/* ── PANEL SUPERIOR: Formulario de Creación ── */}
      <div className="crud-panel" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="crud-header">
          <h2 className="crud-title">＋ Nuevo Viaje</h2>
        </div>
        
        {loadingCatalogs ? (
          <div className="state-container" style={{ minHeight: 150 }}>
            <div className="spinner" />
            <p className="state-message">Cargando catálogos...</p>
          </div>
        ) : (
          <form onSubmit={handleCreateViaje} className="modal-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="ruta_id">Ruta</label>
              <select name="ruta_id" id="ruta_id" className="form-input form-select" value={form.ruta_id} onChange={handleFormChange} required disabled={saving}>
                <option value="">— Seleccionar —</option>
                {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bus_id">Bus</label>
              <select name="bus_id" id="bus_id" className="form-input form-select" value={form.bus_id} onChange={handleFormChange} required disabled={saving}>
                <option value="">— Seleccionar —</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.placa} ({b.numero_unidad})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="chofer_id">Chofer</label>
              <select name="chofer_id" id="chofer_id" className="form-input form-select" value={form.chofer_id} onChange={handleFormChange} required disabled={saving}>
                <option value="">— Seleccionar —</option>
                {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ayudante_id">Ayudante</label>
              <select name="ayudante_id" id="ayudante_id" className="form-input form-select" value={form.ayudante_id} onChange={handleFormChange} required disabled={saving}>
                <option value="">— Seleccionar —</option>
                {ayudantes.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fecha_salida">Fecha Salida</label>
              <input type="date" name="fecha_salida" id="fecha_salida" className="form-input" value={form.fecha_salida} onChange={handleFormChange} required disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hora_salida">Hora Salida</label>
              <input type="time" name="hora_salida" id="hora_salida" className="form-input" value={form.hora_salida} onChange={handleFormChange} required disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tarifa_base">Tarifa Base (Bs)</label>
              <input type="number" name="tarifa_base" id="tarifa_base" className="form-input" placeholder="Ej: 150.00" value={form.tarifa_base} onChange={handleFormChange} required min="0" step="0.01" disabled={saving} />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }} disabled={saving}>
                {saving ? <><span className="spinner-sm" /> Guardando…</> : '＋ Crear Viaje'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── PANEL INFERIOR: Lista de Viajes ── */}
      <div className="crud-panel">
        <div className="crud-header">
          <h2 className="crud-title">📋 Viajes Registrados</h2>
          <span className="badge badge-info">{viajes.length} en total</span>
        </div>

        {loadingViajes ? (
          <div className="state-container" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : viajes.length === 0 ? (
          <div className="state-container" style={{ minHeight: 200 }}>
            <span className="state-icon">📭</span>
            <p className="state-title">No hay viajes</p>
            <p className="state-message">Utiliza el formulario de arriba para programar el primer viaje.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ruta</th>
                  <th>Bus</th>
                  <th>Fecha y Hora</th>
                  <th>Tarifa</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {viajes.map(v => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td>{getRutaName(v.ruta_id)}</td>
                    <td>{getBusPlaca(v.bus_id)}</td>
                    <td>{v.fecha_salida} {v.hora_salida}</td>
                    <td className="tarifa">
                      <span className="tarifa-currency">Bs</span>{Number(v.tarifa_base).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${v.estado === 'programado' ? 'badge-warning' : v.estado === 'en_venta' ? 'badge-success' : 'badge-info'}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="table-actions">
                      {v.estado === 'programado' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handlePublicar(v.id)}>
                          📢 Publicar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
