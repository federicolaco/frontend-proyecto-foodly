# Diagnóstico front/back — imagen desactualizada del local en `/pedidos`

**Fecha:** 2026-06-29  
**Proyecto:** Foodly Front  
**Pantallas analizadas:** `/pedidos` y `/local/:restaurantId`

---

## Resumen ejecutivo

Se verificó una inconsistencia entre los datos que recibe frontend para el mismo local en dos pantallas distintas:

- en **`/pedidos`** se muestra una imagen vieja
- en **`/local/:restaurantId`** se muestra la imagen actualizada

Con la evidencia actual, el problema apunta principalmente a **backend / contrato de datos inconsistente entre endpoints**, no a un problema de renderizado del frontend.

---

## Qué se verificó en frontend

### 1. La pantalla de pedidos consume un endpoint

Archivo:

- `frontend-proyecto-foodly/src/api/orders.js`

Implementación verificada:

- `getPopularRestaurants()` llama a `POST /clientes/listar_locales`

Referencia:

```js
const data = await apiFetchSafe('/clientes/listar_locales', {
  method: 'POST',
  body: JSON.stringify(buildLocalListBody(filters)),
})
```

---

### 2. La página del local consume otro endpoint

Archivo:

- `frontend-proyecto-foodly/src/api/restaurant.js`

Implementación verificada:

- `fetchRestaurant()` llama a `GET /locales/{id}/perfil`

Referencia:

```js
return apiFetch(`/locales/${Number(restaurantId)}/perfil`)
```

---

### 3. Ambos endpoints terminan pasando por el mismo mapper

Archivo:

- `frontend-proyecto-foodly/src/api/backend/mappers.js`

Implementación verificada:

```js
export function mapLocalListItem(local, index = 0) {
  const images = local.imagenes ?? (local.foto ? [local.foto] : [])

  return {
    id: local.id,
    name: local.nombre,
    logo: local.foto ?? images[0] ?? null,
    isOpen: Boolean(local.estaAbierto),
    rating: local.calificacionGlobal ?? 0,
    foodType: local.descripcion ?? '',
    description: local.descripcion ?? '',
    address: formatAddress(local.direccion),
    images,
  }
}
```

Esto significa que el frontend prioriza:

1. `local.foto`
2. si no existe, usa `local.imagenes[0]`

---

## Hallazgo principal

El frontend NO está “inventando” una imagen distinta por pantalla.

Lo que hace es mostrar lo que recibe de cada endpoint:

- `/clientes/listar_locales`
- `/locales/{id}/perfil`

Si uno devuelve una imagen vieja y el otro devuelve la nueva, la UI va a mostrar esa diferencia.

---

## Hipótesis más probable

### Problema principal: backend

Es altamente probable que exista una inconsistencia entre endpoints para el mismo local:

- `POST /clientes/listar_locales` devuelve:
  - una `foto` vieja, o
  - no devuelve `foto` y cae en `imagenes[0]`, que también puede ser vieja

- `GET /locales/{id}/perfil` devuelve:
  - la `foto` actualizada correcta

### Problema secundario: contrato débil en frontend

Aunque el origen más probable está en backend, frontend hoy mezcla dos conceptos:

- `foto` → imagen principal / logo del local
- `imagenes[0]` → primera imagen de galería

Eso vuelve frágil la UI, porque permite que una imagen de galería termine usándose como identidad visual principal.

---

## Por qué NO parece un problema de render del frontend

Si el problema fuera puramente de render, componente o maquetado, esperaríamos que:

- la imagen fallara en ambas pantallas, o
- la URL renderizada fuera la misma pero mostrada incorrectamente

Sin embargo, la arquitectura actual consume **dos fuentes de datos distintas** para el mismo local.  
Por eso, una diferencia visual entre pantallas es totalmente compatible con un problema de datos de backend.

---

## Posibles causas concretas en backend

1. **`/clientes/listar_locales` devuelve datos desactualizados**
   - puede estar leyendo una vista, DTO o proyección vieja

2. **`foto` e `imagenes` no se sincronizan**
   - se actualiza la foto principal en un endpoint/proceso
   - pero la lista de locales sigue devolviendo otra referencia

3. **`/clientes/listar_locales` arma un DTO distinto al de `/locales/{id}/perfil`**
   - por ejemplo, uno usa `foto`
   - el otro usa `imagenes`
   - o ambos resuelven la imagen desde campos distintos

4. **Cache del lado backend/CDN**
   - menos probable, pero posible si la URL pública de la imagen no cambia y un endpoint queda cacheado

---

## Qué debe validar backend

Para el **mismo local**, comparar la respuesta real de:

### Endpoint 1

`POST /clientes/listar_locales`

Revisar:

- `foto`
- `imagenes`
- URL exacta de cada imagen

### Endpoint 2

`GET /locales/{id}/perfil`

Revisar:

- `foto`
- `imagenes`
- URL exacta de cada imagen

---

## Criterio de resolución

Backend debería garantizar una de estas dos cosas:

### Opción A — recomendada

Que **ambos endpoints devuelvan la misma imagen principal** del local en `foto`.

Ventaja:

- contrato claro
- frontend simple
- menos ambigüedad entre logo y galería

### Opción B

Que ambos endpoints devuelvan una estructura consistente donde quede explícito:

- cuál es la imagen principal del local
- cuáles son imágenes secundarias o de galería

Tradeoff:

- más flexible
- pero requiere contrato más explícito y alineación entre front y back

---

## Recomendación para backend

1. Verificar qué campo se actualiza realmente cuando cambia la imagen del local
2. Comparar el payload del mismo local en ambos endpoints
3. Unificar el contrato para que la imagen principal salga siempre del mismo campo
4. Evitar que la “primera imagen de galería” actúe implícitamente como logo principal, salvo que eso esté definido formalmente

---

## Veredicto técnico

Con la evidencia verificada en frontend:

- **problema principal:** backend
- **problema secundario:** contrato de datos débil entre `foto` e `imagenes`

No hay evidencia suficiente para culpar al componente visual de frontend como causa raíz.
