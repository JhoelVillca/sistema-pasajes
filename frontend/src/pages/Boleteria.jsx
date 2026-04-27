// ============================================================================
// Boleteria.jsx — Vista de venta de boletos
// Llama a GET /viajes?estado=en_venta y renderiza tarjetas interactivas
// ============================================================================

import { useState, useEffect } from 'react';
import { getViajesEnVenta, getAsientos, getRutas, getCiudades } from '../services/api';

export default function Boleteria() {
  const [viajes, setViajes]     = useState([]);
  const [rutas, setRutas]       = useState({});
  const [ciudades, setCiudades] = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Estado para asientos expandidos
  const [expandedViaje, setExpandedViaje] = useState(null);
  const [asientos, setAsientos]           = useState([]);
  const [loadingAsientos, setLoadingAsientos] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Traer viajes en venta, rutas y ciudades en paralelo
        const [viajesData, rutasData, ciudadesData] = await Promise.all([
          getViajesEnVenta(),
          getRutas(),
          getCiudades(),
        ]);

        // Indexar rutas y ciudades por ID para lookup rápido
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

    fetchData();
  }, []);

  async function handleVerAsientos(viajeId) {
    if (expandedViaje === viajeId) {
      setExpandedViaje(null);
      setAsientos([]);
      return;
    }

    try {
      setLoadingAsientos(true);
      const data = await getAsientos(viajeId);
      setAsientos(data);
      setExpandedViaje(viajeId);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert(`Error al cargar asientos: ${msg}`);
    } finally {
      setLoadingAsientos(false);
    }
  }

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
      <div className="page-header">
        <h1 className="page-title">🎫 Boletería</h1>
        <p className="page-subtitle">
          {viajes.length} viaje{viajes.length !== 1 ? 's' : ''} disponible{viajes.length !== 1 ? 's' : ''} para venta
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
                  <span className="seat-map-title">Mapa de Asientos</span>
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
                      title={`Asiento ${a.numero_asiento} — ${a.estado} (v${a.version})`}
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
    </>
  );
}
