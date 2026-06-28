# Diagnóstico front/back — recuperación de contraseña por correo

**Fecha:** 2026-06-28  
**Proyecto:** Foodly Front  
**Endpoint analizado:** `POST /api/v1/usuarios/recuperar_contra_correo`

---

## Resumen ejecutivo

Se confirmó un desajuste de contrato entre frontend y backend en el flujo de recuperación de contraseña por correo.

### Qué se encontró

El backend documentó que el endpoint ahora espera un JSON con esta forma:

```json
{
  "correo": "usuario@mail.com"
}
```

Sin embargo, el frontend estaba enviando un **string JSON crudo**:

```json
"usuario@mail.com"
```

### Qué se corrigió en frontend

Se actualizó el request del frontend para que envíe el body con la forma esperada por backend:

```json
{
  "correo": "usuario@mail.com"
}
```

Archivo corregido:

- `frontend-proyecto-foodly/src/api/account.js`

---

## Evidencia verificada

### Contrato esperado por backend

Según la documentación compartida por backend, el endpoint:

- espera `Content-Type: application/json`
- espera un body con clave `correo`
- ya no acepta un `String` crudo en el body

### Implementación previa del frontend

Se verificó en `frontend-proyecto-foodly/src/api/account.js` que el frontend enviaba:

```js
body: JSON.stringify(email.trim())
```

Eso produce un body inválido para el contrato actual del backend.

### Implementación corregida

Ahora el frontend envía:

```js
body: JSON.stringify({ correo: email.trim() })
```

### Qué YA estaba bien en frontend

- la ruta `/usuarios/recuperar_contra_correo`
- el método `POST`
- el header `Content-Type: application/json`

El problema principal estaba en la **forma del payload**.

---

## Conclusión técnica

Antes de la corrección, el problema más probable era un **mismatch de contrato front-back**.

Si backend intentaba deserializar un objeto y recibía un string, eso podía derivar en:

- error de deserialización JSON
- `HttpMessageNotReadableException`
- o un `500` si la excepción se estaba transformando incorrectamente en error interno

---

## Sospechas para backend si el `500` persiste

Si después de esta corrección el endpoint sigue devolviendo `500`, entonces el foco debe pasar a backend o infraestructura.

### 1. Tabla faltante: `token_recuperacion_passwd`

La documentación de backend indica que el flujo nuevo guarda tokens de recuperación.  
Si la tabla no existe o la migración no fue aplicada, el endpoint puede fallar al persistir el token.

**Síntomas esperables en logs:**

- `relation "token_recuperacion_passwd" does not exist`
- errores SQL al hacer `INSERT` o `UPDATE`

### 2. Manejo incorrecto de excepciones

Si backend transforma errores de request inválido en `500`, el diagnóstico queda contaminado.

**Lo correcto sería distinguir al menos:**

- `400` para body inválido o deserialización fallida
- `500` solo para errores internos reales

### 3. Problemas de schema, permisos o conexión

Aunque el contrato del request esté bien, el endpoint puede seguir fallando por:

- columnas faltantes
- permisos insuficientes sobre la tabla
- problemas de conexión a la base

### 4. Respuesta no alineada con el criterio de seguridad esperado

El flujo debería responder de forma neutra incluso si el correo no existe, por ejemplo:

> Si el correo ingresado está asociado a una cuenta, recibirá un enlace de recuperación en breve.

Esto evita filtrado de información sobre cuentas registradas.

---

## Recomendaciones para backend

1. **Reprobar el endpoint** ahora que frontend ya envía `{ "correo": "..." }`
2. **Revisar logs** del endpoint si persiste el `500`
3. **Verificar migraciones** relacionadas con `token_recuperacion_passwd`
4. **Confirmar el mapeo del DTO/request body** esperado por el controlador
5. **Ajustar manejo de errores** para que un body inválido no termine como `500`
6. **Mantener respuesta neutra** para no filtrar existencia de correos

---

## Estado actual

### Solucionado en frontend

- Se alineó el body del request con el contrato documentado por backend

### Pendiente de validación

- confirmar si el `500` desaparece con el payload corregido
- si persiste, aislar el error real desde logs y base de datos

---

## Mensaje sugerido para seguimiento entre equipos

> Frontend ya fue ajustado para enviar `POST /api/v1/usuarios/recuperar_contra_correo` con body JSON `{ "correo": "..." }`.  
> Si el endpoint sigue devolviendo `500`, el siguiente foco de análisis debería ser backend/base de datos, especialmente migraciones y acceso a `token_recuperacion_passwd`.
