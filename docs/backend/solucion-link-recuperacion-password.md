# Solución backend — generación correcta del link de recuperación de contraseña

**Fecha:** 2026-06-28  
**Proyecto:** Foodly Front / integración con backend

---

## Problema detectado

El enlace real enviado por correo está llegando así:

```txt
https://frontend-proyecto-foodly-test.up.railway.app:8080/api/v1/usuarios/recuperar?token=&token=CgXp_KMjf4q_a_y4KYaNr12_jfu0KH8Ewewx9CHKK_8
```

Ese link tiene **dos errores**:

1. apunta al **endpoint del API/backend**
2. duplica el query param `token`, dejando uno vacío

Sin embargo, el frontend implementado espera que el usuario llegue a esta ruta pública:

```txt
/restablecer-contrasena?token=...
```

---

## Objetivo correcto del flujo

El flujo correcto debe ser:

1. backend genera el token de recuperación
2. backend arma un link público del **frontend**
3. backend envía ese link por correo
4. usuario abre el link
5. frontend muestra el formulario con:
   - nueva contraseña
   - confirmación de contraseña
6. frontend envía la nueva contraseña al backend junto con el token
7. frontend redirige al login al finalizar

---

## URL correcta que backend debe enviar

### Incorrecta

```txt
https://frontend-proyecto-foodly-test.up.railway.app:8080/api/v1/usuarios/recuperar?token=&token={TOKEN}
```

### Correcta

```txt
https://frontend-proyecto-foodly-test.up.railway.app/restablecer-contrasena?token={TOKEN}
```

---

## Cómo debe implementarlo backend

### 1. Definir una URL pública del frontend en configuración

Backend debe tener una variable configurable para la base pública del frontend.

Ejemplo:

```txt
FRONTEND_URL=https://frontend-proyecto-foodly-test.up.railway.app
```

**NO** debe reutilizar la base URL del API para construir el link del correo.

---

### 2. Construir el link contra la ruta pública del formulario

La ruta objetivo debe ser exactamente:

```txt
/restablecer-contrasena
```

Entonces el link final debe construirse así:

```txt
{FRONTEND_URL}/restablecer-contrasena?token={TOKEN}
```

---

### 3. Agregar el token una sola vez

El query string debe contener un único parámetro:

```txt
?token={TOKEN}
```

No debe generarse esto:

```txt
?token=&token={TOKEN}
```

Si aparece duplicado, el problema está en la lógica de concatenación de query params.

---

### 4. Aplicar URL encoding al token

Antes de insertar el token en la URL, backend debe codificarlo como query param.

Objetivo:

- evitar caracteres problemáticos
- garantizar una URL válida
- no depender de que el token actual “casualmente funcione”

---

### 5. Insertar el link final en el cuerpo del mail

El contenido del correo debe usar el link público del frontend ya armado, no el endpoint interno del API.

Ejemplo conceptual:

```txt
Hola,

para restablecer tu contraseña, ingresá al siguiente enlace:

https://frontend-proyecto-foodly-test.up.railway.app/restablecer-contrasena?token={TOKEN}
```

---

## Regla técnica importante

El endpoint del backend:

```txt
/api/v1/usuarios/recuperar
```

puede existir para **procesar** el cambio de contraseña, pero **no** es la URL que debe abrir el usuario desde el mail si el formulario vive en el frontend.

Si backend quisiera que el mail apunte al servidor directamente, entonces tendría que renderizar una vista HTML propia para resetear contraseña.

Ese **NO** es el flujo actual de este proyecto.

---

## Fórmula exacta a implementar

```txt
recoveryLink = FRONTEND_URL + "/restablecer-contrasena?token=" + urlEncode(token)
```

---

## Checklist de validación para backend

- [ ] existe una variable `FRONTEND_URL`
- [ ] `FRONTEND_URL` apunta al dominio público del frontend
- [ ] el mail usa `/restablecer-contrasena`
- [ ] el mail no usa `/api/v1/usuarios/recuperar`
- [ ] el query param `token` aparece una sola vez
- [ ] el token va codificado para URL
- [ ] el link final abre el formulario del frontend

---

## Resultado esperado

Cuando el usuario haga clic en el correo, debe abrirse:

```txt
https://frontend-proyecto-foodly-test.up.railway.app/restablecer-contrasena?token={TOKEN}
```

Y desde ahí:

1. completa nueva contraseña
2. confirma nueva contraseña
3. envía el formulario
4. vuelve a login

