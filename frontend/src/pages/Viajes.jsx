// ============================================================================
// Viajes.jsx — Vista de programación de viajes
// Placeholder para Etapa 2 (Crear viaje, publicar)
// ============================================================================

export default function Viajes() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🗓️ Viajes</h1>
        <p className="page-subtitle">Programación y gestión de viajes</p>
      </div>

      <div className="card-grid">
        {[
          { icon: '➕', title: 'Crear Viaje', desc: 'Asignar ruta, bus y tripulación', hu: 'HU-005' },
          { icon: '🪑', title: 'Mapa de Asientos', desc: 'Generación automática según tipo de bus', hu: 'HU-006' },
          { icon: '📢', title: 'Publicar Viaje', desc: 'Activar viaje para venta de pasajes', hu: 'HU-007' },
        ].map((item, i) => (
          <div className="card fade-in" key={item.title} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="card-header">
              <h3 className="card-title">{item.icon} {item.title}</h3>
              <span className="badge badge-warning">{item.hu}</span>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {item.desc}
              </p>
            </div>
            <div className="card-footer">
              <span className="card-label">Módulo de programación</span>
              <button className="btn btn-ghost btn-sm" disabled>Próximamente</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
