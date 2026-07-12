import { clearSessionToken, getSessionToken, getStoredUser, setStoredUser } from '../lib/auth'
import { apiFetch, apiFetchMultipart, apiFetchSafe, isApiConfigured } from './client'
import { formatAddress, normalizeAddress } from './backend/helpers'
import { mapRatingSummary } from './backend/mappers'
import {
  mockActivateAccount,
  mockConfirmEmailChange,
  mockConfirmPasswordChange,
  mockDeleteAccount,
  mockRequestPasswordRecovery,
  mockResendActivationLink,
  mockResetPassword,
  mockStartEmailChange,
  mockStartPasswordChange,
  mockUpdateProfile,
  mockVerifyPasswordCode,
} from './mock/accountMock'
import { mockGetClientRatingDetails, mockGetClientRatingSummary } from './mock/ratingsMock'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function resolvePhotoUrl(photo) {
  if (!photo) return undefined
  if (typeof photo === 'string') return photo
  if (isApiConfigured()) return URL.createObjectURL(photo)
  return fileToDataUrl(photo)
}

export async function updateProfile(payload) {
  const user = getStoredUser()
  const address = normalizeAddress(payload.address)
  const photoUrl = payload.photo ? await resolvePhotoUrl(payload.photo) : undefined

  if (isApiConfigured()) {
    const formData = new FormData()

    if (user.role === 'cliente') {
      if (payload.firstName) formData.append('nombre', payload.firstName.trim())
      if (payload.lastName) formData.append('apellido', payload.lastName.trim())
      if (payload.cellphone?.trim()) formData.append('celular', payload.cellphone.trim())
    }
    if (user.role === 'local') {
      if (payload.name) formData.append('nombre', payload.name.trim())
      if (payload.description) formData.append('descripcion', payload.description.trim())
      if (payload.cellphone?.trim()) formData.append('celular', payload.cellphone.trim())
      if (payload.landline?.trim()) formData.append('telefonoFijo', payload.landline.trim())
    }
    if (payload.address) {
      formData.append('direccion.calle', address.calle)
      formData.append('direccion.numero', address.numero)
      formData.append('direccion.ciudad', address.ciudad)
      formData.append('direccion.codigoPostal', address.codigoPostal)
    }
    if (payload.photo) {
      formData.append('foto', payload.photo)
    }

    await apiFetchMultipart('/usuarios/perfil', formData, { method: 'PUT' })
  } else {
    await mockUpdateProfile(getSessionToken(), { ...payload, photoUrl })
  }

  const displayName =
    payload.name ??
    ([payload.firstName, payload.lastName].filter(Boolean).join(' ') || user.name)
  const updated = {
    ...user,
    name: displayName,
    firstName: payload.firstName ?? user.firstName,
    lastName: payload.lastName ?? user.lastName,
    description: payload.description ?? user.description,
    address: formatAddress(address),
    addressDetails: address,
    cellphone: payload.cellphone?.trim() || user.cellphone,
    landline: payload.landline?.trim() || user.landline,
    ...(photoUrl ? { photo: photoUrl } : {}),
  }
  setStoredUser(updated)
  return updated
}

export async function startEmailChange(nuevoCorreo) {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/cambiar-correo/iniciar', {
      method: 'POST',
      body: JSON.stringify({ nuevoCorreo: nuevoCorreo.trim() }),
    })
    return { message: 'Te enviamos un enlace de confirmación a tu correo actual. Revisalo para completar el cambio.' }
  }

  return mockStartEmailChange(getSessionToken(), nuevoCorreo)
}

export async function confirmEmailChange(token) {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/cambiar-correo/confirmar', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    return { message: 'Correo actualizado correctamente. Iniciá sesión nuevamente.' }
  }

  return mockConfirmEmailChange(token)
}

export async function startPasswordChange(currentPassword) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    await apiFetch('/usuarios/cambiar-passwd/iniciar', {
      method: 'POST',
      body: JSON.stringify({ idUsuario: user.id, passwdActual: currentPassword }),
    })
    return { message: 'Se ha enviado un código de 6 dígitos a su correo.' }
  }

  return mockStartPasswordChange(getSessionToken(), currentPassword)
}

export async function verifyPasswordChangeCode(code) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    await apiFetch('/usuarios/cambiar-passwd/verificar-codigo', {
      method: 'POST',
      body: JSON.stringify({ idUsuario: user.id, codigo: code }),
    })
    return { verified: true }
  }

  return mockVerifyPasswordCode(getSessionToken(), code)
}

export async function activateAccount(token) {
  if (isApiConfigured()) {
    await apiFetch(`/usuarios/activar?token=${encodeURIComponent(token)}`, { method: 'POST' })
    return { message: 'Cuenta activada correctamente.' }
  }

  return mockActivateAccount(token)
}

export async function resendActivationLink(email) {
  if (isApiConfigured()) {
    const message = await apiFetch('/usuarios/reenviar-activacion', {
      method: 'POST',
      body: JSON.stringify({ correo: email.trim() }),
      headers: { 'Content-Type': 'application/json' },
    })
    return { message: message ?? 'Te reenviamos el correo de activación.' }
  }

  return mockResendActivationLink(email)
}

export async function confirmPasswordChange(newPassword, confirmPassword) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    await apiFetch('/usuarios/cambiar-passwd/confirmar', {
      method: 'POST',
      body: JSON.stringify({
        idUsuario: user.id,
        passwdNueva: newPassword,
        passwdConfirmacion: confirmPassword,
      }),
    })
    return { message: 'Contraseña actualizada correctamente.' }
  }

  return mockConfirmPasswordChange(getSessionToken(), newPassword, confirmPassword)
}

export async function requestPasswordRecovery(email) {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/recuperar_contra_correo', {
      method: 'POST',
      body: JSON.stringify({ correo: email.trim() }),
      headers: { 'Content-Type': 'application/json' },
    })
    return {
      message: 'Si el correo ingresado está asociado a una cuenta, recibirá un enlace de recuperación.',
    }
  }

  return mockRequestPasswordRecovery(email)
}

export async function resetPassword(token, newPassword, confirmPassword) {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/recuperar', {
      method: 'POST',
      body: JSON.stringify({
        token,
        nuevaPasswd: newPassword,
        confirmacionPasswd: confirmPassword,
      }),
    })
    return { message: 'Contraseña restablecida. Ya puede iniciar sesión.' }
  }

  return mockResetPassword(token, newPassword)
}

export async function deleteAccount() {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/mi-cuenta', { method: 'DELETE' })
    clearSessionToken()
    return { deleted: true }
  }

  return mockDeleteAccount(getSessionToken())
}

export async function getMyClientRating() {
  if (isApiConfigured()) {
    const user = getStoredUser()
    const data = await apiFetchSafe(`/calificaciones/${user.id}/calificacion`)
    return mapRatingSummary(data)
  }

  return mockGetClientRatingSummary(getSessionToken())
}

export async function getMyClientRatingDetails() {
  if (isApiConfigured()) {
    const user = getStoredUser()
    const data = await apiFetchSafe(`/calificaciones/${user.id}/calificacion/detalle`)
    return (data ?? []).map((d) => ({
      localId: d.idLocal,
      localName: d.nombreLocal,
      score: d.puntaje,
      comment: d.comentario ?? '',
      createdAt: d.fecha,
    }))
  }

  return mockGetClientRatingDetails(getSessionToken())
}