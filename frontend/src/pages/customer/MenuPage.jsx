import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuService } from '@services/index'
import { useCart } from '@context/CartContext'
import { useAuth } from '@context/AuthContext'
import { useSocket } from '@context/SocketContext'
import { useDebounce } from '@hooks/useHelpers'
import FoodCard from '@components/common/FoodCard'
import CategoryFilter from '@components/common/CategoryFilter'
import SearchBar from '@components/common/SearchBar'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { EmptyMenu, EmptySearch } from '@components/common/EmptyState'
import Modal from '@components/common/Modal'
import { formatCurrency } from '@utils/index'
import toast from 'react-hot-toast'

export default function MenuPage() {
  const { user }             = useAuth()
  const { addItem, totalItems } = useCart()
  const { on, off }          = useSocket()
  const navigate             = useNavigate()

  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [qty, setQty]           = useState(1)
  const [note, setNote]         = useState('')

  const debouncedSearch = useDebounce(search, 350)

  // Fetch menu
  const fetchMenu = async () => {
    setLoading(true)
    try {
      const res = await menuService.getAll()
      setItems(res.data?.items || res.data || [])
    } catch {
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMenu() }, [])

  // Real-time menu updates from socket
  useEffect(() => {
    const handleUpdate = (updatedItem) => {
      setItems(prev => prev.map(i => i._id === updatedItem._id ? updatedItem : i))
    }
    const handleNew = (newItem) => {
      setItems(prev => [...prev, newItem])
    }
    on('menu:updated', handleUpdate)
    on('menu:added',   handleNew)
    return () => {
      off('menu:updated', handleUpdate)
      off('menu:added',   handleNew)
    }
  }, [on, off])

  // Filter + search
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchCat  = category === 'All' || item.category === category
      const matchSearch = !debouncedSearch ||
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [items, category, debouncedSearch])

  const available   = filtered.filter(i => i.available)
  const unavailable = filtered.filter(i => !i.available)

  const openDetail = (item) => {
    setSelected(item)
    setQty(1)
    setNote('')
  }

  const handleAddToCart = () => {
    if (!selected) return
    addItem(selected, qty, note)
    setSelected(null)
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }
    navigate('/cart')
  }

  return (
    <div className="page-container page-section animate-fade-in">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">Today's Menu</h1>
          <p className="section-subtitle">
            {loading ? 'Loading…' : `${items.filter(i => i.available).length} items available`}
          </p>
        </div>

        {/* Cart button */}
        {totalItems > 0 && (
          <button onClick={handleCheckout} className="btn-primary gap-2 self-start sm:self-auto">
            🛒 View Cart ({totalItems})
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="space-y-3 mb-7">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search dishes…"
        />
        <CategoryFilter active={category} onChange={setCategory} />
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton variant="food-grid" count={8} />
      ) : filtered.length === 0 ? (
        debouncedSearch ? <EmptySearch query={debouncedSearch} /> : <EmptyMenu />
      ) : (
        <div className="space-y-8">
          {/* Available */}
          {available.length > 0 && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {available.map((item, i) => (
                  <div key={item._id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <FoodCard item={item} onViewDetails={openDetail} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unavailable */}
          {unavailable.length > 0 && (
            <div>
              <p className="label-text mb-3">Currently Unavailable</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-60">
                {unavailable.map(item => (
                  <FoodCard key={item._id} item={item} onViewDetails={openDetail} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={null}
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            {/* Image */}
            <div className="rounded-xl overflow-hidden aspect-food bg-canteen-bg -mx-5 -mt-5 mb-0">
              <img
                src={selected.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                alt={selected.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }}
              />
            </div>

            {/* Details */}
            <div className="px-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold text-secondary text-lg">{selected.name}</h3>
                {!selected.available && <span className="badge-danger flex-shrink-0">Unavailable</span>}
              </div>
              {selected.description && (
                <p className="text-sm text-canteen-muted mt-1">{selected.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-canteen-muted">
                {selected.preparationTime && (
                  <span>⏱ {selected.preparationTime} min</span>
                )}
                <span className="badge-neutral capitalize">{selected.category}</span>
              </div>

              <div className="divider" />

              {/* Qty stepper */}
              <div className="flex items-center justify-between mb-3">
                <span className="form-label mb-0">Quantity</span>
                <div className="qty-stepper">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="qty-value">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. No spice, extra sauce…"
                  rows={2}
                  className="form-textarea text-sm"
                  maxLength={120}
                />
              </div>

              {/* Price summary */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-canteen-muted">
                  {formatCurrency(selected.price)} × {qty}
                </span>
                <span className="price-text-lg">{formatCurrency(selected.price * qty)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={!selected.available}
              className="btn-primary w-full btn-lg"
            >
              {selected.available ? `Add to Cart — ${formatCurrency(selected.price * qty)}` : 'Item Unavailable'}
            </button>
          </div>
        )}
      </Modal>

    </div>
  )
}
