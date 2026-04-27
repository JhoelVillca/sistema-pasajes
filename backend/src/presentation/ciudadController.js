// ============================================================================
// ciudadController.js — Controlador REST para Ciudad
// Respeta: openapi.yaml → /ciudades  (200, 201, 404, 409)
// ============================================================================

const repo = require('../repositories/ciudadRepository');

const ciudadController = {

  // GET /api/ciudades → 200
  async listar(req, res) {
    try {
      const ciudades = await repo.findAll();
      res.json(ciudades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/ciudades/:id → 200 | 404
  async obtener(req, res) {
    try {
      const ciudad = await repo.findById(req.params.id);
      if (!ciudad) return res.status(404).json({ error: 'Ciudad no encontrada' });
      res.json(ciudad);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/ciudades → 201 | 409
  async crear(req, res) {
    try {
      const { nombre, codigo, region, estado } = req.body;
      if (!nombre || !codigo || !region) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, codigo, region' });
      }
      const ciudad = await repo.create({ nombre, codigo, region, estado: estado || 'activo' });
      res.status(201).json(ciudad);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Ciudad duplicada (nombre o código ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/ciudades/:id → 200 | 404
  async actualizar(req, res) {
    try {
      const existing = await repo.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Ciudad no encontrada' });

      const { nombre, codigo, region, estado } = req.body;
      if (!nombre || !codigo || !region) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, codigo, region' });
      }
      const ciudad = await repo.update(req.params.id, { nombre, codigo, region, estado });
      res.json(ciudad);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Ciudad duplicada (nombre o código ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/ciudades/:id → 204 | 404
  async eliminar(req, res) {
    try {
      const changes = await repo.remove(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Ciudad no encontrada' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ciudadController;
