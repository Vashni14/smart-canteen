import { useState } from 'react'
import { useCart } from '@context/CartContext'
import { formatCurrency } from '@utils/index'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80'

export default function CartItem({ item }) {
  const { updateQty, updateNote, removeItem } = useCart()
  const [showNote, setShowNote] = useState(!!item.note)
  const [imgError, setImgErr]   = useState(false)

  return (
    <div className="cart-item animate-slide-in">
      {/* Image */}
      <img
        src={imgError || !item.image ? PLACEHOLDER : item.image}
        alt={item.name}
        onError={() => setImgErr(true)}
        className="cart-item-image"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-bold text-secondary text-sm truncate">{item.name}</p>
            <p className="text-xs text-canteen-muted">{formatCurrency(item.price)} each</p>
          </div>
          {/* Remove */}
          <button
            onClick={() => removeItem(item._id)}
            className="text-canteen-muted hover:text-canteen-danger transition-colors p-1 flex-shrink-0"
            title="Remove item"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Qty + subtotal */}
        <div className="flex items-center justify-between mt-2">
          {/* Qty stepper */}
          <div className="qty-stepper">
            <button
              className="qty-btn"
              onClick={() => item.qty === 1 ? removeItem(item._id) : updateQty(item._id, item.qty - 1)}
            >
              {item.qty === 1 ? '×' : '−'}
            </button>
            <span className="qty-value">{item.qty}</span>
            <button className="qty-btn" onClick={() => updateQty(item._id, item.qty + 1)}>
              +
            </button>
          </div>

          <span className="price-text text-sm">{formatCurrency(item.price * item.qty)}</span>
        </div>

        {/* Note toggle */}
        <button
          onClick={() => setShowNote(v => !v)}
          className="text-xs text-primary font-semibold mt-1.5 hover:underline"
        >
          {showNote ? '− Hide note' : '+ Add note'}
        </button>

        {showNote && (
          <textarea
            value={item.note || ''}
            onChange={e => updateNote(item._id, e.target.value)}
            placeholder="e.g. No onions, extra sauce…"
            rows={2}
            className="form-textarea text-xs mt-1.5 resize-none"
            maxLength={120}
          />
        )}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
