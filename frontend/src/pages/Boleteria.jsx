// ============================================================================
// Boleteria.jsx — Vista de venta de boletos con modal de compra
// Llama a GET /viajes?estado=en_venta, renderiza mapa de asientos,
// y ejecuta POST /boletos con bloqueo optimista (version_asiento).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getViajesEnVenta,
  getAsientos,
  getRutas,
  getCiudades,
  comprarBoleto,
} from '../services/api';

// ── Estado inicial del formulario de compra ──
const FORM_INITIAL = {
  nombre_completo:  '',
  tipo_documento:   'CI',
  numero_documento: '',
  metodo_pago:      'efectivo',
};

export default function Boleteria() {
  // Datos principales
  const [viajes, setViajes]     = useState([]);
  const [rutas, setRutas]       = useState({});
  const [ciudades, setCiudades] = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Asientos expandidos
  const [expandedViaje, setExpandedViaje] = useState(null);
  const [asientos, setAsientos]           = useState([]);
  const [loadingAsientos, setLoadingAsientos] = useState(false);

  // Modal de compra
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);  // { asiento, viaje }
  const [form, setForm]               = useState(FORM_INITIAL);
  const [buying, setBuying]           = useState(false);

  // Alertas toast
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'conflict', message }

  // Boleto Emitido (Pase de abordaje)
  const [boletoEmitido, setBoletoEmitido] = useState(null);

  // ── Fetch inicial ──
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const [viajesData, rutasData, ciudadesData] = await Promise.all([
        getViajesEnVenta(),
        getRutas(),
        getCiudades(),
      ]);

      const rutasMap = {};
      rutasData.forEach(r => { rutasMap[r.id] = r; });

      const ciudadesMap = {};
      ciudadesData.forEach(c => { ciudadesMap[c.id] = c; });

      setViajes(viajesData);
      setRutas(rutasMap);
      setCiudades(ciudadesMap);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Cargar/cerrar asientos ──
  const refreshAsientos = useCallback(async (viajeId) => {
    try {
      setLoadingAsientos(true);
      const data = await getAsientos(viajeId);
      setAsientos(data);
      setExpandedViaje(viajeId);
    } catch (err) {
      showToast('error', `Error al cargar asientos: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingAsientos(false);
    }
  }, []);

  async function handleVerAsientos(viajeId) {
    if (expandedViaje === viajeId) {
      setExpandedViaje(null);
      setAsientos([]);
      return;
    }
    refreshAsientos(viajeId);
  }

  // ── Clic en asiento disponible → abrir modal ──
  function handleSeatClick(asiento, viaje) {
    if (asiento.estado !== 'disponible') return;

    setSelectedSeat({ asiento, viaje });
    setForm(FORM_INITIAL);
    setModalOpen(true);
  }

  // ── Cerrar modal ──
  function closeModal() {
    setModalOpen(false);
    setSelectedSeat(null);
    setForm(FORM_INITIAL);
  }

  // ── Form change ──
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // ── Enviar compra ──
  async function handleComprar(e) {
    e.preventDefault();
    if (!selectedSeat) return;

    const { asiento, viaje } = selectedSeat;
    const ruta = rutas[viaje.ruta_id];

    // Validación básica
    if (!form.nombre_completo.trim() || !form.numero_documento.trim()) {
      showToast('error', 'Complete todos los campos requeridos');
      return;
    }

    const payload = {
      viaje_id:         viaje.id,
      asiento_id:       asiento.id,
      pasajero: {
        nombre_completo:  form.nombre_completo.trim(),
        tipo_documento:   form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
      },
      ciudad_subida_id:  ruta?.ciudad_origen_id  || viaje.ruta_id,
      ciudad_bajada_id:  ruta?.ciudad_destino_id || viaje.ruta_id,
      tarifa_pagada:     String(Number(viaje.tarifa_base).toFixed(2)),
      version_asiento:   asiento.version,   // ← CRÍTICO: bloqueo optimista
      metodo_pago:       form.metodo_pago,
      vendedor_id:       1,                 // estático por ahora
    };

    try {
      setBuying(true);
      const result = await comprarBoleto(payload);

      // Éxito
      showToast('success',
        `✅ Boleto ${result.boleto.codigo_unico} emitido — Asiento ${asiento.numero_asiento}`
      );
      
      // Guardar para renderizar el Pase de Abordaje
      setBoletoEmitido({
        id: result.boleto.id,
        codigo: result.boleto.codigo_unico,
        pasajero: form.nombre_completo.trim(),
        ci: form.numero_documento.trim(),
        asiento: asiento.numero_asiento,
        ruta: getRutaNombre(viaje.ruta_id)
      });

      // Refrescar asientos
      await refreshAsientos(viaje.id);

    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || err.message;

      if (status === 409) {
        // ⚠️ CONFLICTO DE CONCURRENCIA
        showToast('conflict',
          '¡Asiento vendido a otro usuario! Por favor, selecciona otro.'
        );
        closeModal();
        // Recargar asientos automáticamente
        await refreshAsientos(selectedSeat.viaje.id);
      } else {
        showToast('error', msg);
      }
    } finally {
      setBuying(false);
    }
  }

  // ── Toast ──
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === 'conflict' ? 6000 : 4000);
  }

  // ── Helpers ──
  function getRutaNombre(rutaId) {
    const ruta = rutas[rutaId];
    if (!ruta) return `Ruta #${rutaId}`;
    const origen  = ciudades[ruta.ciudad_origen_id]?.nombre  || '???';
    const destino = ciudades[ruta.ciudad_destino_id]?.nombre || '???';
    return `${origen} → ${destino}`;
  }

  function getEstadoColor(estado) {
    const map = {
      disponible: 'seat-available',
      en_proceso: 'seat-process',
      ocupado:    'seat-occupied',
      no_show:    'seat-noshow',
    };
    return map[estado] || '';
  }

  // ═══════════════════════════════════════════════════════════════
  // ── RENDER ──
  // ═══════════════════════════════════════════════════════════════

  // ── Loading state ──
  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p className="state-title">Cargando viajes disponibles…</p>
        <p className="state-message">Conectando con el sistema de boletería</p>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="state-container">
        <span className="state-icon">⚠️</span>
        <p className="state-title">Error al cargar datos</p>
        <p className="state-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (viajes.length === 0) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">🎫 Boletería</h1>
          <p className="page-subtitle">Punto de venta de pasajes</p>
        </div>
        <div className="state-container">
          <span className="state-icon">🚌</span>
          <p className="state-title">No hay viajes en venta</p>
          <p className="state-message">
            Cuando un operador publique un viaje, aparecerá aquí listo para vender pasajes.
          </p>
        </div>
      </>
    );
  }

  // ── Data loaded ──
  return (
    <>
      {/* ── Toast notification ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success'  && '✅'}
            {toast.type === 'error'    && '❌'}
            {toast.type === 'conflict' && '⚠️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">🎫 Boletería</h1>
        <p className="page-subtitle">
          {viajes.length} viaje{viajes.length !== 1 ? 's' : ''} disponible{viajes.length !== 1 ? 's' : ''} para venta
          — Haz clic en un asiento verde para comprar
        </p>
      </div>

      <div className="card-grid">
        {viajes.map((viaje, index) => (
          <div
            className="card fade-in"
            key={viaje.id}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Card header */}
            <div className="card-header">
              <h3 className="card-title">{getRutaNombre(viaje.ruta_id)}</h3>
              <span className="badge badge-success">En venta</span>
            </div>

            {/* Card body */}
            <div className="card-body">
              <div className="card-row">
                <span className="card-label">📅 Fecha</span>
                <span className="card-value">{viaje.fecha_salida}</span>
              </div>
              <div className="card-row">
                <span className="card-label">🕐 Hora</span>
                <span className="card-value">{viaje.hora_salida}</span>
              </div>
              <div className="card-row">
                <span className="card-label">🚌 Bus</span>
                <span className="card-value">Unidad #{viaje.bus_id}</span>
              </div>
              <div className="card-row">
                <span className="card-label">💰 Tarifa</span>
                <span className="tarifa">
                  <span className="tarifa-currency">Bs</span>
                  {Number(viaje.tarifa_base).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Card footer */}
            <div className="card-footer">
              <span className="card-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                Viaje #{viaje.id}
              </span>
              <button
                className={`btn ${expandedViaje === viaje.id ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                onClick={() => handleVerAsientos(viaje.id)}
                disabled={loadingAsientos && expandedViaje !== viaje.id}
              >
                {loadingAsientos && expandedViaje === viaje.id
                  ? '⏳ Cargando…'
                  : expandedViaje === viaje.id
                    ? '✕ Cerrar'
                    : '🪑 Ver Asientos'}
              </button>
            </div>

            {/* Seat map (expandable) */}
            {expandedViaje === viaje.id && asientos.length > 0 && (
              <div className="seat-map-container">
                <div className="seat-map-header">
                  <span className="seat-map-title">Selecciona un asiento para comprar</span>
                  <div className="seat-legend">
                    <span className="legend-item"><span className="legend-dot seat-available" />Disponible</span>
                    <span className="legend-item"><span className="legend-dot seat-process" />En proceso</span>
                    <span className="legend-item"><span className="legend-dot seat-occupied" />Ocupado</span>
                  </div>
                </div>
                <div className="seat-grid">
                  {asientos.map(a => (
                    <div
                      key={a.id}
                      className={`seat ${getEstadoColor(a.estado)}`}
                      title={
                        a.estado === 'disponible'
                          ? `Asiento ${a.numero_asiento} — Clic para comprar (v${a.version})`
                          : `Asiento ${a.numero_asiento} — ${a.estado}`
                      }
                      onClick={() => handleSeatClick(a, viaje)}
                    >
                      {a.numero_asiento}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ── Modal de Compra ──
          ═══════════════════════════════════════════════════════════ */}
      {modalOpen && selectedSeat && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">🎫 Comprar Pasaje</h2>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            {/* Info del asiento seleccionado */}
            <div className="modal-info-bar">
              <div className="modal-info-item">
                <span className="modal-info-label">Ruta</span>
                <span className="modal-info-value">
                  {getRutaNombre(selectedSeat.viaje.ruta_id)}
                </span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">Asiento</span>
                <span className="modal-info-value modal-info-accent">
                  #{selectedSeat.asiento.numero_asiento}
                </span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">Tarifa</span>
                <span className="modal-info-value tarifa" style={{ fontSize: 'var(--font-size-lg)' }}>
                  <span className="tarifa-currency">Bs</span>
                  {Number(selectedSeat.viaje.tarifa_base).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulario */}
            {!boletoEmitido ? (
              <form onSubmit={handleComprar} className="modal-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="nombre_completo">
                    Nombre completo del pasajero
                  </label>
                  <input
                    id="nombre_completo"
                    name="nombre_completo"
                    type="text"
                    className="form-input"
                    placeholder="Ej: Juan Pérez"
                    value={form.nombre_completo}
                    onChange={handleFormChange}
                    required
                    autoFocus
                    disabled={buying}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="tipo_documento">
                      Tipo documento
                    </label>
                    <select
                      id="tipo_documento"
                      name="tipo_documento"
                      className="form-input form-select"
                      value={form.tipo_documento}
                      onChange={handleFormChange}
                      disabled={buying}
                    >
                      <option value="CI">CI</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="numero_documento">
                      Nro. documento
                    </label>
                    <input
                      id="numero_documento"
                      name="numero_documento"
                      type="text"
                      className="form-input"
                      placeholder="Ej: 1234567"
                      value={form.numero_documento}
                      onChange={handleFormChange}
                      required
                      disabled={buying}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="metodo_pago">
                    Método de pago
                  </label>
                  <select
                    id="metodo_pago"
                    name="metodo_pago"
                    className="form-input form-select"
                    value={form.metodo_pago}
                    onChange={handleFormChange}
                    disabled={buying}
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">🏦 Transferencia</option>
                  </select>
                </div>

                {/* Botones */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeModal}
                    disabled={buying}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={buying}
                  >
                    {buying ? (
                      <>
                        <span className="spinner-sm" /> Procesando…
                      </>
                    ) : (
                      '🎫 Confirmar Compra'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="modal-form" style={{ textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '15px', display: 'inline-block', borderRadius: '10px', marginBottom: '15px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOLETO-${boletoEmitido.id}-${boletoEmitido.ci}`} 
                    alt="QR de Abordaje" 
                  />
                </div>
                
                <h3 style={{ color: 'var(--color-accent-light)', marginBottom: '5px' }}>{boletoEmitido.codigo}</h3>
                <p style={{ margin: '5px 0' }}><strong>Pasajero:</strong> {boletoEmitido.pasajero} ({boletoEmitido.ci})</p>
                <p style={{ margin: '5px 0' }}><strong>Ruta:</strong> {boletoEmitido.ruta}</p>
                <p style={{ margin: '5px 0' }}><strong>Asiento:</strong> {boletoEmitido.asiento}</p>
                
                <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => {
                      setBoletoEmitido(null);
                      closeModal();
                    }}
                  >
                    🖨️ Imprimir y Nueva Venta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
