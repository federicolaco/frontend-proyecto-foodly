# Diagnóstico front/back — baja de promociones

**Fecha:** 2026-06-29  
**Proyecto:** Foodly Front  
**Flujo analizado:** eliminación de promociones desde `local-panel/promociones`

---

## Resumen ejecutivo

Se verificó que el frontend ya fue corregido para intentar la baja real de promociones contra backend.

Antes, la UI se bloqueaba con un mensaje obsoleto y ni siquiera disparaba el request.  
Eso ya fue corregido.

Por lo tanto, si la baja sigue fallando en el ambiente, el próximo foco de validación o modificación debe estar en **backend** o en la **alineación de ambientes**.

---

## Qué se verificó en frontend

### 1. La pantalla ahora sí intenta eliminar

Archivo:

- `src/pages/local/LocalPromotions.jsx`

Evidencia verificada:

- el flujo de `handleDelete()` ya no corta por `isApiConfigured()`
- ahora ejecuta `deletePromotion(id)`

### 2. La capa API del frontend apunta a este endpoint

Archivo:

- `src/api/localPanel.js`

Evidencia verificada:

- el frontend llama:

```http
DELETE /locales/promociones_baja/{id}
```

### 3. El frontend ya no asume que toda promoción está activa

Archivo:

- `src/api/backend/mappers.js`

Evidencia verificada:

- el mapper ya no fuerza `active: true`
- ahora intenta respetar el estado real informado por backend

---

## Conclusión importante

El frontend YA quedó preparado para consumir una baja real.

Eso significa que, si al probar el flujo en Railway o en otro ambiente:

- devuelve `404`
- devuelve `405`
- devuelve `500`
- o la promoción sigue apareciendo como activa

entonces el problema remanente ya no está en el bloqueo original de la UI, sino en alguno de estos puntos:

1. backend no expone correctamente el endpoint esperado  
2. backend expone el endpoint, pero en otro ambiente distinto al que consume el frontend  
3. backend hace baja lógica, pero el listado de promociones no devuelve un estado consistente  
4. backend elimina bien, pero el contrato de respuesta/lectura sigue desalineado

---

## Qué debería validar o modificar backend

### Opción A — soportar la baja real con el endpoint que frontend ya consume

Contrato esperado por frontend:

```http
DELETE /api/v1/locales/promociones_baja/{id}
```

Resultado esperado:

- status exitoso (`200` o `204`)
- la promoción deja de aparecer como activa en búsquedas posteriores

Esta es la opción más alineada con el frontend actual.

---

### Opción B — si la baja es lógica, devolver estado consistente

Si backend no elimina físicamente y solo desactiva la promoción:

- el endpoint de listado o búsqueda debe reflejar esa inactividad
- el contrato debería devolver un campo estable, por ejemplo:

```json
{ "active": false }
```

o

```json
{ "estado": "Inactiva" }
```

También sería válido devolver `fechaBaja` si ese es el criterio de negocio, pero debe ser consistente.

---

### Opción C — si el endpoint definitivo será otro, alinear contrato

Si backend decidió que la baja NO va por:

```http
DELETE /locales/promociones_baja/{id}
```

entonces hay que definir explícitamente cuál es el contrato real:

- endpoint
- método HTTP
- payload si aplica
- respuesta esperada
- cómo se representa una promoción inactiva

Sin eso, el front queda adivinando. Y eso NO es arquitectura seria.

---

## Sospechas backend si el flujo sigue fallando

### 1. Endpoint no desplegado en el ambiente consumido por frontend

El frontend usa por defecto:

- `https://proyectoequipo32026-testing.up.railway.app/api/v1`

Si la baja fue implementada en otro deploy o en otra rama, el request puede seguir fallando aunque el código exista.

### 2. Método HTTP incorrecto o ruta distinta

Ejemplos típicos:

- backend espera `PUT` y frontend manda `DELETE`
- backend expone `/promociones/{id}/baja`
- backend expone `/promociones_baja` pero sin `{id}`

### 3. Baja lógica sin reflejo en el GET/listado

Aunque el `DELETE` responda bien, si el endpoint que lista promociones:

- sigue trayendo promociones dadas de baja
- o no informa un campo de estado utilizable

la UI puede seguir mostrándolas.

### 4. Error interno real (`500`)

Si aparece `500`, revisar:

- resolución del `id` de promoción
- permisos/autorización del local
- validación de pertenencia de la promoción al local autenticado
- errores de persistencia
- manejo de promociones ya dadas de baja

---

## Recomendaciones para backend

1. **Confirmar en el ambiente real** si existe `DELETE /api/v1/locales/promociones_baja/{id}`
2. **Definir un contrato único** para el estado de promoción (`active` o `estado`, pero uno claro)
3. **Asegurar que el endpoint de listado** no devuelva promociones inactivas como activas
4. **Alinear documentación y despliegue** para que frontend y backend apunten al mismo contrato
5. Si el endpoint final es otro, **informarlo explícitamente** para ajustar frontend sin ambigüedad

---

## Estado actual

### Ya corregido en frontend

- se quitó el bloqueo obsoleto de la UI
- se intenta la baja real
- se muestra el error real devuelto por backend
- se mejoró la lectura del estado de promoción

### Pendiente de backend / integración

- confirmar endpoint real en el ambiente consumido
- confirmar semántica de baja (física o lógica)
- devolver estado consistente para promociones dadas de baja

---

## Mensaje sugerido para backend

> Frontend ya fue corregido para intentar la baja real de promociones y hoy consume `DELETE /api/v1/locales/promociones_baja/{id}`.  
> Si el flujo sigue fallando, necesitamos confirmar si ese endpoint existe en el ambiente de testing y cuál es el contrato oficial para representar promociones inactivas en el listado.
