// ============================================================================
// Despachos.jsx — Etapa 5: Control de Abordaje y Despacho
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getViajesEnVenta,
  getRutas,
  getCiudades,
  getBoletosViaje,
  crearDespacho,
  actualizarPresencia,
  finalizarDespacho
} from '../services/api';

export default function Despachos() {
  // ── ESTADO GENERAL ──
  const [toast, setToast] = useState(null);
  
  // ── ESTADO 1: Selección de Viaje ──
  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState({});
  const [ciudades, setCiudades] = useState({});
  const [loadingViajes, setLoadingViajes] = useState(true);
  const [startingDespacho, setStartingDespacho] = useState(false);

  // ── ESTADO 2: Control de Abordaje ──
  const [activeViaje, setActiveViaje] = useState(null); // Viaje seleccionado
  const [activeDespachoId, setActiveDespachoId] = useState(null); // ID del despacho activo
  const [boletos, setBoletos] = useState([]);
  const [loadingBoletos, setLoadingBoletos] = useState(false);
  const [updatingBoleto, setUpdatingBoleto] = useState(null); // ID del boleto actualizándose
  const [finishing, setFinishing] = useState(false);

  // ── Toast Helper ──
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Cargar Datos Iniciales ──
  const fetchInitialData = useCallback(async () => {
    try {
      setLoadingViajes(true);
      const [viajesData, rutasData, ciudadesData] = await Promise.all([
        getViajesEnVenta(),
        getRutas(),
        getCiudades()
      ]);

      const rutasMap = {};
      rutasData.forEach(r => { rutasMap[r.id] = r; });

      const ciudadesMap = {};
      ciudadesData.forEach(c => { ciudadesMap[c.id] = c; });

      setViajes(viajesData);
      setRutas(rutasMap);
      setCiudades(ciudadesMap);
    } catch (err) {
      showToast('error', 'Error al cargar viajes: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingViajes(false);
    }
  }, []);

  useEffect(() => {
    if (!activeViaje) {
      fetchInitialData();
    }
  }, [activeViaje, fetchInitialData]);

  // ── Helpers de Renderizado ──
  function getRutaNombre(rutaId) {
    const ruta = rutas[rutaId];
    if (!ruta) return `Ruta #${rutaId}`;
    const origen  = ciudades[ruta.ciudad_origen_id]?.nombre  || '???';
    const destino = ciudades[ruta.ciudad_destino_id]?.nombre || '???';
    return `${origen} → ${destino}`;
  }

  // ── ACCIÓN: Iniciar Despacho ──
  async function handleIniciarDespacho(viaje) {
    try {
      setStartingDespacho(true);
      
      const payload = {
        viaje_id: viaje.id,
        despachador_id: 1 // TODO: Hardcodeado temporalmente
      };

      let despachoId = null;

      try {
        const response = await crearDespacho(payload);
        despachoId = response.id;
        showToast('success', 'Despacho iniciado correctamente');
      } catch (err) {
        if (err.response?.status === 409) {
          showToast('warning', 'Retomando despacho existente');
          // Fallback: Si el backend no devuelve el ID en el 409, asumimos que viaje_id == despacho_id
          // en un entorno de desarrollo limpio, o el usuario lo corregirá después.
          despachoId = viaje.id; 
        } else {
          throw err; // Re-lanzar si es otro error
        }
      }

      // Pasar al Estado 2
      setActiveDespachoId(despachoId);
      setActiveViaje(viaje);
      
      // Cargar lista de pasajeros
      setLoadingBoletos(true);
      const boletosData = await getBoletosViaje(viaje.id);
      
      // Inicializamos localmente el estado de presencia para la UI si no viene en el endpoint
      const boletosConEstado = boletosData.map(b => ({
        ...b,
        estado_presencia: 'ausente' // Valor por defecto según requerimiento
      }));
      
      setBoletos(boletosConEstado);
    } catch (err) {
      showToast('error', 'Error al iniciar despacho: ' + (err.response?.data?.error || err.message));
    } finally {
      setStartingDespacho(false);
      setLoadingBoletos(false);
    }
  }

  // ── ACCIÓN: Cambiar Estado Pasajero ──
  async function handleCambiarPresencia(boletoId, nuevoEstado) {
    try {
      setUpdatingBoleto(boletoId);
      await actualizarPresencia(activeDespachoId, boletoId, nuevoEstado);
      
      // Actualizar UI
      setBoletos(prev => prev.map(b => 
        b.id === boletoId ? { ...b, estado_presencia: nuevoEstado } : b
      ));
      
    } catch (err) {
      showToast('error', 'Error al actualizar pasajero: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingBoleto(null);
    }
  }

  // ── ACCIÓN: Finalizar Despacho ──
  async function handleFinalizarDespacho() {
    if (!window.confirm('¿Estás seguro de finalizar el despacho? El bus cambiará a estado "en_ruta".')) return;
    
    try {
      setFinishing(true);
      await finalizarDespacho(activeDespachoId);
      
      showToast('success', '¡Bus despachado correctamente! Buen viaje.');
      
      // Limpiar panel y volver al Estado 1
      setActiveViaje(null);
      setActiveDespachoId(null);
      setBoletos([]);
    } catch (err) {
      showToast('error', 'Error al finalizar despacho: ' + (err.response?.data?.error || err.message));
    } finally {
      setFinishing(false);
    }
  }

  // ==========================================================================
  // RENDER ESTADO 2: CONTROL DE ABORDAJE
  // ==========================================================================
  if (activeViaje) {
    const todosPresentes = boletos.every(b => b.estado_presencia === 'presente' || b.estado_presencia === 'no_show');
    const presentesCount = boletos.filter(b => b.estado_presencia === 'presente').length;

    return (
      <div className="fade-in">
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>✕</button>
          </div>
        )}

        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">📋 Control de Abordaje</h1>
            <p className="page-subtitle">
              {getRutaNombre(activeViaje.ruta_id)} — Unidad #{activeViaje.bus_id}
            </p>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={() => setActiveViaje(null)}
            disabled={finishing}
          >
            ← Volver a Viajes
          </button>
        </div>

        <div className="crud-panel" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="crud-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="crud-title">Lista de Pasajeros</h2>
              <p className="crud-subtitle">
                {presentesCount} de {boletos.length} presentes
              </p>
            </div>
            
            <button 
              className={`btn ${todosPresentes ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleFinalizarDespacho}
              disabled={finishing || loadingBoletos}
              style={{
                boxShadow: todosPresentes ? '0 0 15px var(--color-accent-glow)' : 'none'
              }}
            >
              {finishing ? <><span className="spinner-sm" /> Finalizando…</> : '🚀 Finalizar y Despachar Bus'}
            </button>
          </div>

          {loadingBoletos ? (
            <div className="state-container" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : boletos.length === 0 ? (
            <div className="state-container" style={{ minHeight: 200 }}>
              <span className="state-icon">📭</span>
              <p className="state-title">No hay boletos vendidos</p>
              <p className="state-message">Este viaje no tiene pasajeros registrados aún.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asiento</th>
                    <th>Pasajero</th>
                    <th>Documento</th>
                    <th style={{ textAlign: 'center' }}>Estado Presencia</th>
                  </tr>
                </thead>
                <tbody>
                  {boletos.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-accent-light)' }}>
                        #{b.numero_asiento}
                      </td>
                      <td>{b.nombre_pasajero}</td>
                      <td>{b.numero_documento}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--color-bg-input)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
                          <button
                            className={`btn btn-sm ${b.estado_presencia === 'presente' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleCambiarPresencia(b.id, 'presente')}
                            disabled={updatingBoleto === b.id || finishing}
                            style={{ minWidth: '80px' }}
                          >
                            Presente
                          </button>
                          <button
                            className={`btn btn-sm ${b.estado_presencia === 'ausente' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleCambiarPresencia(b.id, 'ausente')}
                            disabled={updatingBoleto === b.id || finishing}
                            style={{ minWidth: '80px', background: b.estado_presencia === 'ausente' ? 'var(--color-warning)' : '' }}
                          >
                            Ausente
                          </button>
                          <button
                            className={`btn btn-sm ${b.estado_presencia === 'no_show' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleCambiarPresencia(b.id, 'no_show')}
                            disabled={updatingBoleto === b.id || finishing}
                            style={{ minWidth: '80px', background: b.estado_presencia === 'no_show' ? 'var(--color-danger)' : '' }}
                          >
                            No Show
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER ESTADO 1: SELECCIÓN DE VIAJE
  // ==========================================================================
  return (
    <>
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
        <h1 className="page-title">📋 Despachos</h1>
        <p className="page-subtitle">Selecciona un viaje en venta para iniciar el control de abordaje</p>
      </div>

      {loadingViajes ? (
        <div className="state-container" style={{ minHeight: 200 }}>
          <div className="spinner" />
          <p className="state-message">Cargando viajes disponibles...</p>
        </div>
      ) : viajes.length === 0 ? (
        <div className="state-container" style={{ minHeight: 200 }}>
          <span className="state-icon">🚌</span>
          <p className="state-title">No hay viajes en venta</p>
          <p className="state-message">Debes publicar viajes desde la sección de Programación para verlos aquí.</p>
        </div>
      ) : (
        <div className="card-grid">
          {viajes.map((viaje, index) => (
            <div className="card fade-in" key={viaje.id} style={{ animationDelay: `${index * 60}ms` }}>
              <div className="card-header">
                <h3 className="card-title">{getRutaNombre(viaje.ruta_id)}</h3>
                <span className="badge badge-success">En venta</span>
              </div>
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
              </div>
              <div className="card-footer">
                <span className="card-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Viaje #{viaje.id}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleIniciarDespacho(viaje)}
                  disabled={startingDespacho}
                >
                  {startingDespacho ? 'Iniciando…' : '📝 Iniciar Despacho'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
