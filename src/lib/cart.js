const CART_STORAGE_KEY = 'foodly_cart'

export function createEmptyCart() {
  return {
    restaurantId: null,
    restaurantName: '',
    items: [],
  }
}

export function loadCart() {
  const raw = localStorage.getItem(CART_STORAGE_KEY)
  if (!raw) return createEmptyCart()

  try {
    const parsed = JSON.parse(raw)
    return {
      restaurantId: parsed.restaurantId ?? null,
      restaurantName: parsed.restaurantName ?? '',
      items: Array.isArray(parsed.items) ? parsed.items : [],
    }
  } catch {
    return createEmptyCart()
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export function clearCartStorage() {
  localStorage.removeItem(CART_STORAGE_KEY)
}

export function getCartSubtotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function formatPrice(amount) {
  return `$ ${amount.toLocaleString('es-AR')}`
}
