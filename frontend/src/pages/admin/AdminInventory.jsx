import { useState, useEffect } from 'react'
import { inventoryService } from '@services/index'
import { useDisclosure } from '@hooks/useHelpers'
import Modal from '@components/common/Modal'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import SearchBar from '@components/common/SearchBar'
import { formatDate } from '@utils/index'
import toast from 'react-hot-toast'

const EMPTY_ITEM = { itemName: '', stock: '', threshold: '', unit: 'units' }

export default function AdminInventory() {
  const [items,   setItems]  = useState([])
  const [loading, setLoad]   = useState(true)
  const [error,   setError]  = useState('')
  const [search,  setSearch] = useState('')
  const [filter,  setFilter] = useState('all')

  // Edit modal
  const [editing, setEdit]   = useState(null)
  const [editForm, setEditF] = useState({ stock: '', threshold: '' })
  const [saving,  setSaving] = useState(false)
  const { isOpen: editOpen, open: openEdit_, close: closeEdit } = useDisclosure()

  // Restock modal
  const [restockItem, setRestockItem] = useState(null)
  const [restockQty,  setRestockQty]  = useState('')
  const { isOpen: restockOpen, open: openRestock_, close: closeRestock } = useDisclosure()

  // Add new item modal
  const [newItem, setNewItem] = useState(EMPTY_ITEM)
  const { isOpen: addOpen, open: openAdd, close: closeAdd } = useDisclosure()

  const fetchInventory = async () => {
    setLoad(true)
    setError('')
    try {
      const res = await inventoryService.getAll()
      setItems(res.data?.inventory || res.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load inventory')
      toast.error('Failed to load inventory')
    } finally { setLoad(false) }
  }

  useEffect(() => { fetchInventory() }, [])

  /* ── Filter ──────────────────────────────────────────────── */
  const filtered = items.filter(i => {
    const name = (i.itemName || '').toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const isLow       = i.stock <= i.threshold
    const matchFilter = filter === 'all' || (filter === 'low' && isLow) || (filter === 'ok' && !isLow)
    return matchSearch && matchFilter
  })

  const lowCount = items.filter(i => i.stock <= i.threshold).length

  /* ── Open modals ─────────────────────────────────────────── */
  const openEdit = (item) => {
    setEdit(item)
    setEditF({ stock: item.stock, threshold: item.threshold })
    openEdit_()
  }

  const openRestock = (item) => {
    setRestockItem(item)
    setRestockQty('')
    openRestock_()
  }

  /* ── Save edit ───────────────────────────────────────────── */
  const handleSave = async () => {
    const stock     = Number(editForm.stock)
    const threshold = Number(editForm.threshold)
    if (isNaN(stock) || stock < 0)         return toast.error('Invalid stock value')
    if (isNaN(threshold) || threshold < 0) return toast.error('Invalid threshold')
    setSaving(true)
    try {
      const res = await inventoryService.update(editing._id, { stock, threshold })
      const updated = res.data?.item || res.data
      setItems(prev => prev.map(i => i._id === editing._id ? updated : i))
      toast.success('Inventory updated')
      closeEdit()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  /* ── Restock ─────────────────────────────────────────────── */
  const handleRestock = async () => {
    const qty = Number(restockQty)
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')
    setSaving(true)
    try {
      await inventoryService.restock({ itemId: restockItem._id, quantity: qty })
      setItems(prev => prev.map(i =>
        i._id === restockItem._id ? { ...i, stock: i.stock + qty } : i
      ))
      toast.success(`Added ${qty} units to ${restockItem.itemName}`)
      closeRestock()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Restock failed')
    } finally { setSaving(false) }
  }

  /* ── Add new item ────────────────────────────────────────── */
  const handleAddItem = async () => {
    if (!newItem.itemName.trim()) return toast.error('Item name is required')
    if (Number(newItem.stock) < 0) return toast.error('Stock cannot be negative')
    setSaving(true)
    try {
      const res = await inventoryService.create({
        itemName:  newItem.itemName.trim(),
        stock:     Number(newItem.stock) || 0,
        threshold: Number(newItem.threshold) || 10,
        unit:      newItem.unit || 'units',
      })
      const item = res.data?.item || res.data
      setItems(prev => [...prev, item].sort((a, b) => a.itemName.localeCompare(b.itemName)))
      toast.success(`${newItem.itemName} added to inventory`)
      setNewItem(EMPTY_ITEM)
      closeAdd()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add item')
    } finally { setSaving(false) }
  }

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-canteen-danger font-semibold">{error}</p>
        <button onClick={fetchInventory} className="btn-primary">Try Again</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Inventory Management</h2>
          <p className="section-subtitle">
            {items.length} items tracked · {lowCount > 0
              ? <span className="text-canteen-warning font-bold">{lowCount} low stock</span>
              : <span className="text-canteen-success">All stocked</span>
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInventory} className="btn-ghost btn-sm">🔄 Refresh</button>
          <button onClick={openAdd} className="btn-primary btn-sm">+ Add Item</button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-800">{lowCount} item{lowCount > 1 ? 's' : ''} below threshold</p>
            <p className="text-sm text-yellow-700">Restock soon to avoid running out.</p>
          </div>
          <button
            onClick={() => setFilter('low')}
            className="text-xs font-bold text-yellow-800 bg-yellow-200 hover:bg-yellow-300 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
          >
            Show Low
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search items…" />
        </div>
        <div className="flex gap-1 p-1 bg-canteen-bg rounded-xl w-fit">
          {[['all','All'],['low','⚠ Low'],['ok','✅ OK']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={val === filter
                ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-white text-secondary shadow-card'
                : 'px-4 py-2 rounded-lg text-sm font-semibold text-canteen-muted hover:text-secondary'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={6} /> : (
        <div className="overflow-x-auto rounded-2xl border border-canteen-border bg-white">
          <table className="w-full text-left">
            <thead className="bg-canteen-bg border-b border-canteen-border">
              <tr>
                {['Item Name','Stock','Threshold','Status','Last Updated','Actions'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-bold text-canteen-muted uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-canteen-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-canteen-muted">
                    {search ? `No items matching "${search}"` : 'No inventory items yet'}
                  </td>
                </tr>
              ) : filtered.map(item => {
                const isOut = item.stock === 0
                const isLow = item.stock <= item.threshold
                return (
                  <tr key={item._id} className={`hover:bg-canteen-bg/50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3.5 font-semibold text-secondary">{item.itemName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold font-mono text-lg ${
                        isOut ? 'text-canteen-danger' : isLow ? 'text-canteen-warning' : 'text-canteen-success'
                      }`}>
                        {item.stock}
                      </span>
                      <span className="text-xs text-canteen-muted ml-1">{item.unit || 'units'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-canteen-muted">{item.threshold} {item.unit || 'units'}</td>
                    <td className="px-4 py-3.5">
                      {isOut
                        ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Out of Stock</span>
                        : isLow
                        ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Low Stock</span>
                        : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">In Stock</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-xs text-canteen-muted">
                      {item.updatedAt ? formatDate(item.updatedAt) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openRestock(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          + Restock
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-canteen-bg text-canteen-muted hover:text-secondary hover:bg-canteen-border/50 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={closeEdit} title={`Edit: ${editing?.itemName || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Current Stock</label>
            <input
              type="number" min="0"
              className="form-input w-full"
              value={editForm.stock}
              onChange={e => setEditF(v => ({ ...v, stock: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Low Stock Threshold</label>
            <input
              type="number" min="0"
              className="form-input w-full"
              value={editForm.threshold}
              onChange={e => setEditF(v => ({ ...v, threshold: e.target.value }))}
            />
            <p className="text-xs text-canteen-muted mt-1">Alert when stock reaches this level</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={closeEdit} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Restock Modal ───────────────────────────────── */}
      <Modal isOpen={restockOpen} onClose={closeRestock} title={`Restock: ${restockItem?.itemName || ''}`} size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-canteen-bg rounded-xl">
            <span className="text-sm text-canteen-muted">Current stock</span>
            <span className="font-bold font-mono text-secondary">{restockItem?.stock} {restockItem?.unit || 'units'}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Quantity to Add</label>
            <input
              type="number" min="1"
              className="form-input w-full"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
          </div>
          {restockQty && !isNaN(restockQty) && Number(restockQty) > 0 && (
            <p className="text-sm font-semibold text-canteen-success">
              New total: {(restockItem?.stock || 0) + Number(restockQty)} {restockItem?.unit || 'units'}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={closeRestock} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleRestock} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Restocking…' : '+ Add Stock'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Item Modal ──────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => { closeAdd(); setNewItem(EMPTY_ITEM) }} title="Add Inventory Item" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Item Name</label>
            <input
              type="text"
              className="form-input w-full"
              value={newItem.itemName}
              onChange={e => setNewItem(v => ({ ...v, itemName: e.target.value }))}
              placeholder="e.g. Rice, Oil, Sugar"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Initial Stock</label>
              <input
                type="number" min="0"
                className="form-input w-full"
                value={newItem.stock}
                onChange={e => setNewItem(v => ({ ...v, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Alert Threshold</label>
              <input
                type="number" min="0"
                className="form-input w-full"
                value={newItem.threshold}
                onChange={e => setNewItem(v => ({ ...v, threshold: e.target.value }))}
                placeholder="10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Unit</label>
            <select
              className="form-select w-full"
              value={newItem.unit}
              onChange={e => setNewItem(v => ({ ...v, unit: e.target.value }))}
            >
              {['units','kg','g','L','ml','packets','bottles','bags'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { closeAdd(); setNewItem(EMPTY_ITEM) }} className="btn-ghost flex-1" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleAddItem} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Adding…' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}