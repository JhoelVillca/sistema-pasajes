// ============================================================================
// despachoController.js — Etapa 5 (Despacho y Abordaje)
// ============================================================================

const despachoRepo = require('../repositories/despachoRepository');

class DespachoController {
  
  // GET /viajes/{id}/boletos
  async listarBoletosViaje(req, res) {
    try {
      const boletos = await despachoRepo.getBoletosPorViaje(req.params.id);
      res.json(boletos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /despachos
  async crearDespacho(req, res) {
    try {
      const { viaje_id, despachador_id } = req.body;
      if (!viaje_id || !despachador_id) {
        return res.status(400).json({ error: 'Faltan campos requeridos (viaje_id, despachador_id)' });
      }

      const despacho = await despachoRepo.crearDespacho(req.body);
      res.status(201).json(despacho);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'El viaje ya tiene un despacho iniciado' });
      }
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /despachos/{id}/pasajeros/{boleto_id}
  async actualizarPresencia(req, res) {
    try {
      const { id, boleto_id } = req.params;
      const { estado_presencia } = req.body;
      
      if (!estado_presencia || !['presente', 'ausente', 'no_show'].includes(estado_presencia)) {
        return res.status(400).json({ error: 'estado_presencia inválido' });
      }

      const registro = await despachoRepo.actualizarPresencia(id, boleto_id, estado_presencia);
      res.json(registro);
    } catch (err) {
      if (err.message.includes('No se encontró')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  // PATCH /despachos/{id}/finalizar
  async finalizarDespacho(req, res) {
    try {
      const despacho = await despachoRepo.finalizarDespacho(req.params.id);
      res.json(despacho);
    } catch (err) {
      if (err.message.includes('Despacho no encontrado')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new DespachoController();
