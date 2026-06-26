import { clearSessionToken, getSessionToken, getStoredUser, setStoredUser } from '../lib/auth'
import { apiFetch, apiFetchMultipart, apiFetchSafe, isApiConfigured } from './client'
import { createPlaceholderImage, formatAddress, normalizeAddress } from './backend/helpers'
import { mapRatingSummary } from './backend/mappers'
import {
  mockConfirmPasswordChange,
  mockDeleteAccount,
  mockRequestPasswordRecovery,
  mockResetPassword,
  mockStartPasswordChange,
  mockUpdateProfile,
  mockVerifyPasswordCode,
} from './mock/accountMock'
import { mockGetClientRatingSummary } from './mock/ratingsMock'

export async function updateProfile(payload) {
  if (isApiConfigured()) {
    const user = getStoredUser()
    const address = normalizeAddress(payload.address)
    const formData = new FormData()

    if (user.role === 'cliente') {
      if (payload.firstName) formData.append('nombre', payload.firstName.trim())
      if (payload.lastName) formData.append('apellido', payload.lastName.trim())
    }
    if (user.role === 'local') {
      if (payload.name) formData.append('nombre', payload.name.trim())
      if (payload.description) formData.append('descripcion', payload.description.trim())
    }
    if (payload.address) {
      formData.append('direccion.calle', address.calle)
      formData.append('direccion.numero', address.numero)
      formData.append('direccion.ciudad', address.ciudad)
      formData.append('direccion.codigoPostal', address.codigoPostal)
    }
    if (payload.photo) {
      formData.append('foto', payload.photo)
    } else if (payload.photo !== undefined) {
      formData.append('foto', createPlaceholderImage('perfil.png'))
    }

    await apiFetchMultipart('/usuarios/perfil', formData, { method: 'PUT' })

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
    }
    setStoredUser(updated)
    return updated
  }

  return mockUpdateProfile(getSessionToken(), payload)
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
      body: JSON.stringify(email.trim()),
      headers: { 'Content-Type': 'application/json' },
    })
    return {
      message: 'Si el correo ingresado está asociado a una cuenta, recibirá un enlace de recuperación.',
    }
  }

  return mockRequestPasswordRecovery(email)
}

export async function resetPassword(token, newPassword) {
  if (isApiConfigured()) {
    await apiFetch('/usuarios/recuperar', {
      method: 'POST',
      body: JSON.stringify({ token, nuevaPasswd: newPassword }),
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
