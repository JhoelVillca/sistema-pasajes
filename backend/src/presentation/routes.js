// ============================================================================
// routes.js — Router centralizado bajo prefijo /api
// Mapea cada endpoint de openapi.yaml a su controlador correspondiente.
// ============================================================================

const { Router } = require('express');

const ciudadCtrl   = require('./ciudadController');
const rutaCtrl     = require('./rutaController');
const tipoCtrl     = require('./tipoController');
const busCtrl      = require('./busController');
const personalCtrl = require('./personalController');
const viajeCtrl    = require('./viajeController');
const boletoCtrl   = require('./boletoController');

const router = Router();

// ── Ciudades (HU-001) ──
router.get('/ciudades',       ciudadCtrl.listar);
router.post('/ciudades',      ciudadCtrl.crear);
router.get('/ciudades/:id',   ciudadCtrl.obtener);
router.put('/ciudades/:id',   ciudadCtrl.actualizar);
router.delete('/ciudades/:id', ciudadCtrl.eliminar);

// ── Rutas (HU-002) ──
router.get('/rutas',       rutaCtrl.listar);
router.post('/rutas',      rutaCtrl.crear);
router.get('/rutas/:id',   rutaCtrl.obtener);
router.put('/rutas/:id',   rutaCtrl.actualizar);
router.delete('/rutas/:id', rutaCtrl.eliminar);

// ── Tipos ──
router.get('/tipos',       tipoCtrl.listar);
router.post('/tipos',      tipoCtrl.crear);
router.get('/tipos/:id',   tipoCtrl.obtener);
router.put('/tipos/:id',   tipoCtrl.actualizar);
router.delete('/tipos/:id', tipoCtrl.eliminar);

// ── Buses (HU-003) ──
router.get('/buses',       busCtrl.listar);
router.post('/buses',      busCtrl.crear);
router.get('/buses/:id',   busCtrl.obtener);
router.put('/buses/:id',   busCtrl.actualizar);
router.delete('/buses/:id', busCtrl.eliminar);

// ── Personal (HU-004) ──
router.get('/personal',       personalCtrl.listar);
router.post('/personal',      personalCtrl.crear);
router.get('/personal/:id',   personalCtrl.obtener);
router.put('/personal/:id',   personalCtrl.actualizar);
router.delete('/personal/:id', personalCtrl.eliminar);

// ── Viajes (HU-005, HU-006, HU-007) ──
router.get('/viajes',              viajeCtrl.listar);
router.post('/viajes',             viajeCtrl.crear);
router.get('/viajes/:id',          viajeCtrl.obtener);
router.patch('/viajes/:id/publicar', viajeCtrl.publicar);
router.get('/viajes/:id/asientos', viajeCtrl.listarAsientos);

// ── Boletos — Etapa 3 (HU-010 a HU-014) ──
router.post('/boletos',            boletoCtrl.crear);

module.exports = router;
