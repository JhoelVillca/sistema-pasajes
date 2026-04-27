// ============================================================================
// Catalogos.jsx — Vista de administración de catálogos maestros
// Placeholder para Etapa 1 (Ciudades, Rutas, Tipos, Buses, Personal)
// ============================================================================

export default function Catalogos() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📋 Catálogos</h1>
        <p className="page-subtitle">Gestión de datos maestros del sistema</p>
      </div>

      <div className="card-grid">
        {[
          { icon: '🏙️', title: 'Ciudades', desc: 'Registro de ciudades para rutas', hu: 'HU-001' },
          { icon: '🛤️', title: 'Rutas', desc: 'Definición de corredores operativos', hu: 'HU-002' },
          { icon: '🔧', title: 'Tipos de Bus', desc: 'Configuración de capacidad y pisos', hu: '—' },
          { icon: '🚌', title: 'Buses', desc: 'Flota vehicular registrada', hu: 'HU-003' },
          { icon: '👤', title: 'Personal', desc: 'Choferes, ayudantes y administrativos', hu: 'HU-004' },
        ].map((cat, i) => (
          <div className="card fade-in" key={cat.title} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="card-header">
              <h3 className="card-title">{cat.icon} {cat.title}</h3>
              <span className="badge badge-info">{cat.hu}</span>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {cat.desc}
              </p>
            </div>
            <div className="card-footer">
              <span className="card-label">Módulo de catálogo</span>
              <button className="btn btn-ghost btn-sm" disabled>Próximamente</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
