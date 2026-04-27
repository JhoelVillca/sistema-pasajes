# Backend — Sistema de Venta de Pasajes

API REST para la **Flota Mariscal Santa Cruz**. Implementa las Etapas 1 (Catálogos), 2 (Programación de Viajes) y 3 (Venta de Pasajes con Bloqueo Optimista) del documento `spec.md`.

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
│   │   ├── viajeRepository.js
│   │   └── boletoRepository.js ← Compra con bloqueo optimista
│   └── presentation/           ← Controladores REST + router
│       ├── ciudadController.js
│       ├── rutaController.js
│       ├── tipoController.js
│       ├── busController.js
│       ├── personalController.js
│       ├── viajeController.js
│       ├── boletoController.js ← POST /boletos (HU-010 a HU-014)
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

### Boletos — Etapa 3 (HU-010 a HU-014)

| Método | Ruta | Status | Descripción |
|---|---|---|---|
| `POST` | `/api/boletos` | 201 / 400 / 404 / 409 | Vender pasaje con bloqueo optimista |

**Request body (`BoletoCreate`):**

```json
{
  "viaje_id": 1,
  "asiento_id": 5,
  "pasajero": {
    "nombre_completo": "Juan Pérez",
    "tipo_documento": "CI",
    "numero_documento": "1234567"
  },
  "ciudad_subida_id": 1,
  "ciudad_bajada_id": 2,
  "tarifa_pagada": "150.00",
  "version_asiento": 1,
  "metodo_pago": "efectivo",
  "vendedor_id": 3
}
```

> **`version_asiento`** es **obligatorio**. Es el valor de `version` que el cliente leyó al consultar `GET /viajes/:id/asientos`. Si otro vendedor modificó el asiento entre la lectura y la compra, el servidor responde **409 Conflict**.

**Respuesta exitosa (201):**

```json
{
  "boleto": { "id": 1, "codigo_unico": "BOL-ABC123", "estado": "emitido", ... },
  "pago":   { "id": 1, "numero_comprobante": "PAG-DEF456", ... },
  "asiento": { "id": 5, "estado": "ocupado", "version": 2, ... }
}
```

**Respuesta de conflicto (409):**

```json
{
  "error": "Conflicto de concurrencia: el asiento fue modificado por otro vendedor. Recargue el mapa de asientos e intente de nuevo."
}
```

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

### Bloqueo Optimista — Concurrencia en Venta de Asientos (HU-014)

La tabla `asiento` incluye `version INTEGER DEFAULT 1`. El proceso de compra en `boletoRepository.js` ejecuta:

```sql
UPDATE asiento
SET estado = 'ocupado', pasajero_id = ?, version = version + 1
WHERE id = ? AND version = ?
```

**Flujo de decisión:**

```
Cliente A lee asiento #5 → version = 1
Cliente B lee asiento #5 → version = 1

Cliente A compra (version_asiento=1) → UPDATE WHERE version=1 → changes=1 ✅
  → asiento.version ahora es 2

Cliente B compra (version_asiento=1) → UPDATE WHERE version=1 → changes=0 ❌
  → 409 Conflict: "el asiento fue modificado por otro vendedor"
```

**Cero filas bloqueadas en base de datos. Máximo rendimiento bajo carga.**

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

---

## Guía: Probar Bloqueo Optimista con cURL / PowerShell

Este ejemplo demuestra cómo dos vendedores intentan comprar el **mismo asiento** simultáneamente.

### Paso 1 — Preparar datos de prueba

```powershell
# Iniciar el servidor
npm start

# Crear datos mínimos (ciudades, ruta, tipo, bus, personal, viaje)
Invoke-RestMethod -Uri http://localhost:3000/api/ciudades -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre":"La Paz","codigo":"LPZ","region":"Altiplano"}'

Invoke-RestMethod -Uri http://localhost:3000/api/ciudades -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre":"Cochabamba","codigo":"CBB","region":"Valles"}'

Invoke-RestMethod -Uri http://localhost:3000/api/rutas -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre":"LP-CBB","ciudad_origen_id":1,"ciudad_destino_id":2,"distancia_km":380,"tiempo_estimado":480}'

Invoke-RestMethod -Uri http://localhost:3000/api/tipos -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre":"Estandar","capacidad":40,"pisos":1}'

Invoke-RestMethod -Uri http://localhost:3000/api/buses -Method POST `
  -ContentType "application/json" `
  -Body '{"placa":"1234-ABC","numero_unidad":"U-001","tipo_id":1}'

Invoke-RestMethod -Uri http://localhost:3000/api/personal -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre_completo":"Chofer","documento_identidad":"C1","tipo_personal":"chofer","licencia_conducir":"B","password":"s1"}'

Invoke-RestMethod -Uri http://localhost:3000/api/personal -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre_completo":"Ayudante","documento_identidad":"A1","tipo_personal":"ayudante","password":"s2"}'

Invoke-RestMethod -Uri http://localhost:3000/api/personal -Method POST `
  -ContentType "application/json" `
  -Body '{"nombre_completo":"Vendedor","documento_identidad":"V1","tipo_personal":"administrativo","password":"s3"}'

# Crear viaje y publicar
Invoke-RestMethod -Uri http://localhost:3000/api/viajes -Method POST `
  -ContentType "application/json" `
  -Body '{"ruta_id":1,"bus_id":1,"chofer_id":1,"ayudante_id":2,"fecha_salida":"2026-05-01","hora_salida":"08:00","tarifa_base":"150.00"}'

Invoke-RestMethod -Uri http://localhost:3000/api/viajes/1/publicar -Method PATCH
```

### Paso 2 — Leer el mapa de asientos (ambos vendedores)

```powershell
# Ambos vendedores ven asiento #1 con version = 1
Invoke-RestMethod -Uri http://localhost:3000/api/viajes/1/asientos | Select-Object -First 1
```

### Paso 3 — Vendedor A compra (éxito ✅)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/boletos -Method POST `
  -ContentType "application/json" `
  -Body '{"viaje_id":1,"asiento_id":1,"pasajero":{"nombre_completo":"Vendedor A Cliente","tipo_documento":"CI","numero_documento":"AAA"},"ciudad_subida_id":1,"ciudad_bajada_id":2,"tarifa_pagada":"150.00","version_asiento":1,"metodo_pago":"efectivo","vendedor_id":3}'
# → 201: boleto emitido, asiento.version = 2
```

### Paso 4 — Vendedor B intenta comprar el mismo asiento (fallo ❌)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/boletos -Method POST `
  -ContentType "application/json" `
  -Body '{"viaje_id":1,"asiento_id":1,"pasajero":{"nombre_completo":"Vendedor B Cliente","tipo_documento":"CI","numero_documento":"BBB"},"ciudad_subida_id":1,"ciudad_bajada_id":2,"tarifa_pagada":"150.00","version_asiento":1,"metodo_pago":"tarjeta","vendedor_id":3}'
# → 409: "Conflicto de concurrencia: el asiento fue modificado por otro vendedor."
```

**Resultado esperado:** Vendedor A obtiene el boleto. Vendedor B recibe un 409 y debe recargar el mapa.
