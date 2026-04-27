# Backend — Sistema de Venta de Pasajes

API REST para la **Flota Mariscal Santa Cruz**. Implementa las Etapas 1 (Catálogos) y 2 (Programación de Viajes) del documento `spec.md`.

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework HTTP | Express 5 |
| Base de datos | SQLite 3 (vía `sqlite3`) |
| CORS | `cors` |
| Variables de entorno | `dotenv` |
| Dev reload | `nodemon` |

---

## Estructura del Proyecto

```
backend/
├── database/
│   └── schema.sql              ← DDL completo (13 tablas)
├── src/
│   ├── app.js                  ← Configuración Express + middlewares
│   ├── models/
│   │   └── db.js               ← Singleton SQLite + helpers async
│   ├── repositories/           ← Capa de acceso a datos
│   │   ├── ciudadRepository.js
│   │   ├── rutaRepository.js
│   │   ├── tipoRepository.js
│   │   ├── busRepository.js
│   │   ├── personalRepository.js
│   │   └── viajeRepository.js
│   └── presentation/           ← Controladores REST + router
│       ├── ciudadController.js
│       ├── rutaController.js
│       ├── tipoController.js
│       ├── busController.js
│       ├── personalController.js
│       ├── viajeController.js
│       └── routes.js           ← Router centralizado
├── server.js                   ← Punto de entrada
├── openapi.yaml                ← Contrato OpenAPI 3.0
├── package.json
├── .env
└── .env.example
```

---

## Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (copiar y editar)
cp .env.example .env
```

### Variables de entorno (`.env`)

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor HTTP | `3000` |
| `DB_PATH` | Ruta al archivo SQLite | `./data/boletaje.sqlite` |
| `JWT_SECRET` | Secreto para JWT (futuro) | — |

---

## Ejecución

```bash
# Producción
npm start

# Desarrollo (con hot-reload)
npm run dev
```

Al iniciar, el servidor:
1. Crea el directorio `data/` si no existe.
2. Abre/crea la base de datos SQLite en `DB_PATH`.
3. Ejecuta `database/schema.sql` (tablas con `IF NOT EXISTS`).
4. Escucha en `http://localhost:{PORT}`.

---

## API — Endpoints Implementados

Todos los endpoints están bajo el prefijo `/api`. El contrato formal está en `openapi.yaml`.

### Ciudades (HU-001)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/ciudades` | 200 | Listar todas las ciudades |
| `POST` | `/api/ciudades` | 201 / 409 | Crear ciudad (409 si duplicada) |
| `GET` | `/api/ciudades/:id` | 200 / 404 | Obtener ciudad por ID |
| `PUT` | `/api/ciudades/:id` | 200 / 404 | Actualizar ciudad |
| `DELETE` | `/api/ciudades/:id` | 204 / 404 | Soft-delete (estado → inactivo) |

### Rutas (HU-002)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/rutas` | 200 | Listar rutas |
| `POST` | `/api/rutas` | 201 | Crear ruta con paradas intermedias |
| `GET` | `/api/rutas/:id` | 200 / 404 | Obtener ruta + paradas (RutaDetalle) |
| `PUT` | `/api/rutas/:id` | 200 / 404 | Actualizar ruta (reemplaza paradas) |
| `DELETE` | `/api/rutas/:id` | 204 / 404 | Eliminar ruta y sus paradas |

### Tipos de Bus

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/tipos` | 200 | Listar tipos de bus |
| `POST` | `/api/tipos` | 201 | Crear tipo |
| `GET` | `/api/tipos/:id` | 200 / 404 | Obtener tipo por ID |
| `PUT` | `/api/tipos/:id` | 200 / 404 | Actualizar tipo |
| `DELETE` | `/api/tipos/:id` | 204 / 404 | Eliminar tipo |

### Buses (HU-003)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/buses` | 200 | Listar buses de la flota |
| `POST` | `/api/buses` | 201 | Registrar un bus |
| `GET` | `/api/buses/:id` | 200 / 404 | Obtener bus por ID |
| `PUT` | `/api/buses/:id` | 200 / 404 | Actualizar bus |
| `DELETE` | `/api/buses/:id` | 204 / 404 | Soft-delete (estado → baja) |

### Personal (HU-004)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/personal?tipo=` | 200 | Listar personal (filtro opcional) |
| `POST` | `/api/personal` | 201 | Registrar personal (hashea password) |
| `GET` | `/api/personal/:id` | 200 / 404 | Obtener personal (sin password_hash) |
| `PUT` | `/api/personal/:id` | 200 / 404 | Actualizar (re-hashea si envía password) |
| `DELETE` | `/api/personal/:id` | 204 / 404 | Soft-delete (estado → inactivo) |

### Viajes (HU-005, HU-006, HU-007)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `GET` | `/api/viajes?estado=&fecha=` | 200 | Listar viajes (filtros opcionales) |
| `POST` | `/api/viajes` | 201 / 409 | Crear viaje + generar asientos automáticamente |
| `GET` | `/api/viajes/:id` | 200 / 404 | Obtener viaje con mapa de asientos |
| `PATCH` | `/api/viajes/:id/publicar` | 200 / 404 / 422 | Publicar viaje (programado → en_venta) |
| `GET` | `/api/viajes/:id/asientos` | 200 / 404 | Listar asientos del viaje |

---

## Arquitectura por Capas

```
                    ┌──────────────────┐
    HTTP Request →  │   routes.js      │  Enrutamiento
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │  *Controller.js  │  Validación + Status codes
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │ *Repository.js   │  SQL + Acceso a datos
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │    db.js         │  Singleton SQLite (async)
                    └──────────────────┘
```

- **Presentation** (`routes.js` + `*Controller.js`): Parsea requests, valida campos requeridos, devuelve los códigos HTTP exactos del contrato OpenAPI.
- **Repositories** (`*Repository.js`): Encapsulan todo el SQL. Usan los helpers `db.run()`, `db.all()`, `db.get()`.
- **Models** (`db.js`): Singleton con promisificación de `sqlite3`. Aplica `schema.sql` al iniciar.

---

## Decisiones de Diseño

### Campos monetarios
Todos los campos de dinero (`tarifa_base`, `tarifa_pagada`, `monto`) usan `NUMERIC(10,2)` en SQLite. **Nunca** se usa `REAL` ni `FLOAT` (IEEE 754 introduce errores de precisión).

### Bloqueo optimista
La tabla `asiento` incluye `version INTEGER DEFAULT 1`. Cada operación de compra (futuras etapas) debe usar:
```sql
UPDATE asiento SET estado = ?, version = version + 1
WHERE id = ? AND version = ?
```
Si `changes === 0`, hay conflicto de concurrencia.

### Seguridad de contraseñas
- Las contraseñas se hashean antes de almacenar (actualmente SHA-256 como placeholder; migrar a bcrypt/argon2 en fase de seguridad).
- `password_hash` **nunca** se incluye en respuestas JSON.

### Soft-delete
Las entidades Ciudad, Bus y Personal usan soft-delete (cambio de estado) en lugar de eliminación física, preservando integridad referencial.

### Generación automática de asientos (HU-006)
Al crear un viaje (`POST /api/viajes`), el sistema:
1. Busca el `Tipo` del bus asignado.
2. Genera `capacidad` asientos distribuidos en `pisos` pisos con layout 2+2 (4 columnas).
3. Cada asiento inicia con `estado: 'disponible'` y `version: 1`.

---

## Formato de Errores

Todos los errores siguen el schema del contrato OpenAPI:

```json
{ "error": "Mensaje descriptivo del error" }
```

---

## Health Check

```
GET /health → { "status": "ok", "timestamp": "2026-04-27T03:30:00.000Z" }
```
