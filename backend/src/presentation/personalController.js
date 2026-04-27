// ============================================================================
// personalController.js — Controlador REST para Personal
// Respeta: openapi.yaml → /personal  (200, 201, 404)
// NOTA: password_hash NUNCA se devuelve en respuestas (manejado por repo).
//       El campo "password" del request se hashea con crypto (placeholder
//       hasta que se instale bcrypt/argon2 en fases futuras).
// ============================================================================

const crypto = require('crypto');
const repo   = require('../repositories/personalRepository');

// Placeholder hash (SHA-256). Sustituir por bcrypt en fase de seguridad.
function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

const personalController = {

  // GET /api/personal?tipo= → 200
  async listar(req, res) {
    try {
      const personal = await repo.findAll(req.query.tipo);
      res.json(personal);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/personal/:id → 200 | 404
  async obtener(req, res) {
    try {
      const p = await repo.findById(req.params.id);
      if (!p) return res.status(404).json({ error: 'Personal no encontrado' });
      res.json(p);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/personal → 201
  async crear(req, res) {
    try {
      const { nombre_completo, documento_identidad, tipo_personal, licencia_conducir, password } = req.body;
      if (!nombre_completo || !documento_identidad || !tipo_personal || !password) {
        return res.status(400).json({ error: 'Campos requeridos: nombre_completo, documento_identidad, tipo_personal, password' });
      }
      const password_hash = hashPassword(password);
      const p = await repo.create({ nombre_completo, documento_identidad, tipo_personal, licencia_conducir, password_hash });
      res.status(201).json(p);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Personal duplicado (documento de identidad ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/personal/:id → 200 | 404
  async actualizar(req, res) {
    try {
      const existing = await repo.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Personal no encontrado' });

      const fields = { ...req.body };
      // Si se envía password, hashear; nunca guardar en plano
      if (fields.password) {
        fields.password_hash = hashPassword(fields.password);
        delete fields.password;
      }
      const p = await repo.update(req.params.id, fields);
      res.json(p);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Personal duplicado (documento de identidad ya existe)' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/personal/:id → 204 | 404
  async eliminar(req, res) {
    try {
      const changes = await repo.remove(req.params.id);
      if (changes === 0) return res.status(404).json({ error: 'Personal no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = personalController;
