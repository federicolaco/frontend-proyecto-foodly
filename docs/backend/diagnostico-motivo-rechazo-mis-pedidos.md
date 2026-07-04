# Diagnóstico front/back — motivo de rechazo faltante en `Mis Pedidos`

**Fecha:** 2026-07-03  
**Proyecto:** Foodly Front  
**Pantalla analizada:** `Mis Pedidos` del cliente

---

## Resumen ejecutivo

Se verificó el caso donde un pedido aparece como **Rechazado** en la pestaña **Mis Pedidos**, pero el cliente no ve el motivo informado por el local.

Con la evidencia actual, el problema apunta principalmente a **backend / contrato de datos**, no a un simple problema de renderizado del frontend.

La razón es doble:

1. el frontend actual no renderiza todavía el motivo de rechazo
2. el backend real **no lo persiste ni lo expone** en el endpoint que alimenta el historial del cliente

En otras palabras:

> aunque frontend agregue un bloque visual para mostrar el motivo, con el backend actual no tendría de dónde leerlo en ambiente real.

---

## Qué se verificó en frontend

### 1. La pantalla del cliente consume `GET /pedidos/mi-historial`

Archivo:

- `frontend-proyecto-foodly/src/api/orders.js`

Implementación verificada:

```js
export async function getMyOrders(filters = {}) {
  if (isApiConfigured()) {
    const params = buildOrderListParams(filters)
    const qs = params.toString()
    const data = await apiFetchSafe(`/pedidos/mi-historial${qs ? `?${qs}` : ''}`)
    return (data ?? []).map(mapOrderListItem)
  }

  return mockGetClientOrders(getSessionToken(), filters)
}
```

---

### 2. El mapper frontend no contempla motivo de rechazo

Archivo:

- `frontend-proyecto-foodly/src/api/backend/mappers.js`

Implementación verificada:

```js
export function mapOrderListItem(pedido) {
  return {
    id: pedido.id,
    clientId: pedido.cliente?.id,
    restaurantId: pedido.local?.id,
    restaurantName: pedido.local?.nombre ?? 'Local',
    items: [],
    total: pedido.total ?? 0,
    status: mapBackendStatusToFrontend(pedido.estado),
    createdAt: pedido.fecha ?? new Date().toISOString(),
    deliveryMinutes: parseDeliveryMinutes(pedido.tiempoEstEntrega),
    itemCount: pedido.cantidadItems ?? 0,
  }
}
```

Acá no existe ningún campo como:

- `motivoRechazo`
- `rejectionReason`
- `motivo`

---

### 3. La UI del cliente no muestra el motivo

Archivo:

- `frontend-proyecto-foodly/src/pages/MyOrders.jsx`

Implementación verificada:

- la tarjeta del pedido muestra:
  - número de pedido
  - local
  - estado
  - total
  - fecha
- no existe un bloque visual para mostrar el motivo de rechazo

Por lo tanto, en frontend hoy faltan dos cosas:

1. recibir el dato
2. renderizarlo

---

## Qué se verificó en backend

### 1. El backend sí recibe el motivo al rechazar

Archivos:

- `src/main/java/com/example/demo/Logica/DataTypes/request/DtRechazarPedidoRequest.java`
- `src/main/java/com/example/demo/Logica/Controllers/PedidoController.java`

Implementación verificada:

```java
public class DtRechazarPedidoRequest {
    private String motivo;
}
```

Y luego:

```java
pedidoService.rechazarPedido(idPedido, request.getMotivo());
```

Eso confirma que el motivo existe en el request de rechazo.

---

### 2. Pero el motivo no queda persistido en `Pedido`

Archivo:

- `src/main/java/com/example/demo/Logica/Clases/Pedido.java`

Implementación verificada:

La clase `Pedido` no tiene ningún campo para:

- motivo de rechazo
- observación de rechazo
- `motivoRechazo`

Eso ya es una señal fuerte de que el dato no se conserva como parte del pedido.

---

### 3. El service usa el motivo para notificar, no para almacenarlo

Archivo:

- `src/main/java/com/example/demo/Logica/Service/PedidoService.java`

Implementación verificada:

```java
public void rechazarPedido(long idPedido, String motivo) {
    ...
    pedido.setEstado(EstadoPedido.Rechazado);
    pedidoRepositorio.actualizar(pedido);
    notificacionPedidoService.notificarRechazo(pedido, motivo.trim());
}
```

Esto significa:

- el pedido cambia de estado a `Rechazado`
- el motivo se usa para la notificación
- pero no se guarda en el pedido

---

### 4. El DTO de historial no devuelve motivo de rechazo

Archivo:

- `src/main/java/com/example/demo/Logica/DataTypes/summary/DtPedidoListadoResponse.java`

Implementación verificada:

```java
public class DtPedidoListadoResponse {
    private Long id;
    private LocalDateTime fecha;
    private EstadoPedido estado;
    private Double total;
    private Duration tiempoEstEntrega;
    private DtClienteResumenResponse cliente;
    private DtLocalResumenResponse local;
    private Integer cantidadItems;
}
```

No existe campo de motivo de rechazo.

---

### 5. La query de historial tampoco lo selecciona

Archivo:

- `src/main/java/com/example/demo/Persistencia/Implementaciones/PedidoRepositorioImpl.java`

Implementación verificada:

`listarHistorialPorCliente(...)` arma un `SELECT` con:

- `id`
- `fecha`
- `estado`
- `total`
- `tiempoestentrega`
- datos del local
- `cantidad_items`

No selecciona ningún campo de motivo de rechazo.

---

## Conclusión técnica

En ambiente real con API:

**NO alcanza con tocar frontend.**

El problema principal es de backend porque el motivo de rechazo:

1. entra al sistema al momento del rechazo
2. se usa para notificar
3. pero no queda asociado al pedido como dato recuperable
4. por lo tanto no aparece en `GET /pedidos/mi-historial`

El frontend hoy también está incompleto, pero su falta es secundaria:

- incluso si MyOrders renderizara `order.rejectionReason`
- con el contrato actual ese dato no llegaría

---

## Matiz importante: mock vs backend real

En mock/local fake hay una diferencia:

- el mock de rechazo sí guarda `order.rejectionReason = reason.trim()`

Eso significa que:

- en mock podría resolverse con frontend solamente
- en backend real no

Este matiz es importante para evitar falsos positivos durante pruebas locales.

---

## Recomendación para backend

### Opción recomendada

Persistir y exponer el motivo de rechazo como parte del pedido.

### Sugerencia concreta

Agregar un campo tipo:

- `motivoRechazo`

o equivalente, de forma consistente en:

1. **modelo de dominio**
   - `Pedido`

2. **persistencia**
   - tabla/columna correspondiente
   - insert/update/read

3. **flujo de rechazo**
   - guardar `motivo.trim()` al rechazar

4. **DTO de listado/historial**
   - `DtPedidoListadoResponse`

5. **query de historial del cliente**
   - `listarHistorialPorCliente(...)`

6. **mapper**
   - `PedidoListadoMapper`

---

## Contrato recomendado para frontend

Lo ideal es que `GET /pedidos/mi-historial` devuelva algo como:

```json
{
  "id": 59,
  "estado": "Rechazado",
  "total": 100,
  "fecha": "2026-07-03T11:59:32",
  "local": {
    "id": 4,
    "nombre": "Foodlyburger"
  },
  "cantidadItems": 2,
  "motivoRechazo": "Se cortó la energía en el local"
}
```

### Ventajas de esta opción

- el historial del cliente queda autocontenido
- frontend no depende de otra fuente paralela
- el dato es auditable
- el motivo puede verse aunque la notificación se haya perdido

---

## Alternativa NO recomendada

Intentar reconstruir el motivo desde el sistema de notificaciones.

### Por qué no conviene

- mezcla dos responsabilidades distintas
- hace más frágil la UI
- obliga al frontend a depender del formato textual de una notificación
- puede fallar si la notificación no existe, no fue leída o cambia su contenido

En resumen:

> el motivo de rechazo debe vivir en el pedido o en un DTO oficial del pedido, no “escondido” en una notificación.

---

## Cambios mínimos esperables en frontend una vez que backend lo exponga

Cuando backend entregue el dato, frontend debería:

1. mapear `motivoRechazo` en `mapOrderListItem`
2. renderizarlo en `MyOrders.jsx` cuando `order.status === 'rejected'`
3. ocultarlo cuando no exista

Eso es un cambio chico y directo.

---

## Recomendación final

La recomendación para backend es:

- **persistir el motivo de rechazo**
- **exponerlo en `GET /pedidos/mi-historial`**
- **mantenerlo como parte oficial del contrato del pedido**

La solución correcta NO es parchear frontend con una fuente alternativa.

Si el cliente puede ver un pedido rechazado en su historial, también debe poder ver el motivo desde ese mismo historial, con un contrato explícito y estable.

---

## Referencias verificadas

- `frontend-proyecto-foodly/src/pages/MyOrders.jsx`
- `frontend-proyecto-foodly/src/api/orders.js`
- `frontend-proyecto-foodly/src/api/backend/mappers.js`
- `frontend-proyecto-foodly/src/api/mock/localMock.js`
- `src/main/java/com/example/demo/Logica/Clases/Pedido.java`
- `src/main/java/com/example/demo/Logica/Controllers/PedidoController.java`
- `src/main/java/com/example/demo/Logica/DataTypes/request/DtRechazarPedidoRequest.java`
- `src/main/java/com/example/demo/Logica/DataTypes/summary/DtPedidoListadoResponse.java`
- `src/main/java/com/example/demo/Logica/Mappers/PedidoListadoMapper.java`
- `src/main/java/com/example/demo/Logica/Service/PedidoService.java`
- `src/main/java/com/example/demo/Persistencia/Implementaciones/PedidoRepositorioImpl.java`
