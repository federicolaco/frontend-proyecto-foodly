# Diagnóstico front/back — pedido Mercado Pago figura como `Pendiente` en vez de `Pendiente de pago` en `Mis Pedidos`

**Fecha:** 2026-07-05  
**Proyecto:** Foodly Front  
**Pantalla analizada:** `Mis Pedidos` del cliente

---

## Resumen ejecutivo

Se verificó el caso donde un cliente inicia un pago con **Mercado Pago**, abandona el flujo sin completarlo, y luego ve el pedido en **Mis Pedidos** con estado **`Pendiente`** en lugar de **`Pendiente de pago`**.

Con la evidencia actual, el problema apunta principalmente a un **desacople de contrato entre backend y frontend**, con mayor probabilidad del lado **backend** si el endpoint real no está devolviendo los campos exactos que el frontend espera.

Punto clave:

- el frontend **sí está preparado** para mostrar `Pendiente de pago`
- pero **solo** si `GET /pedidos/mi-historial` devuelve ciertos campos concretos

Si esos campos no llegan, o llegan con otros nombres, la UI cae automáticamente al estado genérico:

> `pending` → `Pendiente`

---

## Qué se verificó en frontend

### 1. `Mis Pedidos` ya contempla el caso de pago pendiente

Archivo:

- `frontend-proyecto-foodly/src/pages/MyOrders.jsx`

Implementación verificada:

- la etiqueta visual del estado sale de:

```js
function getOrderStatusLabel(order) {
  return order.visibleStatus ?? order.estadoVisible ?? ORDER_STATUS_LABELS[order.status] ?? order.status
}
```

- además, la pantalla detecta pago pendiente con:

```js
const isPaymentPending = order.paymentPending ?? order.pagoPendiente
const canRetryPayment = order.canRetryPayment ?? order.permiteReintentarPago
```

Eso significa que el frontend ya sabe:

1. mostrar el badge como `Pendiente de pago`
2. renderizar el bloque informativo de pago pendiente
3. habilitar el botón `Reintentar pago`

---

### 2. El frontend depende de nombres exactos en la respuesta del backend

Archivo:

- `frontend-proyecto-foodly/src/api/backend/mappers.js`

Implementación verificada:

```js
const estadoVisible =
  typeof pedido.estadoVisible === 'string' && pedido.estadoVisible.trim()
    ? pedido.estadoVisible.trim()
    : null
const pagoPendiente = Boolean(pedido.pagoPendiente)
const permiteReintentarPago = Boolean(pedido.permiteReintentarPago)

return {
  ...
  status: mapBackendStatusToFrontend(pedido.estado),
  estadoVisible,
  visibleStatus: estadoVisible,
  pagoPendiente,
  paymentPending: pagoPendiente,
  permiteReintentarPago,
  canRetryPayment: permiteReintentarPago,
}
```

El mapper actual **solo** contempla estas claves del backend:

- `estadoVisible`
- `pagoPendiente`
- `permiteReintentarPago`

Si backend devuelve variantes como:

- `estado_visible`
- `visible_status`
- `paymentPending`
- `canRetryPayment`
- `pendingPayment`

entonces el frontend actual **no las toma**, y termina mostrando el fallback:

- `estado = Pendiente` → `status = pending` → label `Pendiente`

---

### 3. El mock local confirma cuál era la intención funcional

Archivo:

- `frontend-proyecto-foodly/src/api/mock/ordersMock.js`

Implementación verificada:

```js
const estadoVisible = isPaymentPending ? 'Pendiente de pago' : null

return {
  ...order,
  estadoVisible,
  visibleStatus: estadoVisible,
  pagoPendiente: isPaymentPending,
  paymentPending: isPaymentPending,
  permiteReintentarPago: isPaymentPending,
  canRetryPayment: isPaymentPending,
}
```

Esto confirma que, conceptualmente, el sistema esperaba este comportamiento:

- estado técnico: `pending`
- etiqueta visible: `Pendiente de pago`
- reintento habilitado

---

## Evidencia funcional relevante

En la captura analizada, el pedido aparece con:

- badge `Pendiente`
- botón `Cancelar pedido`
- sin bloque de `Pago pendiente`
- sin botón `Reintentar pago`

Eso es importante porque, con el frontend actual:

- si `pagoPendiente === true`, debería verse el bloque de pago pendiente
- si `permiteReintentarPago === true`, debería verse `Reintentar pago`
- si `estadoVisible === 'Pendiente de pago'`, el badge no debería decir solo `Pendiente`

Por lo tanto, la evidencia visual sugiere que **esos datos no están llegando como el frontend los espera**.

---

## Conclusión técnica

Con la evidencia verificada, **no parece un problema puramente visual del frontend**.

La causa más probable es una de estas dos:

### Escenario A — problema de backend / contrato

`GET /pedidos/mi-historial` no está devolviendo alguno de estos campos:

- `estadoVisible`
- `pagoPendiente`
- `permiteReintentarPago`

o no los devuelve en el pedido afectado.

En este escenario, el frontend hace lo único que puede hacer:

- toma `estado`
- lo mapea a `pending`
- muestra `Pendiente`

### Escenario B — problema de integración frontend/backend

Backend sí devuelve la semántica correcta, pero con otros nombres de propiedades.

Ejemplo:

```json
{
  "estado": "Pendiente",
  "estado_visible": "Pendiente de pago",
  "payment_pending": true,
  "can_retry_payment": true
}
```

En este caso el backend “manda el dato”, pero el frontend no lo reconoce por mismatch de contrato.

---

## Qué NO parece estar pasando

No hay evidencia de que `MyOrders.jsx` esté ignorando deliberadamente el estado correcto.

Al contrario:

- la pantalla ya intenta usar `estadoVisible`
- ya contempla `pagoPendiente`
- ya contempla `permiteReintentarPago`

Si aun así se ve `Pendiente`, lo primero que debe auditarse es la **respuesta real del endpoint**.

---

## Qué debe revisar backend

### 1. La respuesta real de `GET /pedidos/mi-historial`

Backend debe verificar, para un pedido abandonado en Mercado Pago, si el endpoint devuelve realmente:

```json
{
  "id": 104,
  "estado": "Pendiente",
  "estadoVisible": "Pendiente de pago",
  "pagoPendiente": true,
  "permiteReintentarPago": true
}
```

No alcanza con que esa lógica exista en otro endpoint, en otro DTO, o en memoria interna.

El dato debe salir en **`/pedidos/mi-historial`**, porque esa es la fuente que consume `Mis Pedidos`.

---

### 2. Si el backend está enviando nombres distintos

Backend debe revisar si el contrato real usa otros nombres, por ejemplo:

- `estado_visible`
- `visible_status`
- `paymentPending`
- `canRetryPayment`
- `pendingPayment`

Si ocurre eso, hoy existe un desalineamiento entre el contrato real y el mapper del frontend.

---

### 3. La regla de negocio del pedido abandonado

Backend debe confirmar cuál es la definición oficial:

- ¿el pedido sigue siendo técnicamente `Pendiente`?
- ¿y adicionalmente debe marcarse como `pagoPendiente = true`?
- ¿o existe un estado de negocio distinto para ese caso?

Sin esa definición, el contrato queda ambiguo y la UI termina adivinando.

---

## Recomendación de contrato

La opción más sana es mantener:

- un **estado técnico** de negocio
- y un **estado visible** para UI

Contrato recomendado:

```json
{
  "id": 104,
  "estado": "Pendiente",
  "estadoVisible": "Pendiente de pago",
  "pagoPendiente": true,
  "permiteReintentarPago": true
}
```

### Ventajas

- no rompe la lógica actual basada en `pending`
- permite distinguir pedido creado vs pago no acreditado
- mantiene una UI clara para el cliente
- deja habilitado el flujo de reintento de pago

---

## Alternativa posible

Definir un estado de negocio explícito, por ejemplo:

- `PendientePago`

y hacer que frontend lo mapee como tal.

### Tradeoff

Es más explícito a nivel dominio, pero puede exigir cambios adicionales en:

- filtros
- mappers
- listados
- reglas de cancelación
- panel del local

Por eso, si el sistema ya separa `estado` de `estadoVisible`, probablemente convenga respetar ese enfoque y formalizarlo bien.

---

## Recomendación final para backend

Backend debería revisar y confirmar estas tres cosas:

1. si `GET /pedidos/mi-historial` devuelve efectivamente `estadoVisible`, `pagoPendiente` y `permiteReintentarPago`
2. si esos campos salen con **exactamente esos nombres**
3. si el pedido abandonado en Mercado Pago entra correctamente en esa lógica de negocio

### Si no devuelve esos campos

El problema es principalmente de **backend/contrato**.

### Si los devuelve pero con otros nombres

El problema es de **integración backend-frontend**.

### Si los devuelve exactamente así

Entonces recién ahí habría que investigar un problema de **frontend** o de despliegue/caché.

---

## Conclusión corta

Hoy, con la evidencia disponible, la hipótesis más fuerte es:

> `Mis Pedidos` no está recibiendo desde `GET /pedidos/mi-historial` el contrato exacto necesario para distinguir `Pendiente` de `Pendiente de pago`.

Por eso backend debe auditar primero la respuesta real del historial de pedidos para ese caso.

---

## Referencias verificadas

- `frontend-proyecto-foodly/src/pages/MyOrders.jsx`
- `frontend-proyecto-foodly/src/api/backend/mappers.js`
- `frontend-proyecto-foodly/src/api/orders.js`
- `frontend-proyecto-foodly/src/api/mock/ordersMock.js`
- `frontend-proyecto-foodly/src/pages/payment/PaymentPending.jsx`
- `frontend-proyecto-foodly/src/pages/payment/PaymentFailure.jsx`
