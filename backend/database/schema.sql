-- ============================================================================
-- Sistema de Venta de Pasajes — Flota Mariscal Santa Cruz
-- DDL Script para SQLite  (Fuente de verdad: spec.md §3.2)
-- ============================================================================
-- CONVENCIONES:
--   • Campos monetarios → NUMERIC(10,2)  (afinidad NUMERIC de SQLite).
--     NUNCA se usa REAL ni FLOAT para dinero.
--   • Bloqueo optimista   → Asiento.version INTEGER DEFAULT 1.
--   • Nombres de columna  → snake_case fieles al UML.
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ======================== CATÁLOGOS MAESTROS ================================

-- CIUDAD
CREATE TABLE IF NOT EXISTS ciudad (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT    NOT NULL UNIQUE,
    codigo          TEXT    NOT NULL UNIQUE,
    region          TEXT    NOT NULL,
    estado          TEXT    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- RUTA
CREATE TABLE IF NOT EXISTS ruta (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre              TEXT    NOT NULL,
    ciudad_origen_id    INTEGER NOT NULL,
    ciudad_destino_id   INTEGER NOT NULL,
    distancia_km        INTEGER NOT NULL DEFAULT 0,
    tiempo_estimado     INTEGER NOT NULL DEFAULT 0,   -- minutos
    estado              TEXT    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo')),

    FOREIGN KEY (ciudad_origen_id)  REFERENCES ciudad(id),
    FOREIGN KEY (ciudad_destino_id) REFERENCES ciudad(id),
    CHECK (ciudad_origen_id <> ciudad_destino_id)
);

-- PARADA_INTERMEDIA
CREATE TABLE IF NOT EXISTS parada_intermedia (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    ruta_id                 INTEGER NOT NULL,
    ciudad_id               INTEGER NOT NULL,
    orden                   INTEGER NOT NULL,
    distancia_acumulada     INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (ruta_id)   REFERENCES ruta(id),
    FOREIGN KEY (ciudad_id) REFERENCES ciudad(id),
    UNIQUE (ruta_id, orden)
);

-- ==================== RECURSOS FÍSICOS Y TIPOS =============================

-- TIPO  (configuración de bus)
CREATE TABLE IF NOT EXISTS tipo (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL UNIQUE,
    capacidad   INTEGER NOT NULL CHECK (capacidad > 0),
    pisos       INTEGER NOT NULL DEFAULT 1 CHECK (pisos >= 1)
);

-- BUS
CREATE TABLE IF NOT EXISTS bus (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    placa           TEXT    NOT NULL UNIQUE,
    numero_unidad   TEXT    NOT NULL UNIQUE,
    tipo_id         INTEGER NOT NULL,
    estado          TEXT    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'mantenimiento', 'baja')),
    fecha_registro  TEXT    NOT NULL DEFAULT (DATE('now')),

    FOREIGN KEY (tipo_id) REFERENCES tipo(id)
);

-- PERSONAL
CREATE TABLE IF NOT EXISTS personal (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo         TEXT    NOT NULL,
    documento_identidad     TEXT    NOT NULL UNIQUE,
    tipo_personal           TEXT    NOT NULL
        CHECK (tipo_personal IN ('chofer', 'ayudante', 'administrativo')),
    licencia_conducir       TEXT,               -- nullable
    password_hash           TEXT    NOT NULL,    -- bcrypt / argon2
    estado                  TEXT    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo', 'licencia_suspendida')),
    fecha_registro          TEXT    NOT NULL DEFAULT (DATE('now'))
);

-- =================== PROGRAMACIÓN DE EVENTOS (VIAJES) ======================

-- VIAJE
CREATE TABLE IF NOT EXISTS viaje (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ruta_id         INTEGER NOT NULL,
    bus_id          INTEGER NOT NULL,
    chofer_id       INTEGER NOT NULL,
    ayudante_id     INTEGER NOT NULL,
    fecha_salida    TEXT    NOT NULL,                -- ISO-8601 date
    hora_salida     TEXT    NOT NULL,                -- HH:MM
    estado          TEXT    NOT NULL DEFAULT 'programado'
        CHECK (estado IN ('programado', 'en_venta', 'en_ruta', 'completado', 'cancelado')),
    tarifa_base     NUMERIC(10,2) NOT NULL DEFAULT 0,   -- ¡NUNCA REAL/FLOAT!
    fecha_creacion  TEXT    NOT NULL DEFAULT (DATETIME('now')),

    FOREIGN KEY (ruta_id)       REFERENCES ruta(id),
    FOREIGN KEY (bus_id)        REFERENCES bus(id),
    FOREIGN KEY (chofer_id)     REFERENCES personal(id),
    FOREIGN KEY (ayudante_id)   REFERENCES personal(id),
    CHECK (chofer_id <> ayudante_id)
);

-- ASIENTO  (con Bloqueo Optimista: version)
CREATE TABLE IF NOT EXISTS asiento (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    viaje_id        INTEGER NOT NULL,
    numero_asiento  TEXT    NOT NULL,
    fila            INTEGER NOT NULL,
    columna         INTEGER NOT NULL,
    piso            INTEGER NOT NULL DEFAULT 1,
    estado          TEXT    NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'en_proceso', 'ocupado', 'no_show')),
    pasajero_id     INTEGER,                        -- nullable
    version         INTEGER NOT NULL DEFAULT 1,     -- OPTIMISTIC LOCKING ✓

    FOREIGN KEY (viaje_id)    REFERENCES viaje(id),
    FOREIGN KEY (pasajero_id) REFERENCES pasajero(id),
    UNIQUE (viaje_id, fila, columna, piso)
);

-- =================== TRANSACCIONES COMERCIALES =============================

-- PASAJERO
CREATE TABLE IF NOT EXISTS pasajero (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo     TEXT    NOT NULL,
    tipo_documento      TEXT    NOT NULL,
    numero_documento    TEXT    NOT NULL,
    telefono            TEXT,
    correo              TEXT,
    fecha_registro      TEXT    NOT NULL DEFAULT (DATE('now')),

    UNIQUE (tipo_documento, numero_documento)
);

-- BOLETO
CREATE TABLE IF NOT EXISTS boleto (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_unico        TEXT    NOT NULL UNIQUE,
    viaje_id            INTEGER NOT NULL,
    asiento_id          INTEGER NOT NULL,
    pasajero_id         INTEGER NOT NULL,
    ciudad_subida_id    INTEGER NOT NULL,
    ciudad_bajada_id    INTEGER NOT NULL,
    tarifa_pagada       NUMERIC(10,2) NOT NULL,         -- ¡NUNCA REAL/FLOAT!
    fecha_emision       TEXT    NOT NULL DEFAULT (DATETIME('now')),
    estado              TEXT    NOT NULL DEFAULT 'emitido'
        CHECK (estado IN ('emitido', 'anulado', 'usado')),

    FOREIGN KEY (viaje_id)          REFERENCES viaje(id),
    FOREIGN KEY (asiento_id)        REFERENCES asiento(id),
    FOREIGN KEY (pasajero_id)       REFERENCES pasajero(id),
    FOREIGN KEY (ciudad_subida_id)  REFERENCES ciudad(id),
    FOREIGN KEY (ciudad_bajada_id)  REFERENCES ciudad(id)
);

-- PAGO
CREATE TABLE IF NOT EXISTS pago (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    boleto_id           INTEGER NOT NULL,
    monto               NUMERIC(10,2) NOT NULL,         -- ¡NUNCA REAL/FLOAT!
    metodo_pago         TEXT    NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    numero_comprobante  TEXT    NOT NULL UNIQUE,
    fecha_pago          TEXT    NOT NULL DEFAULT (DATETIME('now')),
    vendedor_id         INTEGER NOT NULL,

    FOREIGN KEY (boleto_id)     REFERENCES boleto(id),
    FOREIGN KEY (vendedor_id)   REFERENCES personal(id)
);

-- DESPACHO
CREATE TABLE IF NOT EXISTS despacho (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    viaje_id            INTEGER NOT NULL UNIQUE,
    despachador_id      INTEGER NOT NULL,
    fecha_despacho      TEXT    NOT NULL DEFAULT (DATETIME('now')),
    estado              TEXT    NOT NULL DEFAULT 'iniciado'
        CHECK (estado IN ('iniciado', 'tripulacion_validada', 'pasajeros_validados', 'despachado')),
    observaciones       TEXT,

    FOREIGN KEY (viaje_id)          REFERENCES viaje(id),
    FOREIGN KEY (despachador_id)    REFERENCES personal(id)
);

-- DESPACHO_PASAJERO  (Validación de presencia)
CREATE TABLE IF NOT EXISTS despacho_pasajero (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    despacho_id         INTEGER NOT NULL,
    boleto_id           INTEGER NOT NULL,
    estado_presencia    TEXT    NOT NULL DEFAULT 'ausente'
        CHECK (estado_presencia IN ('presente', 'ausente', 'no_show')),
    hora_validacion     TEXT,

    FOREIGN KEY (despacho_id) REFERENCES despacho(id),
    FOREIGN KEY (boleto_id)   REFERENCES boleto(id),
    UNIQUE (despacho_id, boleto_id)
);

-- ========================== ÍNDICES ========================================

CREATE INDEX IF NOT EXISTS idx_ruta_origen        ON ruta(ciudad_origen_id);
CREATE INDEX IF NOT EXISTS idx_ruta_destino       ON ruta(ciudad_destino_id);
CREATE INDEX IF NOT EXISTS idx_parada_ruta        ON parada_intermedia(ruta_id);
CREATE INDEX IF NOT EXISTS idx_bus_tipo           ON bus(tipo_id);
CREATE INDEX IF NOT EXISTS idx_viaje_ruta         ON viaje(ruta_id);
CREATE INDEX IF NOT EXISTS idx_viaje_bus          ON viaje(bus_id);
CREATE INDEX IF NOT EXISTS idx_viaje_fecha        ON viaje(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_viaje_estado       ON viaje(estado);
CREATE INDEX IF NOT EXISTS idx_asiento_viaje      ON asiento(viaje_id);
CREATE INDEX IF NOT EXISTS idx_asiento_estado     ON asiento(estado);
CREATE INDEX IF NOT EXISTS idx_boleto_viaje       ON boleto(viaje_id);
CREATE INDEX IF NOT EXISTS idx_boleto_pasajero    ON boleto(pasajero_id);
CREATE INDEX IF NOT EXISTS idx_pago_boleto        ON pago(boleto_id);
CREATE INDEX IF NOT EXISTS idx_despacho_viaje     ON despacho(viaje_id);
