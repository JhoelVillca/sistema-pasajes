// ============================================================================
// viajeRepository.js — Acceso a datos para Viaje + Asiento
// ============================================================================

const db = require('../models/db');

const viajeRepository = {

  async findAll({ estado, fecha } = {}) {
    let sql = 'SELECT * FROM viaje WHERE 1=1';
    const params = [];
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }
    if (fecha)  { sql += ' AND fecha_salida = ?'; params.push(fecha); }
    sql += ' ORDER BY fecha_salida, hora_salida';
    return db.all(sql, params);
  },

  async findById(id) {
    return db.get('SELECT * FROM viaje WHERE id = ?', [id]);
  },

  async findAsientos(viajeId) {
    return db.all('SELECT * FROM asiento WHERE viaje_id = ? ORDER BY piso, fila, columna', [viajeId]);
  },

  async busOcupadoEnHorario(busId, fechaSalida, horaSalida) {
    return db.get(
      `SELECT id FROM viaje
       WHERE bus_id = ? AND fecha_salida = ? AND hora_salida = ?
       AND estado NOT IN ('completado', 'cancelado')`,
      [busId, fechaSalida, horaSalida]
    );
  },

  async create({ ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base }) {
    const result = await db.run(
      `INSERT INTO viaje (ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ruta_id, bus_id, chofer_id, ayudante_id, fecha_salida, hora_salida, tarifa_base]
    );
    return db.get('SELECT * FROM viaje WHERE id = ?', [result.lastID]);
  },

  async generarAsientos(viajeId, capacidad, pisos) {
    const asientosPorPiso = Math.ceil(capacidad / pisos);
    const columnas = 4; // Distribución estándar: 2+2
    let numero = 1;

    for (let piso = 1; piso <= pisos; piso++) {
      const filas = Math.ceil(asientosPorPiso / columnas);
      for (let fila = 1; fila <= filas && numero <= capacidad; fila++) {
        for (let col = 1; col <= columnas && numero <= capacidad; col++) {
          await db.run(
            `INSERT INTO asiento (viaje_id, numero_asiento, fila, columna, piso)
             VALUES (?, ?, ?, ?, ?)`,
            [viajeId, String(numero), fila, col, piso]
          );
          numero++;
        }
      }
    }
  },

  async publicar(id) {
    await db.run(
      "UPDATE viaje SET estado = 'en_venta' WHERE id = ? AND estado = 'programado'",
      [id]
    );
    return db.get('SELECT * FROM viaje WHERE id = ?', [id]);
  },
};

module.exports = viajeRepository;
