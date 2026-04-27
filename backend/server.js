// ============================================================================
// server.js — Punto de entrada: inicializa BD y arranca Express
// ============================================================================

const { initializeDatabase, closeDatabase } = require('./src/models/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await initializeDatabase();
    console.log('[Server] Base de datos lista.');

    const server = app.listen(PORT, () => {
      console.log(`[Server] Escuchando en http://localhost:${PORT}`);
    });

    // Shutdown graceful
    const shutdown = async (signal) => {
      console.log(`\n[Server] ${signal} recibido. Cerrando…`);
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('[Server] Error fatal:', err.message);
    process.exit(1);
  }
}

main();
