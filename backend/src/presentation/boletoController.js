// ============================================================================
// boletoController.js — Controlador REST para venta de boletos
// Respeta: openapi.yaml → POST /boletos  (201, 400, 404, 409)
//
// El 409 Conflict es la respuesta clave de concurrencia optimista:
//   → "El asiento fue modificado por otro vendedor"
// ============================================================================

const repo = require('../repositories/boletoRepository');

const boletoController = {

  // POST /api/boletos → 201 | 400 | 404 | 409
  async crear(req, res) {
    try {
      const {
        viaje_id,
        asiento_id,
        pasajero_id,
        pasajero,
        ciudad_subida_id,
        ciudad_bajada_id,
        tarifa_pagada,
        version_asiento,
        metodo_pago,
        vendedor_id,
      } = req.body;

      // Validar campos requeridos según openapi.yaml → BoletoCreate.required
      if (!viaje_id || !asiento_id || !ciudad_subida_id || !ciudad_bajada_id ||
          !tarifa_pagada || version_asiento === undefined || version_asiento === null ||
          !metodo_pago || !vendedor_id) {
        return res.status(400).json({
          error: 'Campos requeridos: viaje_id, asiento_id, ciudad_subida_id, ciudad_bajada_id, tarifa_pagada, version_asiento, metodo_pago, vendedor_id',
        });
      }

      // Validar que se proporcione pasajero_id o pasajero inline
      if (!pasajero_id && !pasajero) {
        return res.status(400).json({
          error: 'Debe proporcionar pasajero_id (entero) o pasajero (objeto con nombre_completo, tipo_documento, numero_documento)',
        });
      }

      if (pasajero && (!pasajero.nombre_completo || !pasajero.tipo_documento || !pasajero.numero_documento)) {
        return res.status(400).json({
          error: 'El objeto pasajero requiere: nombre_completo, tipo_documento, numero_documento',
        });
      }

      const resultado = await repo.comprar({
        viaje_id,
        asiento_id,
        pasajero_id,
        pasajero,
        ciudad_subida_id,
        ciudad_bajada_id,
        tarifa_pagada,
        version_asiento,
        metodo_pago,
        vendedor_id,
      });

      res.status(201).json(resultado);

    } catch (err) {
      // Errores con statusCode definido en el repository
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message });
    }
  },
};

module.exports = boletoController;
