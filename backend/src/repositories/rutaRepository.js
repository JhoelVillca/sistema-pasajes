// ============================================================================
// rutaRepository.js — Acceso a datos para Ruta + ParadaIntermedia
// ============================================================================

const db = require('../models/db');

const rutaRepository = {

  async findAll() {
    return db.all('SELECT * FROM ruta ORDER BY nombre');
  },

  async findById(id) {
    return db.get('SELECT * FROM ruta WHERE id = ?', [id]);
  },

  async findParadas(rutaId) {
    return db.all(
      `SELECT pi.*, c.nombre AS ciudad_nombre
       FROM parada_intermedia pi
       JOIN ciudad c ON c.id = pi.ciudad_id
       WHERE pi.ruta_id = ?
       ORDER BY pi.orden`,
      [rutaId]
    );
  },

  async create({ nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas }) {
    const result = await db.run(
      `INSERT INTO ruta (nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, ciudad_origen_id, ciudad_destino_id, distancia_km || 0, tiempo_estimado || 0]
    );
    const rutaId = result.lastID;

    if (Array.isArray(paradas)) {
      for (const p of paradas) {
        await db.run(
          `INSERT INTO parada_intermedia (ruta_id, ciudad_id, orden, distancia_acumulada)
           VALUES (?, ?, ?, ?)`,
          [rutaId, p.ciudad_id, p.orden, p.distancia_acumulada || 0]
        );
      }
    }

    return db.get('SELECT * FROM ruta WHERE id = ?', [rutaId]);
  },

  async update(id, { nombre, ciudad_origen_id, ciudad_destino_id, distancia_km, tiempo_estimado, paradas }) {
    await db.run(
      `UPDATE ruta SET nombre = ?, ciudad_origen_id = ?, ciudad_destino_id = ?,
       distancia_km = ?, tiempo_estimado = ? WHERE id = ?`,
      [nombre, ciudad_origen_id, ciudad_destino_id, distancia_km || 0, tiempo_estimado || 0, id]
    );

    // Reemplazar paradas si se envían
    if (Array.isArray(paradas)) {
      await db.run('DELETE FROM parada_intermedia WHERE ruta_id = ?', [id]);
      for (const p of paradas) {
        await db.run(
          `INSERT INTO parada_intermedia (ruta_id, ciudad_id, orden, distancia_acumulada)
           VALUES (?, ?, ?, ?)`,
          [id, p.ciudad_id, p.orden, p.distancia_acumulada || 0]
        );
      }
    }

    return db.get('SELECT * FROM ruta WHERE id = ?', [id]);
  },

  async remove(id) {
    // Eliminar paradas primero, luego la ruta
    await db.run('DELETE FROM parada_intermedia WHERE ruta_id = ?', [id]);
    const result = await db.run('DELETE FROM ruta WHERE id = ?', [id]);
    return result.changes;
  },
};

module.exports = rutaRepository;
