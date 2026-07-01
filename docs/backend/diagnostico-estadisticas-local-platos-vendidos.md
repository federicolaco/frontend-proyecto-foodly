# Diagnóstico front/back — estadísticas del local por plato vendido

**Fecha:** 2026-07-01  
**Proyecto:** Foodly Front  
**Flujo analizado:** pantalla `local-panel/estadisticas`

---

## Resumen ejecutivo

Se verificó que la pantalla de estadísticas del local **sí muestra ventas del período y un ranking de platos más pedidos**, pero **no puede mostrar hoy el detalle de cuántas unidades se vendieron por plato** con el contrato actual.

La conclusión técnica es clara:

- **frontend hoy no renderiza cantidades vendidas por plato**
- **el contrato actual del endpoint de estadísticas no expone ese dato de forma utilizable**
- **el frontend tampoco puede reconstruirlo de forma confiable desde el endpoint real de pedidos**

Por lo tanto, si el requerimiento de negocio es:

> “mostrar el detalle de cuántos platos vendió por plato, además de los más pedidos”

entonces **lo correcto es ajustar backend y alinear el contrato**.

---

## Qué se verificó en frontend

### 1. La pantalla actual muestra ranking, no detalle de cantidades

Archivo:

- `src/pages/local/LocalStatsPage.jsx`

Evidencia verificada:

- la card superior muestra:
  - ventas del período
  - período aplicado
  - cantidad de “platos destacados”
- la sección **“Platos más pedidos”** renderiza cada plato mostrando:
  - nombre
  - precio

Hoy NO muestra:

- cantidad vendida
- monto vendido por plato
- lista completa de platos vendidos

Esto significa que la UI actual está pensada para un **top/ranking**, no para un **desglose analítico**.

---

### 2. El mapper del frontend descarta cualquier cantidad vendida

Archivo:

- `src/api/backend/mappers.js`

Evidencia verificada:

`mapLocalStats()` transforma `platosMasPedido` a un modelo reducido con:

- `id`
- `name`
- `price`
- `image`

No conserva ningún campo como:

- `cantidadVendida`
- `quantitySold`
- `montoVendido`
- `revenue`

Conclusión:

Aunque backend ya estuviera enviando cantidades, **el frontend actual las perdería en el mapper**.

---

### 3. El endpoint consumido hoy está diseñado para resumen, no para detalle

Archivo:

- `src/api/localPanel.js`

Evidencia verificada:

El frontend consume:

```http
GET /locales/estadisticas/{localId}?preset=... 
```

o bien:

```http
GET /locales/estadisticas/{localId}?fechaDesde=...&fechaHasta=...
```

Y el fallback esperado por frontend contempla únicamente:

- `fechaDesde`
- `fechaHasta`
- `ventasConfirmadas`
- `platosMasPedido`

No existe hoy en el contrato esperado del frontend un bloque explícito para:

- detalle por plato
- cantidades vendidas
- ingresos por plato

---

### 4. El mock confirma que la lógica de conteo existe, pero el contrato la pierde

Archivo:

- `src/api/mock/localMock.js`

Evidencia verificada:

El mock:

- filtra pedidos confirmados del local en el período
- calcula un acumulado por plato (`dishCounts`)
- ordena por cantidad vendida
- limita el resultado a **5 platos**

Pero luego devuelve `platosMasPedido` con:

- `id`
- `nombre`
- `precio`
- `imagenes`

Sin incluir:

- cantidad vendida por plato

Esto demuestra algo importante:

**la información se calcula, pero el contrato la descarta antes de exponerla**.

---

### 5. El frontend real no puede reconstruir bien esta métrica desde pedidos

Archivo:

- `src/api/backend/mappers.js`

Evidencia verificada:

En `mapOrderListItem()` el frontend real deja:

- `items: []`

Es decir, en el flujo real de pedidos del local no se está preservando el detalle de ítems que permitiría agregar:

- qué plato se vendió
- cuántas unidades
- cuánto facturó ese plato

Conclusión:

No es una arquitectura seria depender de que frontend “recalcule” una métrica analítica si el backend no entrega un contrato correcto para eso.

---

## Conclusión importante

Con el estado actual, el frontend **NO puede mostrar correctamente el detalle de unidades vendidas por plato** solo con cambios visuales.

Si se quiere cubrir ese requerimiento de negocio de forma correcta, **hay que tocar backend** o al menos **extender el contrato actual del endpoint de estadísticas**.

---

## Qué debería validar o modificar backend

### Opción A — recomendada: extender el endpoint actual de estadísticas

Mantener el endpoint actual:

```http
GET /api/v1/locales/estadisticas/{localId}
```

pero enriquecer su respuesta con un bloque analítico por plato.

Ejemplo conceptual de respuesta esperada:

```json
{
  "fechaDesde": "2026-06-01",
  "fechaHasta": "2026-06-30",
  "ventasConfirmadas": 1800,
  "platosMasPedido": [
    {
      "id": 10,
      "nombre": "BigMac",
      "precio": 500,
      "cantidadVendida": 7
    }
  ],
  "ventasPorPlato": [
    {
      "id": 10,
      "nombre": "BigMac",
      "precioUnitario": 500,
      "cantidadVendida": 7,
      "montoVendido": 3500
    }
  ]
}
```

Ventajas:

- mantiene la lógica analítica donde corresponde
- evita recalcular datos en frontend
- permite conservar el ranking y además agregar detalle
- escala mejor si crece el volumen de pedidos

---

### Opción B — cambio mínimo: enriquecer `platosMasPedido`

Si no quieren agregar un bloque nuevo, el cambio mínimo sería que cada elemento de `platosMasPedido` incluya al menos:

- `cantidadVendida`

Ejemplo:

```json
{
  "id": 10,
  "nombre": "BigMac",
  "precio": 500,
  "cantidadVendida": 7
}
```

Esto sirve si el objetivo es solo mejorar la sección de **“más pedidos”**.

Pero NO alcanza si negocio quiere:

- ver todos los platos vendidos
- comparar facturación por plato
- usar esa pantalla como un detalle real de estadísticas

Además, si backend sigue limitando el resultado al top 5, seguiría faltando el desglose completo.

---

### Opción C — exponer detalle desde pedidos y dejar que frontend agregue

Esta opción sería:

- devolver en pedidos el detalle completo de ítems
- dejar que frontend haga la agregación por plato

Tradeoffs:

**Ventajas**

- evita tocar el endpoint de estadísticas

**Desventajas**

- duplica lógica de negocio en frontend
- aumenta payload
- empeora performance
- introduce riesgo de inconsistencias
- mezcla vista operativa de pedidos con vista analítica

Conclusión:

Esta opción es posible, pero **arquitectónicamente es la peor**.

---

## Problemas conceptuales detectados en la pantalla actual

### 1. “Platos destacados” no representa una métrica fuerte de negocio

Hoy la card muestra la longitud de `topDishes`.

Eso solo representa:

- cuántos elementos llegaron en la lista

NO representa necesariamente:

- cuántos platos distintos se vendieron
- cuántas unidades se vendieron
- cuántos platos tuvieron ventas reales en el período

Si backend limita el ranking a 5, esa card puede quedar semánticamente engañosa.

---

### 2. “Más pedido” y “detalle vendido por plato” no son la misma necesidad

Negocio está mezclando dos vistas distintas:

1. **Ranking**
   - cuáles fueron los platos más pedidos
2. **Detalle analítico**
   - cuántas unidades vendió cada plato
   - cuánto dinero generó cada plato

Si se quiere una pantalla sólida, backend debería contemplar ambas vistas explícitamente.

---

## Recomendación para backend

La recomendación más sana es:

1. **mantener el resumen actual**
   - período
   - ventas confirmadas
   - top de platos
2. **agregar un bloque de detalle por plato**
   - id
   - nombre
   - cantidad vendida
   - monto vendido
   - opcionalmente precio unitario
3. **definir si el detalle debe ser completo o paginado**
4. **documentar claramente si `platosMasPedido` sigue siendo top N**

Eso deja un contrato limpio, explícito y útil para evolución futura.

---

## Estado actual

### Lo que hoy sí existe

- cálculo de ventas confirmadas del período
- ranking de platos más pedidos
- filtros por preset o rango libre

### Lo que hoy falta para cubrir el requerimiento

- cantidad vendida por plato en el contrato
- desglose analítico por plato
- semántica clara para la card de “platos destacados”

---

## Mensaje sugerido para backend

> La pantalla de estadísticas del local hoy consume un resumen válido para ventas y ranking, pero no alcanza para mostrar cuántas unidades se vendieron por plato.  
> Necesitamos extender el contrato de `/api/v1/locales/estadisticas/{localId}` para incluir cantidad vendida por plato y, idealmente, un bloque de detalle analítico (`ventasPorPlato`) además de `platosMasPedido`.
