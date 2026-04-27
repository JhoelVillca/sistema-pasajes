// ============================================================================
// busController.js — Controlador REST para Bus
// Respeta: openapi.yaml → /buses  (200, 201, 404)
// ============================================================================

const repo = require('../repositories/busRepository');

const busController = {

  // GET /api/buses → 200
  async listar(req, res) {
    try {
      const buses = await repo.findAll();
      res.json(buses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/buses/:id → 200 | 404
  async obtener(req, res) {
    try {
      const bus = await repo.findById(req.params.id);
      if (!bus) return res.status(404).json({ error: 'Bus no encontrado' });
      res.json(bus);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/buses → 201
  async crear(req, res) {
    try {
      const { placa, numero_unidad, tipo_id, estado } = req.body;
      if (!placa || !numero_unidad || !tipo_id) {
        return res.status(400).json({ error: 'Campos requeridos: placa, numero_unidad, tipo_id' });
      }
      const bus = await repo.create({ placa, numero_unidad, tipo_id, estado });
      res.status(201).json(bus);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Bus duplicado (placa o número de unidad ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/buses/:id → 200 | 404
  async actualizar(req, res) {
    try {
      const existing = await repo.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Bus no encontrado' });

      const { placa, numero_unidad, tipo_id, estado } = req.body;
      if (!placa || !numero_unidad || !tipo_id) {
        return res.status(400).json({ error: 'Campos requeridos: placa, numero_unidad, tipo_id' });
      }
      const bus = await repo.update(req.params.id, { placa, numero_unidad, tipo_id, estado });
      res.json(bus);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Bus duplicado (placa o número de unidad ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/buses/:id → 204 | 404
  async eliminar(req, res) {
    try {
      const changes = await repo.remove(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Bus no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = busController;
