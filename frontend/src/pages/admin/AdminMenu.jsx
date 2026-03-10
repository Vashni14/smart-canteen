import { useState, useEffect } from 'react'
import { menuService } from '@services/index'
import { useDisclosure } from '@hooks/useHelpers'
import Modal from '@components/common/Modal'
import ConfirmDialog from '@components/common/ConfirmDialog'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import SearchBar from '@components/common/SearchBar'
import CategoryFilter from '@components/common/CategoryFilter'
import { formatCurrency } from '@utils/index'
import { CATEGORIES } from '@utils/index'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', description: '', price: '', category: 'Snacks',
  image: '', preparationTime: '', available: true,
}

export default function AdminMenu() {
  const [items,    setItems]   = useState([])
  const [loading,  setLoad]    = useState(true)
  const [search,   setSearch]  = useState('')
  const [cat,      setCat]     = useState('All')
  const [form,     setForm]    = useState(EMPTY_FORM)
  const [editing,  setEditing] = useState(null)   // item being edited
  const [saving,   setSaving]  = useState(false)
  const [delTarget,setDelTarget]= useState(null)
  const [delLoading,setDelLoad]= useState(false)
  const { isOpen, open, close }= useDisclosure()

  const fetchMenu = async () => {
    setLoad(true)
    try {
      const res = await menuService.getAll()
      setItems(res.data?.items || res.data || [])
    } catch { toast.error('Failed to load menu') }
    finally { setLoad(false) }
  }

  useEffect(() => { fetchMenu() }, [])

  /* ── Filter ─────────────────────────────────────────── */
  const filtered = items.filter(i => {
    const matchCat    = cat === 'All' || i.category === cat
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  /* ── Open add/edit modal ────────────────────────────── */
  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    open()
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name:            item.name,
      description:     item.description || '',
      price:           item.price,
      category:        item.category,
      image:           item.image || '',
      preparationTime: item.preparationTime || '',
      available:       item.available,
    })
    open()
  }

  /* ── Save (create or update) ─────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim())  return toast.error('Name is required')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      return toast.error('Enter a valid price')
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), preparationTime: Number(form.preparationTime) || 5 }
      if (editing) {
        const res = await menuService.update(editing._id, payload)
        setItems(prev => prev.map(i => i._id === editing._id ? (res.data?.item || res.data) : i))
        toast.success('Menu item updated!')
      } else {
        const res = await menuService.create(payload)
        setItems(prev => [...prev, res.data?.item || res.data])
        toast.success('Menu item added!')
      }
      close()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  /* ── Toggle availability ─────────────────────────────── */
  const handleToggle = async (item) => {
    // Warn if toggling unavailable while orders exist for this item
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, available: !i.available } : i))
    try {
      await menuService.toggleAvail(item._id)
      toast.success(`${item.name} marked as ${item.available ? 'unavailable' : 'available'}`)
    } catch {
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, available: item.available } : i))
      toast.error('Failed to update availability')
    }
  }

  /* ── Delete ──────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!delTarget) return
    setDelLoad(true)
    try {
      await menuService.delete(delTarget._id)
      setItems(prev => prev.filter(i => i._id !== delTarget._id))
      toast.success(`"${delTarget.name}" deleted`)
      setDelTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally { setDelLoad(false) }
  }

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Menu Management</h2>
          <p className="section-subtitle">{items.length} items · {items.filter(i => i.available).length} available</p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-2">+ Add Item</button>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search menu items…" />
        <CategoryFilter active={cat} onChange={setCat} />
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={6} /> : (
        <div className="table-container overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                <th className="table-th">Item</th>
                <th className="table-th">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th">Prep Time</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-canteen-muted py-10">No items found</td></tr>
              ) : filtered.map(item => (
                <tr key={item._id} className="table-tr">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=60'}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&q=60' }}
                      />
                      <div>
                        <p className="font-semibold text-secondary text-sm">{item.name}</p>
                        <p className="text-xs text-canteen-muted line-clamp-1 max-w-[200px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="badge-neutral capitalize">{item.category}</span>
                  </td>
                  <td className="table-td">
                    <span className="price-text text-sm">{formatCurrency(item.price)}</span>
                  </td>
                  <td className="table-td text-sm text-canteen-muted">
                    {item.preparationTime || 5} min
                  </td>
                  <td className="table-td">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.available ? 'bg-canteen-success' : 'bg-canteen-border'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        item.available ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="btn-ghost btn-sm">Edit</button>
                      <button onClick={() => setDelTarget(item)} className="btn-sm text-canteen-danger hover:bg-red-50 btn">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={editing ? 'Edit Menu Item' : 'Add New Item'}
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={close} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Item Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Masala Dosa" />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={form.description} onChange={set('description')} placeholder="Short description…" />
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input className="form-input" type="number" min="1" value={form.price} onChange={set('price')} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Prep Time (min)</label>
              <input className="form-input" type="number" min="1" value={form.preparationTime} onChange={set('preparationTime')} placeholder="5" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Available</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.available} onChange={set('available')} className="w-4 h-4 accent-primary" id="avail" />
                <label htmlFor="avail" className="text-sm font-semibold text-secondary cursor-pointer">
                  {form.available ? 'Available for order' : 'Currently unavailable'}
                </label>
              </div>
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Image URL</label>
              <input className="form-input" value={form.image} onChange={set('image')} placeholder="https://…" />
              {form.image && (
                <img src={form.image} alt="preview" className="mt-2 h-24 w-full object-cover rounded-xl"
                  onError={e => e.target.style.display='none'} />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${delTarget?.name}"?`}
        message="This will permanently remove the item from the menu. Active orders containing this item will not be affected."
        confirmLabel="Delete"
        danger
        loading={delLoading}
      />

    </div>
  )
}
