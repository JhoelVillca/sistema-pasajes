// ============================================================================
// rutaController.js — Controlador REST para Ruta + Paradas
// Respeta: openapi.yaml → /rutas  (200, 201, 404)
// ============================================================================

const repo = require('../repositories/rutaRepository');

const rutaController = {

  // GET /api/rutas → 200
  async listar(req, res) {
    try {
      const rutas = await repo.findAll();
      res.json(rutas);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/rutas/:id → 200 (RutaDetalle con paradas) | 404
  async obtener(req, res) {
    try {
      const ruta = await repo.findById(req.params.id);
      if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

      const paradas = await repo.findParadas(req.params.id);
      res.json({ ...ruta, paradas });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/rutas → 201
  async crear(req, res) {
    try {
      const { nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas } = req.body;
      if (!nombre || !ciudad_origen_id || !ciudad_destino_id) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, ciudad_origen_id, ciudad_destino_id' });
      }
      const ruta = await repo.create({ nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas });
      res.status(201).json(ruta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/rutas/:id → 200 | 404
  async actualizar(req, res) {
    try {
      const existing = await repo.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Ruta no encontrada' });

      const { nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas } = req.body;
      if (!nombre || !ciudad_origen_id || !ciudad_destino_id) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, ciudad_origen_id, ciudad_destino_id' });
      }
      const ruta = await repo.update(req.params.id, { nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas });
      res.json(ruta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/rutas/:id → 204 | 404
  async eliminar(req, res) {
    try {
      const changes = await repo.remove(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Ruta no encontrada' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = rutaController;
