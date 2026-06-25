import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createEmptyCart, getCartSubtotal, loadCart, saveCart } from '../lib/cart'

const CartContext = createContext(null)

function normalizeCartItem(product, quantity) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image ?? null,
    quantity,
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart)

  const updateCart = useCallback((updater) => {
    setCart((prev) => {
      const nextCart = typeof updater === 'function' ? updater(prev) : updater
      saveCart(nextCart)
      return nextCart
    })
  }, [])

  const clearCart = useCallback(() => {
    updateCart(createEmptyCart())
  }, [updateCart])

  const addToCart = useCallback(
    (restaurant, product, quantity = 1) => {
      updateCart((prev) => {
        const isDifferentRestaurant =
          prev.restaurantId && prev.restaurantId !== restaurant.id

        const baseCart = isDifferentRestaurant ? createEmptyCart() : { ...prev }
        const existing = baseCart.items.find((item) => item.id === product.id)

        if (existing) {
          return {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            items: baseCart.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          }
        }

        return {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          items: [...baseCart.items, normalizeCartItem(product, quantity)],
        }
      })
    },
    [updateCart],
  )

  const updateQuantity = useCallback(
    (productId, quantity) => {
      updateCart((prev) => {
        if (quantity <= 0) {
          const nextItems = prev.items.filter((item) => item.id !== productId)
          return {
            ...prev,
            items: nextItems,
            restaurantId: nextItems.length ? prev.restaurantId : null,
            restaurantName: nextItems.length ? prev.restaurantName : '',
          }
        }

        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        }
      })
    },
    [updateCart],
  )

  const removeFromCart = useCallback(
    (productId) => {
      updateCart((prev) => {
        const nextItems = prev.items.filter((item) => item.id !== productId)
        return {
          ...prev,
          items: nextItems,
          restaurantId: nextItems.length ? prev.restaurantId : null,
          restaurantName: nextItems.length ? prev.restaurantName : '',
        }
      })
    },
    [updateCart],
  )

  const value = useMemo(() => {
    const subtotal = getCartSubtotal(cart.items)
    const total = subtotal

    return {
      cart,
      subtotal,
      total,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }
  }, [addToCart, cart, clearCart, removeFromCart, updateQuantity])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
