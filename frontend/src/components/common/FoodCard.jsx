import { useState } from 'react'
import { useCart } from '@context/CartContext'
import { formatCurrency } from '@utils/index'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'

const CATEGORY_COLORS = {
  Breakfast: 'bg-yellow-100 text-yellow-700',
  Snacks:    'bg-orange-100 text-orange-700',
  Lunch:     'bg-green-100 text-green-700',
  Dinner:    'bg-blue-100 text-blue-700',
  Beverages: 'bg-cyan-100 text-cyan-700',
  Desserts:  'bg-pink-100 text-pink-700',
}

export default function FoodCard({ item, onViewDetails }) {
  const { addItem, items } = useCart()
  const [adding, setAdding]   = useState(false)
  const [imgError, setImgErr] = useState(false)

  const inCart   = items.find(i => i._id === item._id)
  const catColor = CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'

  const handleAdd = async (e) => {
    e.stopPropagation()
    if (!item.available) return
    setAdding(true)
    addItem(item, 1)
    await new Promise(r => setTimeout(r, 600))
    setAdding(false)
  }

  return (
    <div
      className="food-card group animate-fade-in"
      onClick={() => onViewDetails?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onViewDetails?.(item)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-canteen-bg aspect-food">
        <img
          src={imgError || !item.image ? PLACEHOLDER : item.image}
          alt={item.name}
          onError={() => setImgErr(true)}
          className="food-card-image group-hover:scale-105 transition-transform duration-500"
        />

        {/* Unavailable overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="badge bg-canteen-danger text-white text-xs font-bold px-3 py-1.5">
              Unavailable
            </span>
          </div>
        )}

        {/* Category badge */}
        <span className={`absolute top-2.5 left-2.5 badge text-xs ${catColor}`}>
          {item.category}
        </span>

        {/* In-cart indicator */}
        {inCart && (
          <span className="absolute top-2.5 right-2.5 w-6 h-6 bg-canteen-success text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
            {inCart.qty}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="food-card-body">
        <p className="food-card-name">{item.name}</p>
        <p className="food-card-desc">{item.description}</p>

        {/* Prep time */}
        {item.preparationTime && (
          <p className="text-xs text-canteen-muted mt-1.5 flex items-center gap-1">
            <ClockIcon /> {item.preparationTime} min
          </p>
        )}

        {/* Footer: price + add button */}
        <div className="food-card-footer">
          <span className="price-text">{formatCurrency(item.price)}</span>

          <button
            onClick={handleAdd}
            disabled={!item.available || adding}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
              transition-all duration-200 active:scale-95
              ${item.available
                ? 'bg-primary text-white hover:bg-primary-600 shadow-primary'
                : 'bg-canteen-border text-canteen-muted cursor-not-allowed'}
            `}
          >
            {adding ? (
              <span className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1 h-1 bg-white rounded-full animate-bounce-dot"
                    style={{ animationDelay: `${i * 0.16}s` }} />
                ))}
              </span>
            ) : (
              <>
                <span className="text-base leading-none">+</span> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
