// ============================================================================
// ciudadRepository.js — Acceso a datos para la entidad Ciudad
// ============================================================================

const db = require('../models/db');

const ciudadRepository = {

  async findAll() {
    return db.all('SELECT * FROM ciudad ORDER BY nombre');
  },

  async findById(id) {
    return db.get('SELECT * FROM ciudad WHERE id = ?', [id]);
  },

  async create({ nombre, codigo, region, estado }) {
    const result = await db.run(
      'INSERT INTO ciudad (nombre, codigo, region, estado) VALUES (?, ?, ?, ?)',
      [nombre, codigo, region, estado || 'activo']
    );
    return db.get('SELECT * FROM ciudad WHERE id = ?', [result.lastID]);
  },

  async update(id, { nombre, codigo, region, estado }) {
    if (estado) {
      await db.run(
        'UPDATE ciudad SET nombre = ?, codigo = ?, region = ?, estado = ? WHERE id = ?',
        [nombre, codigo, region, estado, id]
      );
    } else {
      await db.run(
        'UPDATE ciudad SET nombre = ?, codigo = ?, region = ? WHERE id = ?',
        [nombre, codigo, region, id]
      );
    }
    return db.get('SELECT * FROM ciudad WHERE id = ?', [id]);
  },

  async remove(id) {
    const result = await db.run(
      "UPDATE ciudad SET estado = 'inactivo' WHERE id = ?",
      [id]
    );
    return result.changes;
  },
};

module.exports = ciudadRepository;
