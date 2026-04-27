// ============================================================================
// tipoController.js — Controlador REST para Tipo de bus
// Respeta: openapi.yaml → /tipos  (200, 201, 404)
// ============================================================================

const repo = require('../repositories/tipoRepository');

const tipoController = {

  // GET /api/tipos → 200
  async listar(req, res) {
    try {
      const tipos = await repo.findAll();
      res.json(tipos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/tipos/:id → 200 | 404
  async obtener(req, res) {
    try {
      const tipo = await repo.findById(req.params.id);
      if (!tipo) return res.status(404).json({ error: 'Tipo no encontrado' });
      res.json(tipo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/tipos → 201
  async crear(req, res) {
    try {
      const { nombre, capacidad, pisos } = req.body;
      if (!nombre || !capacidad || !pisos) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, capacidad, pisos' });
      }
      const tipo = await repo.create({ nombre, capacidad, pisos });
      res.status(201).json(tipo);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Tipo duplicado (nombre ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/tipos/:id → 200 | 404
  async actualizar(req, res) {
    try {
      const existing = await repo.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Tipo no encontrado' });

      const { nombre, capacidad, pisos } = req.body;
      if (!nombre || !capacidad || !pisos) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, capacidad, pisos' });
      }
      const tipo = await repo.update(req.params.id, { nombre, capacidad, pisos });
      res.json(tipo);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Tipo duplicado (nombre ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/tipos/:id → 204 | 404
  async eliminar(req, res) {
    try {
      const changes = await repo.remove(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Tipo no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = tipoController;
