# Revisión técnica — propuesta backend para estadísticas de ventas por plato

**Fecha:** 2026-07-01  
**Proyecto:** Foodly Front  
**Documento revisado:** `frontend-cambio-estadisticas-ventas-por-plato.md`  
**Pantalla impactada:** `local-panel/estadisticas`

---

## Veredicto ejecutivo

La propuesta de backend va en la **dirección correcta** y, a nivel funcional, **resuelve el problema principal** detectado en frontend:

- mantener el endpoint actual
- mantener los filtros actuales
- enriquecer `platosMasPedido`
- agregar `ventasPorPlato` para el desglose completo

En otras palabras: **sí, la propuesta es válida y es implementable desde frontend**.

PERO hay varios puntos que conviene cerrar mejor antes de dar el contrato por definitivo.  
Si no se aclaran ahora, después aparecen inconsistencias de negocio, bugs de interpretación y UI engañosa.

---

## Qué está bien en la propuesta

### 1. No rompe la integración por ruta ni por filtros

Se mantiene:

```http
GET /api/v1/locales/estadisticas/{idLocal}
```

Y se mantienen los filtros:

- `preset`
- `fechaDesde`
- `fechaHasta`

Eso está bien porque el cambio es una **ampliación de contrato**, no un rediseño innecesario del endpoint.

---

### 2. Separa correctamente ranking y detalle analítico

La propuesta distingue entre:

- `platosMasPedido` → ranking / top
- `ventasPorPlato` → desglose completo

Eso es correcto.

Negocio suele mezclar ambas ideas como si fueran lo mismo, pero NO lo son:

- ranking = qué salió mejor
- detalle = cuánto vendió cada plato

Backend acá tomó una buena decisión.

---

### 3. Agrega exactamente los datos que faltaban

Los campos:

- `cantidadVendida`
- `montoVendido`

son los que frontend necesitaba para transformar esa pantalla en algo más serio.

---

## Recomendaciones para cerrar mejor el contrato

## 1. Aclarar explícitamente la semántica de `precio`, `precioFinal` y `montoVendido`

Este es el punto MÁS IMPORTANTE.

Hoy el documento muestra:

- `precio`
- `precioFinal`
- `cantidadVendida`
- `montoVendido`

Pero no deja completamente claro si `precio` y `precioFinal` representan:

### Opción A
el valor **actual del catálogo**

o

### Opción B
el valor **histórico efectivo al momento de la venta**

Esto no es un detalle menor.

Si un plato cambió de precio durante el período o tuvo promoción, una UI puede mostrar:

- precio actual: `$400`
- monto vendido: `$2450`

y el usuario puede interpretar mal el dato.

### Recomendación

Backend debería documentar de forma explícita uno de estos criterios:

- `precio` = precio actual del catálogo
- `precioFinal` = precio actual promocional

o bien:

- `precio` = precio base histórico usado para el cálculo
- `precioFinal` = precio efectivo histórico cobrado

Si no quieren ambigüedad, incluso sería mejor renombrar semánticamente para estadísticas, por ejemplo:

- `precioUnitarioReferencia`
- `precioUnitarioCobrado`

No digo que haya que renombrar YA. Digo que la semántica debe quedar cerrada.

---

## 2. Confirmar que `montoVendido` surge del precio efectivamente vendido

Relacionado con lo anterior:

`montoVendido` debería representar el monto real generado por ese plato en el período, no una multiplicación naive con el precio actual.

### Recomendación

Backend debería dejar explícito que:

```text
montoVendido = suma real de importes vendidos para ese plato en pedidos confirmados del período
```

Y aclarar si contempla:

- promociones
- cambios históricos de precio
- redondeos

---

## 3. Definir orden y límite de `platosMasPedido`

El documento dice que `platosMasPedido` sigue siendo el top, pero no precisa todo lo necesario.

### Recomendación

Backend debería documentar:

- si el orden es descendente por `cantidadVendida`
- qué pasa en caso de empate
- cuál es el límite exacto del top
- si ese límite es fijo o configurable

Sin eso, frontend puede asumir cosas que después cambian sin aviso.

---

## 4. Definir orden de `ventasPorPlato`

Si `ventasPorPlato` va a ser el detalle completo, también importa mucho el orden.

### Recomendación

Backend debería declarar si viene ordenado por:

- `cantidadVendida desc`
- `montoVendido desc`
- nombre
- o sin orden garantizado

La peor arquitectura es la que “anda de casualidad” porque frontend asume un orden no documentado.

---

## 5. Aclarar si `ventasPorPlato` trae solo platos vendidos o también platos con cero ventas

Por el nombre y por el documento, la inferencia razonable es que trae **solo platos vendidos en el período**.

Eso probablemente esté bien.

Pero hay que decirlo.

### Recomendación

Documentar explícitamente uno de estos comportamientos:

- `ventasPorPlato` incluye solo platos con ventas > 0
- `ventasPorPlato` incluye todos los platos del local, incluso con 0 ventas

Para esta pantalla, la opción más lógica parece ser **solo platos vendidos**, pero debe quedar cerrado.

---

## 6. Evaluar si hace falta un DTO tan grande para estadísticas

Hoy backend propone repetir, tanto en `platosMasPedido` como en `ventasPorPlato`, un objeto de plato bastante pesado con:

- `descripcion`
- `categoria`
- `precio`
- `precioFinal`
- `tienePromocion`
- `imagenes`
- `disponible`
- `dtLocal`

Eso puede funcionar, sí.  
Pero no necesariamente es el contrato más limpio.

### Tradeoff

#### Opción A — mantener DTO amplio
**Ventajas**
- más rápido de implementar
- reutiliza estructuras existentes
- frontend tiene más datos disponibles

**Desventajas**
- payload más pesado
- semántica menos específica para analítica
- mezcla datos de catálogo con datos estadísticos

#### Opción B — DTO específico de estadísticas
Por ejemplo, algo más minimalista:

- `id`
- `nombre`
- `imagen`
- `cantidadVendida`
- `montoVendido`
- `precioUnitario`

**Ventajas**
- contrato más claro
- menos payload
- menos ambigüedad

**Desventajas**
- requiere DTO específico en backend

### Recomendación

Si backend quiere salir rápido, el DTO amplio es aceptable.  
Si quiere un contrato más robusto y mantenible, conviene un DTO específico para estadísticas.

---

## 7. Revisar si `dtLocal.id` aporta valor real en este endpoint

Como el endpoint ya está scoped por local:

```http
GET /api/v1/locales/estadisticas/{idLocal}
```

repetir `dtLocal.id` dentro de cada plato parece redundante.

No está mal, pero sugiere reutilización de DTO de catálogo más que diseño específico de estadísticas.

### Recomendación

Puede mantenerse si simplifica backend, pero conceptualmente no es obligatorio para esta pantalla.

---

## 8. Definir comportamiento en estado vacío

Para evitar ambigüedad de integración, conviene documentar qué pasa si no hay ventas en el período.

### Recomendación

Aclarar que en ese caso backend responderá algo consistente como:

```json
{
  "fechaDesde": "2026-06-01",
  "fechaHasta": "2026-06-15",
  "platosMasPedido": [],
  "ventasPorPlato": [],
  "ventasConfirmadas": 0
}
```

Eso evita nulls innecesarios y simplifica frontend.

---

## Juicio técnico final

### La propuesta es correcta si el objetivo es:

- enriquecer la sección actual de “platos más pedidos”
- habilitar un desglose real por plato
- hacerlo sin crear otro endpoint

### La propuesta necesita aclaraciones si el objetivo es:

- dejar un contrato serio, mantenible y sin ambigüedades

Lo más delicado NO es la estructura general.  
Lo más delicado es la **semántica de precios y montos**.

Si eso queda ambiguo, la UI puede quedar “bonita” pero conceptualmente equivocada.  
Y ESO ES PEOR que un bug visual.

---

## Recomendación concreta para backend

Se puede aprobar la propuesta con estas condiciones o aclaraciones:

1. documentar si `precio` y `precioFinal` son actuales o históricos
2. documentar cómo se calcula `montoVendido`
3. documentar orden y límite de `platosMasPedido`
4. documentar orden y criterio de inclusión de `ventasPorPlato`
5. evaluar si a mediano plazo conviene un DTO específico de estadísticas

---

## Mensaje sugerido para backend

> La propuesta está bien orientada y cubre la necesidad funcional de frontend.  
> Antes de cerrarla como contrato definitivo, conviene aclarar explícitamente la semántica de `precio`, `precioFinal` y `montoVendido`, además del orden/límite de `platosMasPedido` y el criterio de inclusión/orden de `ventasPorPlato`.  
> Si quieren priorizar velocidad, el DTO actual es aceptable; si quieren un contrato más limpio y mantenible, conviene evolucionar a un DTO específico de estadísticas.
