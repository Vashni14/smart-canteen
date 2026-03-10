import { useState, useEffect } from 'react'
import { inventoryService } from '@services/index'
import { useDisclosure } from '@hooks/useHelpers'
import Modal from '@components/common/Modal'
import ConfirmDialog from '@components/common/ConfirmDialog'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import SearchBar from '@components/common/SearchBar'
import { formatDate } from '@utils/index'
import toast from 'react-hot-toast'

export default function AdminInventory() {
  const [items,   setItems]  = useState([])
  const [loading, setLoad]   = useState(true)
  const [search,  setSearch] = useState('')
  const [filter,  setFilter] = useState('all')   // all | low | ok
  const [editing, setEdit]   = useState(null)
  const [form,    setForm]   = useState({ stock: '', threshold: '' })
  const [saving,  setSaving] = useState(false)
  const { isOpen, open, close } = useDisclosure()

  // Restock modal
  const [restockItem, setRestockItem] = useState(null)
  const [restockQty,  setRestockQty]  = useState('')
  const { isOpen: rOpen, open: rOpen_, close: rClose } = useDisclosure()

  const fetchInventory = async () => {
    setLoad(true)
    try {
      const res = await inventoryService.getAll()
      setItems(res.data?.inventory || res.data || [])
    } catch { toast.error('Failed to load inventory') }
    finally { setLoad(false) }
  }

  useEffect(() => { fetchInventory() }, [])

  /* ── Filter ─────────────────────────────────────────── */
  const filtered = items.filter(i => {
    const matchSearch = !search || i.itemName.toLowerCase().includes(search.toLowerCase())
    const isLow       = i.stock <= i.threshold
    const matchFilter = filter === 'all' || (filter === 'low' && isLow) || (filter === 'ok' && !isLow)
    return matchSearch && matchFilter
  })

  const lowCount = items.filter(i => i.stock <= i.threshold).length

  /* ── Edit threshold/stock ────────────────────────────── */
  const openEdit = (item) => {
    setEdit(item)
    setForm({ stock: item.stock, threshold: item.threshold })
    open()
  }

  const handleSave = async () => {
    if (isNaN(form.stock) || Number(form.stock) < 0)   return toast.error('Invalid stock value')
    if (isNaN(form.threshold) || Number(form.threshold) < 0) return toast.error('Invalid threshold')
    setSaving(true)
    try {
      const res = await inventoryService.update(editing._id, {
        stock:     Number(form.stock),
        threshold: Number(form.threshold),
      })
      setItems(prev => prev.map(i => i._id === editing._id ? (res.data?.item || res.data) : i))
      toast.success('Inventory updated')
      close()
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  /* ── Restock ─────────────────────────────────────────── */
  const openRestock = (item) => {
    setRestockItem(item)
    setRestockQty('')
    rOpen_()
  }

  const handleRestock = async () => {
    const qty = Number(restockQty)
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')
    setSaving(true)
    try {
      const res = await inventoryService.restock({ itemId: restockItem._id, quantity: qty })
      setItems(prev => prev.map(i =>
        i._id === restockItem._id ? { ...i, stock: i.stock + qty } : i
      ))
      toast.success(`Restocked ${qty} units of ${restockItem.itemName}`)
      rClose()
    } catch { toast.error('Restock failed') }
    finally { setSaving(false) }
  }

  const set = f => e => setForm(v => ({ ...v, [f]: e.target.value }))

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Inventory Management</h2>
          <p className="section-subtitle">{items.length} items tracked · {lowCount} low stock</p>
        </div>
        <button onClick={fetchInventory} className="btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      {/* Low stock alert banner */}
      {lowCount > 0 && (
        <div className="alert-warning animate-fade-in">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">{lowCount} item{lowCount > 1 ? 's' : ''} below threshold</p>
            <p className="text-sm">Restock soon to avoid running out.</p>
          </div>
          <button onClick={() => setFilter('low')} className="btn-sm bg-canteen-warning text-white btn flex-shrink-0">
            Show Low Stock
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search items…" />
        </div>
        <div className="tab-list p-1 w-fit">
          {['all', 'low', 'ok'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={f === filter ? 'tab-btn-active' : 'tab-btn'}>
              {f === 'all' ? 'All' : f === 'low' ? '⚠ Low' : '✅ OK'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={6} /> : (
        <div className="table-container overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                <th className="table-th">Item Name</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Threshold</th>
                <th className="table-th">Status</th>
                <th className="table-th">Last Updated</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center py-10 text-canteen-muted">No items match</td></tr>
              ) : filtered.map(item => {
                const isLow  = item.stock <= item.threshold
                const isOut  = item.stock === 0
                return (
                  <tr key={item._id} className={`table-tr ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="table-td font-semibold text-secondary">{item.itemName}</td>
                    <td className="table-td">
                      <span className={`font-bold font-mono text-lg ${isOut ? 'text-canteen-danger' : isLow ? 'text-canteen-warning' : 'text-canteen-success'}`}>
                        {item.stock}
                      </span>
                      <span className="text-xs text-canteen-muted ml-1">units</span>
                    </td>
                    <td className="table-td text-sm text-canteen-muted">{item.threshold} units</td>
                    <td className="table-td">
                      {isOut  ? <span className="badge-danger">Out of Stock</span>
                      : isLow ? <span className="badge-warning">Low Stock</span>
                      : <span className="badge-success">In Stock</span>}
                    </td>
                    <td className="table-td text-xs text-canteen-muted">
                      {item.updatedAt ? formatDate(item.updatedAt) : '—'}
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openRestock(item)} className="btn-success btn-sm">
                          + Restock
                        </button>
                        <button onClick={() => openEdit(item)} className="btn-ghost btn-sm">
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

      {/* Edit modal */}
      <Modal isOpen={isOpen} onClose={close} title={`Edit: ${editing?.itemName}`} size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={close} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Current Stock (units)</label>
            <input type="number" min="0" className="form-input" value={form.stock} onChange={set('stock')} />
          </div>
          <div className="form-group">
            <label className="form-label">Low Stock Threshold</label>
            <input type="number" min="0" className="form-input" value={form.threshold} onChange={set('threshold')} />
            <p className="form-hint">Alert triggers when stock drops to or below this number.</p>
          </div>
        </div>
      </Modal>

      {/* Restock modal */}
      <Modal isOpen={rOpen} onClose={rClose} title={`Restock: ${restockItem?.itemName}`} size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={rClose} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
            <button onClick={handleRestock} disabled={saving} className="btn-success flex-1">
              {saving ? 'Restocking…' : '+ Add Stock'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-canteen-bg rounded-xl">
            <span className="text-sm text-canteen-muted">Current stock</span>
            <span className="font-bold font-mono text-secondary">{restockItem?.stock} units</span>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Add</label>
            <input
              type="number" min="1"
              className="form-input"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
          </div>
          {restockQty && !isNaN(restockQty) && Number(restockQty) > 0 && (
            <p className="text-sm text-canteen-success font-semibold">
              New total: {(restockItem?.stock || 0) + Number(restockQty)} units
            </p>
          )}
        </div>
      </Modal>

    </div>
  )
}
