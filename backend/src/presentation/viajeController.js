// ============================================================================
// viajeController.js — Controlador REST para Viaje + Asientos
// Respeta: openapi.yaml → /viajes  (200, 201, 404, 409, 422)
// ============================================================================

const viajeRepo = require('../repositories/viajeRepository');
const busRepo   = require('../repositories/busRepository');
const tipoRepo  = require('../repositories/tipoRepository');

const viajeController = {

  // GET /api/viajes?estado=&fecha= → 200
  async listar(req, res) {
    try {
      const viajes = await viajeRepo.findAll({
        estado: req.query.estado,
        fecha:  req.query.fecha,
      });
      res.json(viajes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/viajes/:id → 200 (ViajeDetalle con asientos) | 404
  async obtener(req, res) {
    try {
      const viaje = await viajeRepo.findById(req.params.id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

      const asientos = await viajeRepo.findAsientos(req.params.id);
      res.json({ ...viaje, asientos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/viajes → 201 | 409
  async crear(req, res) {
    try {
      const { ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base } = req.body;
      if (!ruta_id || !bus_id || !chofer_id || !ayudante_id || !fecha_salida || !hora_salida || !tarifa_base) {
        return res.status(400).json({ error: 'Campos requeridos: ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base' });
      }

      // Validar que el bus no esté asignado en el mismo horario
      const conflicto = await viajeRepo.busOcupadoEnHorario(bus_id, fecha_salida, hora_salida);
      if (conflicto) {
        return res.status(409).json({ error: 'El bus ya está asignado a otro viaje en ese horario' });
      }

      // Crear viaje
      const viaje = await viajeRepo.create({ ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base });

      // Obtener Tipo del bus para generar asientos (HU-006)
      const bus = await busRepo.findById(bus_id);
      const tipo = await tipoRepo.findById(bus.tipo_id);
      await viajeRepo.generarAsientos(viaje.id, tipo.capacidad, tipo.pisos);

      // Devolver viaje con asientos
      const asientos = await viajeRepo.findAsientos(viaje.id);
      res.status(201).json({ ...viaje, asientos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/viajes/:id/publicar → 200 | 404 | 422
  async publicar(req, res) {
    try {
      const viaje = await viajeRepo.findById(req.params.id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

      if (viaje.estado !== 'programado') {
        return res.status(422).json({ error: `No se puede publicar: el viaje está en estado "${viaje.estado}" (se requiere "programado")` });
      }

      const updated = await viajeRepo.publicar(req.params.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/viajes/:id/asientos → 200 | 404
  async listarAsientos(req, res) {
    try {
      const viaje = await viajeRepo.findById(req.params.id);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

      const asientos = await viajeRepo.findAsientos(req.params.id);
      res.json(asientos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = viajeController;
