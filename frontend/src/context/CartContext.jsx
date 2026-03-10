import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

const CART_KEY = 'sc_cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  // Persist whenever cart changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((menuItem, qty = 1, note = '') => {
    setItems(prev => {
      const existing = prev.find(i => i._id === menuItem._id)
      if (existing) {
        toast.success(`${menuItem.name} quantity updated`)
        return prev.map(i =>
          i._id === menuItem._id
            ? { ...i, qty: i.qty + qty, note: note || i.note }
            : i
        )
      }
      toast.success(`${menuItem.name} added to cart`)
      return [...prev, { ...menuItem, qty, note }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i._id !== id))
  }, [])

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return
    setItems(prev => prev.map(i => i._id === id ? { ...i, qty } : i))
  }, [])

  const updateNote = useCallback((id, note) => {
    setItems(prev => prev.map(i => i._id === id ? { ...i, note } : i))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }, [])

  const totalItems  = items.reduce((sum, i) => sum + i.qty, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, updateNote, clearCart,
      totalItems, totalAmount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
