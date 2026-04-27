// ============================================================================
// api.js — Servicio HTTP centralizado (Axios)
// Apunta a http://localhost:3000/api según openapi.yaml
// ============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Ciudades ──
export const getCiudades       = ()     => api.get('/ciudades').then(r => r.data);
export const getCiudad         = (id)   => api.get(`/ciudades/${id}`).then(r => r.data);
export const createCiudad      = (data) => api.post('/ciudades', data).then(r => r.data);
export const updateCiudad      = (id, data) => api.put(`/ciudades/${id}`, data).then(r => r.data);
export const deleteCiudad      = (id)   => api.delete(`/ciudades/${id}`);

// ── Rutas ──
export const getRutas          = ()     => api.get('/rutas').then(r => r.data);
export const getRuta           = (id)   => api.get(`/rutas/${id}`).then(r => r.data);
export const createRuta        = (data) => api.post('/rutas', data).then(r => r.data);
export const updateRuta        = (id, data) => api.put(`/rutas/${id}`, data).then(r => r.data);
export const deleteRuta        = (id)   => api.delete(`/rutas/${id}`);

// ── Tipos ──
export const getTipos          = ()     => api.get('/tipos').then(r => r.data);
export const getTipo           = (id)   => api.get(`/tipos/${id}`).then(r => r.data);
export const createTipo        = (data) => api.post('/tipos', data).then(r => r.data);
export const updateTipo        = (id, data) => api.put(`/tipos/${id}`, data).then(r => r.data);
export const deleteTipo        = (id)   => api.delete(`/tipos/${id}`);

// ── Buses ──
export const getBuses          = ()     => api.get('/buses').then(r => r.data);
export const getBus            = (id)   => api.get(`/buses/${id}`).then(r => r.data);
export const createBus         = (data) => api.post('/buses', data).then(r => r.data);
export const updateBus         = (id, data) => api.put(`/buses/${id}`, data).then(r => r.data);
export const deleteBus         = (id)   => api.delete(`/buses/${id}`);

// ── Personal ──
export const getPersonal       = (tipo) => api.get('/personal', { params: tipo ? { tipo } : {} }).then(r => r.data);
export const getPersonalById   = (id)   => api.get(`/personal/${id}`).then(r => r.data);
export const createPersonal    = (data) => api.post('/personal', data).then(r => r.data);
export const updatePersonal    = (id, data) => api.put(`/personal/${id}`, data).then(r => r.data);
export const deletePersonal    = (id)   => api.delete(`/personal/${id}`);

// ── Viajes ──
export const getViajes         = (params) => api.get('/viajes', { params }).then(r => r.data);
export const getViajesEnVenta  = ()     => api.get('/viajes', { params: { estado: 'en_venta' } }).then(r => r.data);
export const getViaje          = (id)   => api.get(`/viajes/${id}`).then(r => r.data);
export const createViaje       = (data) => api.post('/viajes', data).then(r => r.data);
export const publicarViaje     = (id)   => api.patch(`/viajes/${id}/publicar`).then(r => r.data);
export const getAsientos       = (viajeId) => api.get(`/viajes/${viajeId}/asientos`).then(r => r.data);

export default api;
