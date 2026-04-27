# SPEC.md — Sistema de Venta de Pasajes (Flota Mariscal Santa Cruz)
## Documento de Especificación de Requisitos y Modelo de Dominio

---

## 1. Visión General del Sistema

El sistema informático de venta de pasajes gestiona el ciclo completo de operación de una flota de buses interprovinciales, abarcando desde la configuración operativa hasta el despacho final del vehículo. La arquitectura se fundamenta en un modelo de dominio orientado a objetos que vincula la gestión de recursos físicos (buses, rutas, personal) con la lógica de venta interactiva y control operativo en tiempo real.

**Paradigma arquitectónico:** Sistema web distribuido con sincronización de estado en tiempo real para evitar condiciones de carrera en la asignación de asientos.

---

## 2. Historias de Usuario por Etapa Operativa

### ETAPA 1: Configuración Inicial del Sistema (Fundamentos Operativos)

**HU-001 — Registro de Ciudades**
> Como administrador del sistema, quiero registrar ciudades en el catálogo maestro para que posteriormente puedan ser utilizadas como origen o destino en la definición de rutas.
> - **Criterios de aceptación:** Debe permitir ingresar nombre de ciudad, código identificador y región geográfica. No debe permitir duplicados por nombre.

**HU-002 — Definición de Rutas**
> Como administrador, quiero crear rutas que conecten ciudades de origen y destino, especificando paradas intermedias, para establecer los corredores operativos de la flota.
> - **Criterios de aceptación:** La ruta debe tener una ciudad origen, una ciudad destino, una secuencia ordenada de paradas intermedias, y una distancia/tiempo estimado.

**HU-003 — Registro de Flota de Buses**
> Como administrador, quiero registrar cada bus de la flota con sus características físicas y asignarle un tipo de vehículo, para que el sistema pueda generar automáticamente su mapa de asientos.
> - **Criterios de aceptación:** Debe registrar placa, número de unidad, estado operativo (activo/mantenimiento/baja), y asociar un Tipo de bus que define su capacidad y distribución de asientos.

**HU-004 — Registro de Personal**
> Como administrador, quiero registrar el personal de la empresa (choferes, ayudantes, administrativos) con sus datos, roles y credenciales de acceso, para poder asignarlos posteriormente a viajes específicos y controlar quién opera el sistema.
> - **Criterios de aceptación:** Debe registrar nombre completo, documento de identidad, tipo de personal (chofer/ayudante/administrativo), licencia de conducir (si aplica), estado activo/inactivo, y contraseña hasheada para autenticación.

---

### ETAPA 2: Creación y Programación del Viaje (Evento de Transporte)

**HU-005 — Creación de Viaje (Evento)**
> Como operador de programación, quiero crear un viaje seleccionando una ruta predefinida, asignándole un bus específico, un horario de salida y personal de tripulación, para poner a disposición la venta de pasajes.
> - **Criterios de aceptación:** Debe seleccionar ruta de catálogo, bus de flota disponible, fecha y hora de salida, chofer y ayudante asignados. No debe permitir asignar un bus que ya esté programado en otro viaje en el mismo horario.

**HU-006 — Generación Automática de Mapa de Asientos**
> Como operador, al crear un viaje, quiero que el sistema genere automáticamente el mapa gráfico de asientos basado en el Tipo de bus asignado, para visualizar la disponibilidad inicial.
> - **Criterios de aceptación:** El sistema debe crear una matriz de asientos según la capacidad y pisos definidos en el Tipo del bus. Todos los asientos deben iniciar con estado "disponible". Cada asiento debe tener coordenadas únicas (fila, columna, piso).

**HU-007 — Publicación de Viaje para Venta**
> Como operador, quiero activar un viaje para que aparezca disponible en las boleterías y pueda iniciarse la venta de pasajes.
> - **Criterios de aceptación:** El viaje debe cambiar de estado "programado" a "en venta". Debe calcular y publicar las tarifas por segmento de ruta.

---

### ETAPA 3: Proceso de Atención y Venta de Pasajes

**HU-008 — Consulta de Disponibilidad**
> Como vendedor de boletería, quiero consultar viajes disponibles filtrando por ciudad origen, destino y fecha, para atender la solicitud del pasajero.
> - **Criterios de aceptación:** Debe mostrar lista de viajes con horario, tarifa, y disponibilidad de asientos. Debe permitir filtrar por ruta completa o por segmentos intermedios.

**HU-009 — Visualización Gráfica de Asientos**
> Como vendedor, quiero visualizar el mapa interactivo del bus para el viaje seleccionado, con los asientos codificados por estado, para guiar al pasajero en su elección.
> - **Criterios de aceptación:** Debe mostrar esquema gráfico del bus con asientos en colores según estado: disponible (verde), ocupado (rojo), seleccionado (amarillo). Debe diferenciar pisos si el bus es de dos pisos.

**HU-010 — Selección y Reserva de Asientos**
> Como vendedor, quiero hacer clic en los asientos disponibles que el pasajero desea comprar, para marcarlos como seleccionados temporalmente mientras ingreso sus datos.
> - **Criterios de aceptación:** Los asientos seleccionados deben cambiar a estado "en proceso" temporalmente (timeout de 10 minutos). Debe validar que no estén ocupados por otro vendedor en tiempo real.

**HU-011 — Registro de Datos del Pasajero**
> Como vendedor, quiero ingresar los datos personales del pasajero (nombre, documento de identidad) y asociarlos a los asientos seleccionados, para personalizar el boleto.
> - **Criterios de aceptación:** Debe registrar nombre completo, tipo y número de documento, y opcionalmente teléfono/correo. Debe validar formato de documento.

**HU-012 — Procesamiento de Cobro**
> Como vendedor, quiero registrar el método de pago y el monto cobrado, para completar la transacción comercial.
> - **Criterios de aceptación:** Debe soportar múltiples métodos de pago (efectivo, tarjeta, transferencia). Debe calcular vuelto si es efectivo. Debe generar número de comprobante. Todos los montos deben almacenarse en formato DECIMAL(10,2).

**HU-013 — Confirmación y Emisión de Boleto**
> Como vendedor, al completar el cobro, quiero que el sistema confirme la compra, cambie el estado de los asientos a "ocupado" de forma permanente, y emita un boleto único.
> - **Criterios de aceptación:** El boleto debe tener código único (QR o numérico), datos del pasajero, asiento asignado con coordenadas, datos del viaje, tarifa pagada, y fecha/hora de emisión. Los asientos deben bloquearse globalmente para todos los puntos de venta.

**HU-014 — Prevención de Doble Venta (Concurrencia Optimista)**
> Como sistema, quiero garantizar que un asiento no pueda ser vendido simultáneamente por dos vendedores diferentes, para evitar conflictos de asignación.
> - **Criterios de aceptación:** Debe implementar **Bloqueo Optimista (Optimistic Locking)** obligatoriamente mediante un campo `version: int` en la clase `Asiento`. Si dos vendedores intentan comprar el mismo asiento simultáneamente, ambos leen la misma versión inicial. El primero que confirma incrementa la versión y guarda. El segundo, al intentar guardar con la versión obsoleta, recibe un error de concurrencia y debe recargar el estado actual del asiento. Cero filas bloqueadas en base de datos, máximo rendimiento bajo carga.

---

### ETAPA 4: Ventas en Ciudades Intermedias (Segmentación de Ruta)

**HU-015 — Venta de Pasajes por Segmento**
> Como vendedor en ciudad intermedia, quiero vender pasajes para segmentos de ruta (desde una parada intermedia hasta el destino o hasta otra parada), para maximizar la ocupación del bus.
> - **Criterios de aceptación:** Debe mostrar solo los asientos que estarán disponibles (no ocupados) durante el segmento solicitado. Debe permitir seleccionar parada de subida y parada de bajada.

**HU-016 — Sincronización de Estado en Tiempo Real**
> Como sistema distribuido, quiero que cualquier venta realizada en cualquier punto de la red actualice instantáneamente el estado de los asientos, para mantener consistencia global.
> - **Criterios de aceptación:** El cambio de estado de un asiento debe propagarse a todos los clientes web conectados en menos de 2 segundos. Debe usar WebSockets o Server-Sent Events.

**HU-017 — Visualización de Ocupación por Segmento**
> Como vendedor, quiero ver visualmente qué asientos están ocupados en qué segmentos de la ruta, para identificar fácilmente la disponibilidad para un nuevo pasajero que aborda en medio del recorrido.
> - **Criterios de aceptación:** Debe mostrar indicadores visuales de ocupación parcial (ej: asiento ocupado desde ciudad A hasta ciudad B, pero disponible desde ciudad B en adelante).

---

### ETAPA 5: Despacho y Abordaje del Bus

**HU-018 — Interfaz de Despacho**
> Como despachador, quiero acceder a una interfaz específica de despacho que muestre el listado completo de pasajeros de un viaje, para iniciar el proceso de abordaje.
> - **Criterios de aceptación:** Debe mostrar lista de pasajeros con nombre, documento, asiento asignado, ciudad de subida, y ciudad de bajada. Debe permitir filtrar y buscar.

**HU-019 — Llamado de Lista y Validación de Presencia**
> Como despachador, quiero marcar en el sistema la presencia física de cada pasajero durante el llamado de lista, para confirmar quién abordó efectivamente.
> - **Criterios de aceptación:** Debe permitir marcar estado: presente, ausente, o no show. Debe calcular estadísticas de ocupación final vs. venta.

**HU-020 — Validación de Tripulación**
> Como despachador, quiero validar y confirmar la presencia del chofer y ayudante asignados al viaje, para autorizar la salida del bus.
> - **Criterios de aceptación:** Debe mostrar datos del chofer y ayudante asignados. Debe requerir confirmación de presencia de ambos antes de permitir marcar el viaje como "despachado".

**HU-021 — Cierre de Viaje**
> Como despachador, después de completar el abordaje y validación, quiero cerrar el viaje marcándolo como "despachado", para finalizar el ciclo operativo.
> - **Criterios de aceptación:** El viaje debe cambiar a estado "en ruta" y posteriormente "completado". No debe permitir más ventas de pasajes para ese viaje.

---

## 3. Modelo de Clases UML (Diagrama de Dominio)

### 3.1 Descripción de la Arquitectura de Clases

El modelo de dominio se estructura en torno a cuatro núcleos funcionales: **Catálogos Maestros** (configuración operativa), **Recursos Físicos** (buses y personal), **Programación de Eventos** (viajes y asientos), y **Transacciones Comerciales** (pasajeros, boletos y pagos). La relación central es la asociación entre `Bus` y `Tipo`, donde `Tipo` ha sido extraído como entidad independiente para permitir la parametrización flexible de las características físicas del vehículo y la generación dinámica de matrices de asientos.

### 3.2 Clases y Atributos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CATÁLOGOS MAESTROS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │    CIUDAD           │         │     RUTA            │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ - id: int           │         │ - id: int           │                   │
│  │ - nombre: String    │◄────────│ - nombre: String    │                   │
│  │ - codigo: String    │    1    │ - ciudadOrigenId: int│                  │
│  │ - region: String    │         │ - ciudadDestinoId: int                  │
│  │ - estado: String    │         │ - distanciaKm: int  │                   │
│  │                     │         │ - tiempoEstimado: int(min)              │
│  │                     │         │ - estado: String    │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │  PARADA_INTERMEDIA  │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - rutaId: int       │                                                    │
│  │ - ciudadId: int     │                                                    │
│  │ - orden: int        │                                                    │
│  │ - distanciaAcumulada: int                                                │
│  └─────────────────────┘                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                      RECURSOS FÍSICOS Y TIPOS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │      TIPO           │◄────────│       BUS           │                   │
│  ├─────────────────────┤    1    ├─────────────────────┤                   │
│  │ - id: int           │────────►│ - id: int           │                   │
│  │ - nombre: String    │         │ - placa: String     │                   │
│  │ - capacidad: int    │         │ - numeroUnidad: String                 │
│  │ - pisos: int        │         │ - tipoId: int       │                   │
│  │                     │         │ - estado: String    │                   │
│  │                     │         │ - fechaRegistro: Date                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │     PERSONAL        │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - nombreCompleto: String                                                 │
│  │ - documentoIdentidad: String                                             │
│  │ - tipoPersonal: String  [chofer|ayudante|administrativo]                 │
│  │ - licenciaConducir: String (nullable)                                    │
│  │ - passwordHash: String  ← Hash bcrypt/argon2 para autenticación          │
│  │ - estado: String    │                                                    │
│  │ - fechaRegistro: Date                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                    PROGRAMACIÓN DE EVENTOS (VIAJES)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │      VIAJE          │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - rutaId: int       │                                                    │
│  │ - busId: int        │                                                    │
│  │ - choferId: int     │                                                    │
│  │ - ayudanteId: int   │                                                    │
│  │ - fechaSalida: Date │                                                    │
│  │ - horaSalida: Time  │                                                    │
│  │ - estado: String    │  [programado|en_venta|en_ruta|completado|cancelado]│
│  │ - tarifaBase: DECIMAL(10,2)  ← NUNCA float para dinero                 │
│  │ - fechaCreacion: Date                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │     ASIENTO         │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - viajeId: int      │                                                    │
│  │ - numeroAsiento: String                                                  │
│  │ - fila: int         │         ← Coordenadas exactas en matriz             │
│  │ - columna: int      │         ← para targeting preciso (Bowser problem)   │
│  │ - piso: int         │         ← según Tipo.pisos                          │
│  │ - estado: String    │  [disponible|en_proceso|ocupado|no_show]            │
│  │ - pasajeroId: int (nullable)                                             │
│  │ - version: int      │  ← Bloqueo Optimista (Optimistic Locking)           │
│  │                     │     Inicia en 1. Se incrementa en cada UPDATE.      │
│  │                     │     Si UPDATE WHERE id=X AND version=Y retorna 0    │
│  │                     │     filas afectadas → conflicto de concurrencia.    │
│  └─────────────────────┘                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                  TRANSACCIONES COMERCIALES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │    PASAJERO         │         │     BOLETO          │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ - id: int           │◄────────│ - id: int           │                   │
│  │ - nombreCompleto: String  1   │ - codigoUnico: String                  │
│  │ - tipoDocumento: String   │   │ - viajeId: int      │                   │
│  │ - numeroDocumento: String │   │ - asientoId: int    │                   │
│  │ - telefono: String    │     │ - pasajeroId: int   │                   │
│  │ - correo: String      │     │ - ciudadSubidaId: int                    │
│  │ - fechaRegistro: Date │     │ - ciudadBajadaId: int                    │
│  └─────────────────────┘     n   │ - tarifaPagada: DECIMAL(10,2)            │
│                                │ - fechaEmision: DateTime                 │
│                                │ - estado: String    │  [emitido|anulado|usado]│
│                                └─────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │      PAGO           │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - boletoId: int     │                                                    │
│  │ - monto: DECIMAL(10,2)  ← NUNCA float para dinero                      │
│  │ - metodoPago: String [efectivo|tarjeta|transferencia]                    │
│  │ - numeroComprobante: String                                              │
│  │ - fechaPago: DateTime                                                    │
│  │ - vendedorId: int   │                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │    DESPACHO         │                                                    │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - viajeId: int      │                                                    │
│  │ - despachadorId: int│                                                    │
│  │ - fechaDespacho: DateTime                                                │
│  │ - estado: String    │  [iniciado|tripulacion_validada|pasajeros_validados|│
│  │                     │    despachado]                                       │
│  │ - observaciones: String                                                  │
│  └─────────────────────┘                                                    │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │ DESPACHO_PASAJERO   │  (Tabla de validación de presencia)                │
│  ├─────────────────────┤                                                    │
│  │ - id: int           │                                                    │
│  │ - despachoId: int   │                                                    │
│  │ - boletoId: int     │                                                    │
│  │ - estadoPresencia: String [presente|ausente|no_show]                     │
│  │ - horaValidacion: DateTime                                               │
│  └─────────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Notas de Diseño Arquitectónico

**Sobre la clase `Tipo`:**
La clase `Tipo` ha sido extraída del atributo original de `Bus` para constituir una entidad de dominio independiente. Esto permite:
- Parametrizar las características físicas del vehículo (capacidad total, número de pisos) sin redundancia de datos.
- Generar matrices de asientos de forma determinista a partir de la configuración del tipo.
- Reutilizar configuraciones de tipo para múltiples buses (ej: "Bus Estándar 45 pasajeros 1 piso", "Bus Doble Piso 60 pasajeros").
- Facilitar la extensión futura con atributos adicionales como "ancho de asiento", "espacio de equipaje", o "accesibilidad".

**Atributos obligatorios preservados:**
- `Tipo`: `id`, `nombre`, `capacidad`, `pisos` (exactamente como solicitado).
- Se han agregado atributos adicionales a otras clases para soportar la funcionalidad completa del sistema, pero no se ha eliminado ningún atributo base.

**Relaciones clave:**
- `Bus` tiene un `Tipo` (1:1).
- `Viaje` tiene un `Bus`, una `Ruta`, un `Personal` (chofer) y otro `Personal` (ayudante).
- `Asiento` pertenece a un `Viaje` y opcionalmente a un `Pasajero`.
- `Boleto` vincula `Viaje`, `Asiento`, `Pasajero`, y ciudades de subida/bajada.
- `Despacho` valida la presencia física a través de `DespachoPasajero`.

---

## 4. Reglas de Negocio Críticas

1. **Unicidad de asiento por viaje:** Un asiento no puede tener dos boletos activos simultáneos para el mismo viaje.
2. **Segmentación de ocupación:** Un asiento puede estar ocupado en un segmento de ruta y disponible en otro (ej: ocupado de A→B, disponible de B→C).
3. **Bloqueo temporal:** Asientos en estado "en_proceso" deben liberarse automáticamente después de 10 minutos sin confirmación de pago.
4. **Validación de tripulación:** Un viaje no puede despacharse sin chofer y ayudante validados como presentes.
5. **Inmutabilidad post-despacho:** Una vez despachado, un viaje no admite modificaciones de venta ni reembolsos automáticos.
6. **Integridad monetaria:** Todos los campos de dinero (`tarifaBase`, `tarifaPagada`, `monto`) deben almacenarse en `DECIMAL(10,2)`. Nunca usar tipos de punto flotante (`float`, `double`) para valores monetarios, ya que IEEE 754 introduce errores de precisión en fracciones decimales.
7. **Concurrencia optimista obligatoria:** La clase `Asiento` debe implementar bloqueo optimista mediante el campo `version: int`. Cada operación de compra debe validar que la versión leída coincide con la versión actual en base de datos antes de confirmar la transacción. Si hay discrepancia, la operación debe abortar y notificar al usuario que el asiento ya fue vendido.
8. **Autenticación de personal:** Todo registro en `Personal` debe incluir `passwordHash` para permitir autenticación segura en el sistema. Las contraseñas nunca se almacenan en texto plano.

---

## 5. Glosario de Estados

| Entidad      | Estados Posibles                                      |
|--------------|-------------------------------------------------------|
| Bus          | activo, mantenimiento, baja                             |
| Personal     | activo, inactivo, licencia_suspendida                   |
| Viaje        | programado, en_venta, en_ruta, completado, cancelado  |
| Asiento      | disponible, en_proceso, ocupado, no_show               |
| Boleto       | emitido, anulado, usado                                |
| Despacho     | iniciado, tripulacion_validada, pasajeros_validados, despachado |

---

## 6. Notas para Inyección de Contexto a IA

Este documento debe ser utilizado como contexto base para generación de código, donde:
- Las **Historias de Usuario** definen el comportamiento esperado y los criterios de aceptación.
- El **Modelo de Clases UML** define la estructura de datos, relaciones y atributos inmutables.
- Las **Reglas de Negocio** definen las restricciones que el código debe implementar.
- El **Glosario de Estados** define las máquinas de estado a implementar.

**Restricciones de modificación INMUTABLES:**
1. La clase `Tipo` debe mantener obligatoriamente los atributos `id`, `nombre`, `capacidad`, `pisos`.
2. Todos los campos monetarios deben usar `DECIMAL(10,2)`. Prohibido `float` o `double`.
3. La clase `Asiento` debe incluir obligatoriamente `version: int` para Bloqueo Optimista.
4. La clase `Personal` debe incluir obligatoriamente `passwordHash: String`.
5. Se pueden agregar atributos adicionales a cualquier clase, pero no eliminar los existentes.

**Contexto histórico (DCG):** El sistema SABRE original de American Airlines, implementado en 1960 junto a IBM en discos magnéticos gigantes, resolvía este mismo problema de la doble venta de asientos con un algoritmo que pesaba menos de 4 KB de código ensamblador; su lógica definió el modelo de transacciones ACID que tu base de datos SQLite usa hoy.

---

*Documento generado para especificación técnica del Sistema de Venta de Pasajes.*
*Referencia arquitectónica: Flota Mariscal Santa Cruz — Arquitecturas de Boletaje Distribuido.*

