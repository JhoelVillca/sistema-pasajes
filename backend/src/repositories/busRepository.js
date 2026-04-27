// ============================================================================
// busRepository.js — Acceso a datos para la entidad Bus
// ============================================================================

const db = require('../models/db');

const busRepository = {

  async findAll() {
    return db.all('SELECT * FROM bus ORDER BY numero_unidad');
  },

  async findById(id) {
    return db.get('SELECT * FROM bus WHERE id = ?', [id]);
  },

  async create({ placa, numero_unidad, tipo_id, estado }) {
    const result = await db.run(
      'INSERT INTO bus (placa, numero_unidad, tipo_id, estado) VALUES (?, ?, ?, ?)',
      [placa, numero_unidad, tipo_id, estado || 'activo']
    );
    return db.get('SELECT * FROM bus WHERE id = ?', [result.lastID]);
  },

  async update(id, { placa, numero_unidad, tipo_id, estado }) {
    await db.run(
      'UPDATE bus SET placa = ?, numero_unidad = ?, tipo_id = ?, estado = ? WHERE id = ?',
      [placa, numero_unidad, tipo_id, estado || 'activo', id]
    );
    return db.get('SELECT * FROM bus WHERE id = ?', [id]);
  },

  async remove(id) {
    const result = await db.run(
      "UPDATE bus SET estado = 'baja' WHERE id = ?",
      [id]
    );
    return result.changes;
  },
};

module.exports = busRepository;
