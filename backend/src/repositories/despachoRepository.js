// ============================================================================
// despachoRepository.js — Etapa 5 (Despacho y Abordaje)
// Maneja la creación del despacho y validación de boletos.
// ============================================================================

const db = require('../models/db');

class DespachoRepository {
  /**
   * Obtiene todos los boletos vendidos de un viaje con sus datos de pasajero y asiento.
   */
  async getBoletosPorViaje(viajeId) {
    const sql = `
      SELECT 
        b.id,
        b.codigo_unico,
        b.asiento_id,
        a.numero_asiento,
        p.nombre_completo AS nombre_pasajero,
        p.numero_documento
      FROM boleto b
      JOIN asiento a ON b.asiento_id = a.id
      JOIN pasajero p ON b.pasajero_id = p.id
      WHERE b.viaje_id = ? AND b.estado = 'emitido'
      ORDER BY a.numero_asiento ASC
    `;
    return await db.all(sql, [viajeId]);
  }

  /**
   * Crea un despacho y automáticamente inserta todos los boletos del viaje
   * en despacho_pasajero como 'ausente'.
   * TODO SE HACE EN UNA TRANSACCIÓN.
   */
  async crearDespacho(payload) {
    // 1. Iniciar transacción simulada manualmente (SQLite Node simple sin pool completo)
    await db.run('BEGIN TRANSACTION');

    try {
      // 2. Insertar Despacho
      const sqlInsertDespacho = `
        INSERT INTO despacho (viaje_id, despachador_id, estado)
        VALUES (?, ?, 'iniciado')
      `;
      const result = await db.run(sqlInsertDespacho, [
        payload.viaje_id,
        payload.despachador_id
      ]);
      const despachoId = result.lastID;

      // 3. Obtener boletos emitidos
      const boletos = await this.getBoletosPorViaje(payload.viaje_id);

      // 4. Insertar boletos en despacho_pasajero
      if (boletos.length > 0) {
        const sqlInsertPasajero = `
          INSERT INTO despacho_pasajero (despacho_id, boleto_id, estado_presencia)
          VALUES (?, ?, 'ausente')
        `;
        // Insertamos uno a uno porque node-sqlite3 no soporta bulk insert fácilmente
        // sin construir la query gigante.
        for (const boleto of boletos) {
          await db.run(sqlInsertPasajero, [despachoId, boleto.id]);
        }
      }

      await db.run('COMMIT');

      // Obtener el registro insertado
      return await db.get('SELECT * FROM despacho WHERE id = ?', [despachoId]);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Actualiza el estado_presencia de un boleto específico dentro de un despacho
   */
  async actualizarPresencia(despachoId, boletoId, estadoPresencia) {
    const sql = `
      UPDATE despacho_pasajero 
      SET estado_presencia = ?, hora_validacion = DATETIME('now')
      WHERE despacho_id = ? AND boleto_id = ?
    `;
    const result = await db.run(sql, [estadoPresencia, despachoId, boletoId]);
    
    if (result.changes === 0) {
      throw new Error('No se encontró el registro despacho_pasajero');
    }

    return await db.get(
      'SELECT * FROM despacho_pasajero WHERE despacho_id = ? AND boleto_id = ?',
      [despachoId, boletoId]
    );
  }

  /**
   * Finaliza el despacho y cambia el viaje a 'en_ruta'
   */
  async finalizarDespacho(despachoId) {
    await db.run('BEGIN TRANSACTION');
    try {
      // 1. Marcar despacho como finalizado
      const sqlUpdateDespacho = `
        UPDATE despacho 
        SET estado = 'despachado' 
        WHERE id = ? AND estado != 'despachado'
      `;
      const resDespacho = await db.run(sqlUpdateDespacho, [despachoId]);
      if (resDespacho.changes === 0) {
         throw new Error('Despacho no encontrado o ya finalizado');
      }

      // 2. Obtener viaje_id
      const despacho = await db.get('SELECT * FROM despacho WHERE id = ?', [despachoId]);

      // 3. Cambiar estado del viaje a 'en_ruta'
      const sqlUpdateViaje = `
        UPDATE viaje 
        SET estado = 'en_ruta' 
        WHERE id = ? AND estado != 'en_ruta'
      `;
      await db.run(sqlUpdateViaje, [despacho.viaje_id]);

      await db.run('COMMIT');
      return despacho;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}

module.exports = new DespachoRepository();
