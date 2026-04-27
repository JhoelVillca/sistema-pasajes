// ============================================================================
// boletoRepository.js — Acceso a datos para Boleto + Pago + Pasajero
//
// REGLA DE ORO (HU-014 — Concurrencia Optimista):
//   UPDATE asiento SET estado='ocupado', pasajero_id=?, version=version+1
//   WHERE id=? AND version=?
//   → Si changes === 0 → ABORTAR: otro vendedor modificó el asiento.
// ============================================================================

const crypto = require('crypto');
const db     = require('../models/db');

/**
 * Genera un código único para el boleto (BOL-<hex8>).
 * En producción se usaría UUID v4 o un secuencial formateado.
 */
function generarCodigoUnico() {
  const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `BOL-${hex}`;
}

/**
 * Genera un número de comprobante para el pago (PAG-<hex8>).
 */
function generarNumeroComprobante() {
  const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `PAG-${hex}`;
}

const boletoRepository = {

  /**
   * Proceso de compra atómico:
   *
   * 1. Validar que el viaje exista y esté en_venta.
   * 2. Obtener/crear el pasajero.
   * 3. BLOQUEO OPTIMISTA: actualizar asiento con WHERE version = ?.
   *    Si changes === 0 → lanzar error de concurrencia.
   * 4. Insertar boleto.
   * 5. Insertar pago.
   * 6. Devolver { boleto, pago, asiento }.
   */
  async comprar({
    viaje_id,
    asiento_id,
    pasajero_id,
    pasajero,         // { nombre_completo, tipo_documento, numero_documento, telefono?, correo? }
    ciudad_subida_id,
    ciudad_bajada_id,
    tarifa_pagada,
    version_asiento,
    metodo_pago,
    vendedor_id,
  }) {

    // ── 1. Validar viaje ──
    const viaje = await db.get('SELECT * FROM viaje WHERE id = ?', [viaje_id]);
    if (!viaje) {
      const err = new Error('Viaje no encontrado');
      err.statusCode = 404;
      throw err;
    }
    if (viaje.estado !== 'en_venta') {
      const err = new Error(`El viaje no está en venta (estado actual: "${viaje.estado}")`);
      err.statusCode = 422;
      throw err;
    }

    // ── 2. Validar asiento pertenece al viaje ──
    const asiento = await db.get(
      'SELECT * FROM asiento WHERE id = ? AND viaje_id = ?',
      [asiento_id, viaje_id]
    );
    if (!asiento) {
      const err = new Error('Asiento no encontrado en este viaje');
      err.statusCode = 404;
      throw err;
    }
    if (asiento.estado !== 'disponible') {
      const err = new Error(`El asiento no está disponible (estado actual: "${asiento.estado}")`);
      err.statusCode = 409;
      throw err;
    }

    // ── 3. Obtener o crear pasajero ──
    let finalPasajeroId = pasajero_id;

    if (!finalPasajeroId && pasajero) {
      // Intentar encontrar existente por documento
      const existing = await db.get(
        'SELECT id FROM pasajero WHERE tipo_documento = ? AND numero_documento = ?',
        [pasajero.tipo_documento, pasajero.numero_documento]
      );

      if (existing) {
        finalPasajeroId = existing.id;
      } else {
        const insertResult = await db.run(
          `INSERT INTO pasajero (nombre_completo, tipo_documento, numero_documento, telefono, correo)
           VALUES (?, ?, ?, ?, ?)`,
          [
            pasajero.nombre_completo,
            pasajero.tipo_documento,
            pasajero.numero_documento,
            pasajero.telefono || null,
            pasajero.correo || null,
          ]
        );
        finalPasajeroId = insertResult.lastID;
      }
    }

    if (!finalPasajeroId) {
      const err = new Error('Debe proporcionar pasajero_id o datos del pasajero');
      err.statusCode = 400;
      throw err;
    }

    // ══════════════════════════════════════════════════════════════════
    // ── 4. BLOQUEO OPTIMISTA (HU-014) — La operación crítica ──
    //
    //   UPDATE asiento
    //   SET estado = 'ocupado', pasajero_id = ?, version = version + 1
    //   WHERE id = ? AND version = ?
    //
    //   Si changes === 0 → la versión no coincide → CONFLICTO.
    //   Otro vendedor modificó el asiento entre la lectura y la escritura.
    // ══════════════════════════════════════════════════════════════════
    const lockResult = await db.run(
      `UPDATE asiento
       SET estado = 'ocupado', pasajero_id = ?, version = version + 1
       WHERE id = ? AND version = ?`,
      [finalPasajeroId, asiento_id, version_asiento]
    );

    if (lockResult.changes === 0) {
      // ⚠️ CONCURRENCIA: la versión no coincide
      const err = new Error(
        'Conflicto de concurrencia: el asiento fue modificado por otro vendedor. ' +
        'Recargue el mapa de asientos e intente de nuevo.'
      );
      err.statusCode = 409;
      throw err;
    }

    // ── 5. Insertar boleto ──
    const codigoUnico = generarCodigoUnico();
    const boletoResult = await db.run(
      `INSERT INTO boleto (codigo_unico, viaje_id, asiento_id, pasajero_id,
       ciudad_subida_id, ciudad_bajada_id, tarifa_pagada)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [codigoUnico, viaje_id, asiento_id, finalPasajeroId,
       ciudad_subida_id, ciudad_bajada_id, tarifa_pagada]
    );

    // ── 6. Insertar pago ──
    const numeroComprobante = generarNumeroComprobante();
    const pagoResult = await db.run(
      `INSERT INTO pago (boleto_id, monto, metodo_pago, numero_comprobante, vendedor_id)
       VALUES (?, ?, ?, ?, ?)`,
      [boletoResult.lastID, tarifa_pagada, metodo_pago, numeroComprobante, vendedor_id]
    );

    // ── 7. Devolver resultado completo ──
    const boleto     = await db.get('SELECT * FROM boleto  WHERE id = ?', [boletoResult.lastID]);
    const pago       = await db.get('SELECT * FROM pago    WHERE id = ?', [pagoResult.lastID]);
    const asientoUpd = await db.get('SELECT * FROM asiento WHERE id = ?', [asiento_id]);

    return { boleto, pago, asiento: asientoUpd };
  },
};

module.exports = boletoRepository;
