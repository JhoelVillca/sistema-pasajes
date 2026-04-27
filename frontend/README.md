# Frontend — Sistema de Venta de Pasajes

Interfaz web para el Sistema de Venta de Pasajes de la **Flota Mariscal Santa Cruz**. Construido con React + Vite.

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework UI | React 19 |
| Bundler | Vite 8 |
| HTTP Client | Axios |
| Routing | react-router-dom v7 |
| Estilos | CSS vanilla (design system con custom properties) |

---

## Estructura del Proyecto

```
frontend/
├── public/
├── src/
│   ├── services/
│   │   └── api.js              ← Instancia Axios + funciones por endpoint
│   ├── pages/
│   │   ├── Boleteria.jsx       ← Vista principal de venta de pasajes
│   │   ├── Catalogos.jsx       ← Placeholder catálogos maestros
│   │   └── Viajes.jsx          ← Placeholder programación de viajes
│   ├── App.jsx                 ← Router + Layout con navbar
│   ├── App.css                 ← Estilos de componentes
│   ├── index.css               ← Design system (tokens, reset)
│   └── main.jsx                ← Punto de entrada React
├── index.html
├── vite.config.js
└── package.json
```

---

## Instalación

```bash
# Desde la carpeta frontend/
npm install
```

## Ejecución

```bash
# Desarrollo (hot-reload en http://localhost:5173)
npm run dev

# Build de producción
npm run build
```

> **Requisito:** El backend debe estar corriendo en `http://localhost:3000` antes de iniciar el frontend.

---

## Servicio API (`src/services/api.js`)

Instancia centralizada de Axios apuntando a `http://localhost:3000/api`. Todas las funciones exportadas mapean **estrictamente** a los endpoints definidos en `backend/openapi.yaml`.

### Funciones disponibles

| Función | Endpoint | Método |
|---|---|---|
| `getCiudades()` | `/ciudades` | GET |
| `getCiudad(id)` | `/ciudades/:id` | GET |
| `createCiudad(data)` | `/ciudades` | POST |
| `updateCiudad(id, data)` | `/ciudades/:id` | PUT |
| `deleteCiudad(id)` | `/ciudades/:id` | DELETE |
| `getRutas()` | `/rutas` | GET |
| `getRuta(id)` | `/rutas/:id` | GET |
| `createRuta(data)` | `/rutas` | POST |
| `updateRuta(id, data)` | `/rutas/:id` | PUT |
| `deleteRuta(id)` | `/rutas/:id` | DELETE |
| `getTipos()` | `/tipos` | GET |
| `getTipo(id)` | `/tipos/:id` | GET |
| `createTipo(data)` | `/tipos` | POST |
| `updateTipo(id, data)` | `/tipos/:id` | PUT |
| `deleteTipo(id)` | `/tipos/:id` | DELETE |
| `getBuses()` | `/buses` | GET |
| `getBus(id)` | `/buses/:id` | GET |
| `createBus(data)` | `/buses` | POST |
| `updateBus(id, data)` | `/buses/:id` | PUT |
| `deleteBus(id)` | `/buses/:id` | DELETE |
| `getPersonal(tipo?)` | `/personal?tipo=` | GET |
| `getPersonalById(id)` | `/personal/:id` | GET |
| `createPersonal(data)` | `/personal` | POST |
| `updatePersonal(id, data)` | `/personal/:id` | PUT |
| `deletePersonal(id)` | `/personal/:id` | DELETE |
| `getViajes(params?)` | `/viajes` | GET |
| `getViajesEnVenta()` | `/viajes?estado=en_venta` | GET |
| `getViaje(id)` | `/viajes/:id` | GET |
| `createViaje(data)` | `/viajes` | POST |
| `publicarViaje(id)` | `/viajes/:id/publicar` | PATCH |
| `getAsientos(viajeId)` | `/viajes/:id/asientos` | GET |

---

## Páginas

### 🎫 Boletería (`/boleteria`) — **Implementada**

Vista principal del sistema de venta de pasajes.

**Funcionalidad:**
- Al montarse, llama a `GET /viajes?estado=en_venta`, `GET /rutas` y `GET /ciudades` en paralelo
- Renderiza tarjetas para cada viaje disponible con:
  - Nombre de ruta resuelto (origen → destino)
  - Fecha y hora de salida
  - Número de bus
  - Tarifa en Bolivianos (Bs)
  - Badge "En venta"
- Botón **"Ver Asientos"** que llama a `GET /viajes/:id/asientos` y expande un mapa visual
- Mapa de asientos con grid 4 columnas y colores por estado:
  - 🟢 Verde = Disponible
  - 🟡 Amarillo = En proceso
  - 🔴 Rojo = Ocupado
- **Estados manejados:**
  - ⏳ Loading: spinner + mensaje
  - ⚠️ Error: mensaje + botón "Reintentar"
  - 📭 Vacío: mensaje informativo

### 📋 Catálogos (`/catalogos`) — Placeholder

Muestra tarjetas para cada módulo de catálogo (Ciudades, Rutas, Tipos, Buses, Personal) con referencias a las Historias de Usuario correspondientes.

### 🗓️ Viajes (`/viajes`) — Placeholder

Muestra tarjetas para las funciones de programación (Crear Viaje, Mapa de Asientos, Publicar Viaje) con sus HUs.

---

## Design System

El frontend usa un design system **dark premium** con tokens CSS:

- **Paleta:** Fondo oscuro (#0a0e1a), cards (#1a2236), accent indigo (#818cf8)
- **Tipografía:** Inter (Google Fonts), pesos 300-800
- **Componentes:**
  - Navbar glassmórfico con backdrop-filter
  - Cards con gradient accent bar on hover + glow shadow
  - Badges semánticos (success, warning, danger, info)
  - Botones primary (gradient) y ghost (outline)
  - Spinner de carga animado
  - Fade-in staggered para cards
- **Responsive:** Breakpoint a 768px (navbar vertical, grid 1-col)

---

## Notas de Implementación

- **No se inventaron endpoints:** Todas las llamadas HTTP usan estrictamente los endpoints de `openapi.yaml`.
- **No se tocó el backend:** Cero modificaciones a cualquier archivo en `backend/`.
- **Resolución de nombres:** La boletería resuelve `ruta_id` → nombre de ciudades origen/destino cargando rutas y ciudades en paralelo (3 requests concurrentes con `Promise.all`).
