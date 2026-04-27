// ============================================================================
// personalRepository.js — Acceso a datos para la entidad Personal
// ============================================================================

const db = require('../models/db');

// Columnas seguras (NUNCA exponer password_hash)
const SAFE_COLS = `id, nombre_completo, documento_identidad, tipo_personal,
  licencia_conducir, estado, fecha_registro`;

const personalRepository = {

  async findAll(tipoFilter) {
    if (tipoFilter) {
      return db.all(
        `SELECT ${SAFE_COLS} FROM personal WHERE tipo_personal = ? ORDER BY nombre_completo`,
        [tipoFilter]
      );
    }
    return db.all(`SELECT ${SAFE_COLS} FROM personal ORDER BY nombre_completo`);
  },

  async findById(id) {
    return db.get(`SELECT ${SAFE_COLS} FROM personal WHERE id = ?`, [id]);
  },

  async create({ nombre_completo, documento_identidad, tipo_personal, licencia_conducir, password_hash }) {
    const result = await db.run(
      `INSERT INTO personal (nombre_completo, documento_identidad, tipo_personal, licencia_conducir, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre_completo, documento_identidad, tipo_personal, licencia_conducir || null, password_hash]
    );
    return db.get(`SELECT ${SAFE_COLS} FROM personal WHERE id = ?`, [result.lastID]);
  },

  async update(id, fields) {
    const sets = [];
    const params = [];

    if (fields.nombre_completo !== undefined)     { sets.push('nombre_completo = ?');     params.push(fields.nombre_completo); }
    if (fields.documento_identidad !== undefined)  { sets.push('documento_identidad = ?');  params.push(fields.documento_identidad); }
    if (fields.tipo_personal !== undefined)        { sets.push('tipo_personal = ?');        params.push(fields.tipo_personal); }
    if (fields.licencia_conducir !== undefined)    { sets.push('licencia_conducir = ?');    params.push(fields.licencia_conducir); }
    if (fields.estado !== undefined)               { sets.push('estado = ?');               params.push(fields.estado); }
    if (fields.password_hash !== undefined)         { sets.push('password_hash = ?');         params.push(fields.password_hash); }

    if (sets.length === 0) {
      return db.get(`SELECT ${SAFE_COLS} FROM personal WHERE id = ?`, [id]);
    }

    params.push(id);
    await db.run(`UPDATE personal SET ${sets.join(', ')} WHERE id = ?`, params);
    return db.get(`SELECT ${SAFE_COLS} FROM personal WHERE id = ?`, [id]);
  },

  async remove(id) {
    const result = await db.run(
      "UPDATE personal SET estado = 'inactivo' WHERE id = ?",
      [id]
    );
    return result.changes;
  },
};

module.exports = personalRepository;
