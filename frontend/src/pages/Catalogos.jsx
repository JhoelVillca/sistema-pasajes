// ============================================================================
// Catalogos.jsx — Gestión de catálogos maestros con pestañas
// Ciudades (HU-001), Rutas (HU-002), Tipos, Buses (HU-003), Personal (HU-004)
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import CrudPanel from '../components/crud/CrudPanel';
import {
  getCiudades, createCiudad, updateCiudad, deleteCiudad,
  getRutas, createRuta, updateRuta, deleteRuta,
  getTipos, createTipo, updateTipo, deleteTipo,
  getBuses, createBus, updateBus, deleteBus,
  getPersonal, createPersonal, updatePersonal, deletePersonal,
} from '../services/api';

// Tabs config
const TABS = [
  { id: 'ciudades',  label: '🏙️ Ciudades',  hu: 'HU-001' },
  { id: 'rutas',     label: '🛤️ Rutas',      hu: 'HU-002' },
  { id: 'tipos',     label: '🔧 Tipos',      hu: '—' },
  { id: 'buses',     label: '🚌 Buses',      hu: 'HU-003' },
  { id: 'personal',  label: '👤 Personal',   hu: 'HU-004' },
];

export default function Catalogos() {
  const [activeTab, setActiveTab] = useState('ciudades');

  // ── Datos compartidos (ciudades y tipos para selects) ──
  const [ciudadesData, setCiudadesData] = useState([]);
  const [tiposData, setTiposData]       = useState([]);

  useEffect(() => {
    getCiudades().then(setCiudadesData).catch(() => {});
    getTipos().then(setTiposData).catch(() => {});
  }, [activeTab]);

  // Options para selects
  const ciudadOptions = useMemo(() =>
    ciudadesData.map(c => ({ value: c.id, label: `${c.nombre} (${c.codigo})` })),
    [ciudadesData]
  );

  const tipoOptions = useMemo(() =>
    tiposData.map(t => ({ value: t.id, label: `${t.nombre} (${t.capacidad} asientos)` })),
    [tiposData]
  );

  // ═══════════════════════════════════════════════════════════
  // ── Configuraciones por entidad ──
  // ═══════════════════════════════════════════════════════════

  // ── CIUDADES ──
  const ciudadesConfig = {
    title: 'Ciudades',
    icon: '🏙️',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'codigo', label: 'Código' },
      { key: 'region', label: 'Región' },
      { key: 'estado', label: 'Estado', render: (v) => (
        <span className={`badge ${v === 'activo' ? 'badge-success' : 'badge-danger'}`}>{v}</span>
      )},
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: La Paz' },
      { name: 'codigo', label: 'Código', type: 'text', required: true, placeholder: 'Ej: LPZ' },
      { name: 'region', label: 'Región', type: 'text', required: true, placeholder: 'Ej: Altiplano' },
    ],
    emptyForm: { nombre: '', codigo: '', region: '' },
    apiFns: { list: getCiudades, create: createCiudad, update: updateCiudad, remove: deleteCiudad },
  };

  // ── RUTAS ──
  const rutasConfig = {
    title: 'Rutas',
    icon: '🛤️',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'ciudad_origen_id', label: 'Origen', render: (v) => {
        const c = ciudadesData.find(x => x.id === v);
        return c ? c.nombre : `#${v}`;
      }},
      { key: 'ciudad_destino_id', label: 'Destino', render: (v) => {
        const c = ciudadesData.find(x => x.id === v);
        return c ? c.nombre : `#${v}`;
      }},
      { key: 'distancia_km', label: 'Km', render: (v) => v ? `${v} km` : '—' },
      { key: 'tiempo_estimado', label: 'Tiempo', render: (v) => v ? `${v} min` : '—' },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre de la ruta', type: 'text', required: true, placeholder: 'Ej: La Paz - Cochabamba' },
      { name: 'ciudad_origen_id', label: 'Ciudad Origen', type: 'select', required: true, options: ciudadOptions },
      { name: 'ciudad_destino_id', label: 'Ciudad Destino', type: 'select', required: true, options: ciudadOptions },
      { name: 'distancia_km', label: 'Distancia (km)', type: 'number', placeholder: 'Ej: 380' },
      { name: 'tiempo_estimado', label: 'Tiempo estimado (min)', type: 'number', placeholder: 'Ej: 480' },
    ],
    emptyForm: { nombre: '', ciudad_origen_id: '', ciudad_destino_id: '', distancia_km: '', tiempo_estimado: '' },
    apiFns: { list: getRutas, create: createRuta, update: updateRuta, remove: deleteRuta },
  };

  // ── TIPOS ──
  const tiposConfig = {
    title: 'Tipos de Bus',
    icon: '🔧',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'capacidad', label: 'Capacidad', render: (v) => `${v} asientos` },
      { key: 'pisos', label: 'Pisos' },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre del tipo', type: 'text', required: true, placeholder: 'Ej: Estándar 40' },
      { name: 'capacidad', label: 'Capacidad (asientos)', type: 'number', required: true, placeholder: 'Ej: 40' },
      { name: 'pisos', label: 'Pisos', type: 'number', required: true, placeholder: 'Ej: 1 o 2' },
    ],
    emptyForm: { nombre: '', capacidad: '', pisos: '' },
    apiFns: { list: getTipos, create: createTipo, update: updateTipo, remove: deleteTipo },
  };

  // ── BUSES ──
  const busesConfig = {
    title: 'Buses',
    icon: '🚌',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'placa', label: 'Placa' },
      { key: 'numero_unidad', label: 'Unidad' },
      { key: 'tipo_id', label: 'Tipo', render: (v) => {
        const t = tiposData.find(x => x.id === v);
        return t ? t.nombre : `#${v}`;
      }},
      { key: 'estado', label: 'Estado', render: (v) => (
        <span className={`badge ${v === 'activo' ? 'badge-success' : v === 'mantenimiento' ? 'badge-warning' : 'badge-danger'}`}>
          {v}
        </span>
      )},
    ],
    fields: [
      { name: 'placa', label: 'Placa', type: 'text', required: true, placeholder: 'Ej: 1234-ABC' },
      { name: 'numero_unidad', label: 'Número de unidad', type: 'text', required: true, placeholder: 'Ej: U-001' },
      { name: 'tipo_id', label: 'Tipo de Bus', type: 'select', required: true, options: tipoOptions },
      { name: 'estado', label: 'Estado', type: 'select', options: [
        { value: 'activo', label: 'Activo' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'baja', label: 'Baja' },
      ]},
    ],
    emptyForm: { placa: '', numero_unidad: '', tipo_id: '', estado: 'activo' },
    apiFns: { list: getBuses, create: createBus, update: updateBus, remove: deleteBus },
  };

  // ── PERSONAL ──
  const personalConfig = {
    title: 'Personal',
    icon: '👤',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre_completo', label: 'Nombre' },
      { key: 'documento_identidad', label: 'Documento' },
      { key: 'tipo_personal', label: 'Tipo', render: (v) => (
        <span className={`badge ${v === 'chofer' ? 'badge-info' : v === 'ayudante' ? 'badge-warning' : 'badge-success'}`}>
          {v}
        </span>
      )},
      { key: 'licencia_conducir', label: 'Licencia' },
      { key: 'estado', label: 'Estado', render: (v) => (
        <span className={`badge ${v === 'activo' ? 'badge-success' : 'badge-danger'}`}>{v}</span>
      )},
    ],
    fields: [
      { name: 'nombre_completo', label: 'Nombre completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez' },
      { name: 'documento_identidad', label: 'Documento de identidad', type: 'text', required: true, placeholder: 'Ej: 1234567' },
      { name: 'tipo_personal', label: 'Tipo de personal', type: 'select', required: true, options: [
        { value: 'chofer', label: '🚗 Chofer' },
        { value: 'ayudante', label: '🤝 Ayudante' },
        { value: 'administrativo', label: '💼 Administrativo' },
      ]},
      { name: 'licencia_conducir', label: 'Licencia de conducir', type: 'text', placeholder: 'Ej: CAT-B (solo choferes)' },
      { name: 'password', label: 'Contraseña', type: 'password', conditionalRequired: true, placeholder: 'Mínimo 6 caracteres' },
    ],
    emptyForm: { nombre_completo: '', documento_identidad: '', tipo_personal: '', licencia_conducir: '', password: '' },
    apiFns: {
      list: () => getPersonal(),
      create: createPersonal,
      update: updatePersonal,
      remove: deletePersonal,
    },
  };

  // Mapa de configs
  const configMap = {
    ciudades: ciudadesConfig,
    rutas:    rutasConfig,
    tipos:    tiposConfig,
    buses:    busesConfig,
    personal: personalConfig,
  };

  const currentConfig = configMap[activeTab];

  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📋 Catálogos</h1>
        <p className="page-subtitle">Gestión de datos maestros del sistema</p>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.hu !== '—' && <span className="tab-badge">{tab.hu}</span>}
          </button>
        ))}
      </div>

      {/* ── Panel CRUD activo ── */}
      <CrudPanel
        key={activeTab}
        {...currentConfig}
      />
    </>
  );
}
