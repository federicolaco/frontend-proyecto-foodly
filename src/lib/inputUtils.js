export function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

// Busca el primer campo requerido vacío dentro de un <form>, para poder
// avisar con un toast en vez de dejar que el navegador muestre su globo
// de validación nativo pegado al campo.
export function findEmptyRequiredField(formElement) {
  if (!formElement) return null

  const fields = formElement.querySelectorAll('[required]')

  for (const field of fields) {
    if (field.disabled) continue

    if (field.type === 'checkbox' || field.type === 'radio') {
      if (!field.checked) return field
    } else if (!String(field.value ?? '').trim()) {
      return field
    }
  }

  return null
}

// Valida los campos requeridos de un formulario y, si falta alguno,
// muestra un toast de error (arriba a la derecha) y enfoca el campo.
// Devuelve true si el formulario es válido y se puede continuar.
export function validateRequiredFields(formElement, toast, message = 'Completá todos los campos obligatorios.') {
  const missing = findEmptyRequiredField(formElement)

  if (missing) {
    toast.error(message)
    missing.focus()
    return false
  }

  return true
}