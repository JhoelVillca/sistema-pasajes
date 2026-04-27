// ============================================================================
// tipoRepository.js — Acceso a datos para la entidad Tipo (de bus)
// ============================================================================

const db = require('../models/db');

const tipoRepository = {

  async findAll() {
    return db.all('SELECT * FROM tipo ORDER BY nombre');
  },

  async findById(id) {
    return db.get('SELECT * FROM tipo WHERE id = ?', [id]);
  },

  async create({ nombre, capacidad, pisos }) {
    const result = await db.run(
      'INSERT INTO tipo (nombre, capacidad, pisos) VALUES (?, ?, ?)',
      [nombre, capacidad, pisos]
    );
    return db.get('SELECT * FROM tipo WHERE id = ?', [result.lastID]);
  },

  async update(id, { nombre, capacidad, pisos }) {
    await db.run(
      'UPDATE tipo SET nombre = ?, capacidad = ?, pisos = ? WHERE id = ?',
      [nombre, capacidad, pisos, id]
    );
    return db.get('SELECT * FROM tipo WHERE id = ?', [id]);
  },

  async remove(id) {
    const result = await db.run('DELETE FROM tipo WHERE id = ?', [id]);
    return result.changes;
  },
};

module.exports = tipoRepository;
