const path = require('path');
const fs   = require('fs');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_PATH    = process.env.DB_PATH || './data/boletaje.sqlite';
const SCHEMA_SQL = path.resolve(__dirname, '../../database/schema.sql');

// Asegurar que el directorio de la BD exista
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Helpers: convertir callbacks de sqlite3 a Promesas
function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbExec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Singleton
let dbInstance = null;

async function initializeDatabase() {
  if (dbInstance) return dbInstance;

  const resolvedPath = path.resolve(DB_PATH);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(resolvedPath, (err) => {
      if (err) {
        console.error('[DB] Error al abrir:', err.message);
        return reject(err);
      }
      console.log(`[DB] Conectado → ${resolvedPath}`);
    });

    db.serialize(async () => {
      try {
        await dbRun(db, 'PRAGMA journal_mode = WAL');
        await dbRun(db, 'PRAGMA foreign_keys = ON');

        if (fs.existsSync(SCHEMA_SQL)) {
          const schema = fs.readFileSync(SCHEMA_SQL, 'utf-8');
          await dbExec(db, schema);
          console.log('[DB] Schema aplicado.');
        } else {
          console.warn(`[DB] schema.sql no encontrado: ${SCHEMA_SQL}`);
        }

        dbInstance = db;
        resolve(db);
      } catch (initErr) {
        console.error('[DB] Error init:', initErr.message);
        reject(initErr);
      }
    });
  });
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return resolve();
    dbInstance.close((err) => {
      if (err) return reject(err);
      dbInstance = null;
      console.log('[DB] Conexión cerrada.');
      resolve();
    });
  });
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getDb: () => dbInstance,
  run: (sql, params) => dbRun(dbInstance, sql, params),
  all: (sql, params) => dbAll(dbInstance, sql, params),
  get: (sql, params) => dbGet(dbInstance, sql, params),
  exec: (sql)        => dbExec(dbInstance, sql),
};
