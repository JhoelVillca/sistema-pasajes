// ============================================================================
// app.js — Configuración de la aplicación Express
// ============================================================================

const express = require('express');
const cors    = require('cors');
const routes  = require('./presentation/routes');

const app = express();

// ── Middlewares globales ──
app.use(cors());
app.use(express.json());

// ── API routes bajo /api ──
app.use('/api', routes);

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 catch-all ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

module.exports = app;
