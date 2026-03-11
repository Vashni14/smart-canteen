import { useState, useEffect } from 'react'
import { adminService } from '@services/index'
import { useAuth } from '@context/AuthContext'
import { useDisclosure } from '@hooks/useHelpers'
import Modal from '@components/common/Modal'
import ConfirmDialog from '@components/common/ConfirmDialog'
import SearchBar from '@components/common/SearchBar'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatDate } from '@utils/index'
import toast from 'react-hot-toast'

// Only show staff roles — customers are NOT shown
const STAFF_ROLES = ['chef', 'pickup', 'admin']
const ALL_ROLES   = ['customer', 'chef', 'pickup', 'admin']

const ROLE_META = {
  customer: { icon: '🧑‍🎓', color: 'bg-gray-100 text-gray-600',    label: 'Customer' },
  chef:     { icon: '👨‍🍳', color: 'bg-orange-100 text-orange-700', label: 'Chef'     },
  pickup:   { icon: '📦',   color: 'bg-blue-100 text-blue-700',    label: 'Pickup'   },
  admin:    { icon: '🛡️',  color: 'bg-purple-100 text-purple-700', label: 'Admin'    },
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'chef' }

export default function AdminStaff() {
  const { user: me }          = useAuth()
  const [staff,    setStaff]  = useState([])
  const [loading,  setLoad]   = useState(true)
  const [search,   setSearch] = useState('')
  const [roleFilter, setRoleF]= useState('all')
  const [saving,   setSaving] = useState(false)

  // Add staff modal
  const [form,     setForm]   = useState(EMPTY_FORM)
  const [formErr,  setFormErr]= useState({})
  const { isOpen: addOpen, open: openAdd, close: closeAdd } = useDisclosure()

  // Role change confirm
  const [target,   setTarget] = useState(null)
  const { isOpen: roleOpen, open: openRole, close: closeRole } = useDisclosure()

  // Delete confirm
  const [delTarget, setDelTarget] = useState(null)
  const { isOpen: delOpen, open: openDel, close: closeDel } = useDisclosure()

  const fetchStaff = async () => {
    setLoad(true)
    try {
      const res = await adminService.getStaff()
      // Exclude customers from staff management view
      const all = res.data?.users || res.data || []
      setStaff(all.filter(u => u.role !== 'customer'))
    } catch { toast.error('Failed to load staff') }
    finally { setLoad(false) }
  }

  useEffect(() => { fetchStaff() }, [])

  /* ── Filter ──────────────────────────────────────────── */
  const filtered = staff.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const counts = STAFF_ROLES.reduce((acc, r) => {
    acc[r] = staff.filter(u => u.role === r).length
    return acc
  }, {})

  /* ── Add staff ───────────────────────────────────────── */
  const validateForm = () => {
    const errs = {}
    if (!form.name.trim())        errs.name     = 'Name is required'
    if (!form.email.trim())       errs.email    = 'Email is required'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required'
    if (form.password.length < 6) errs.password = 'Min 6 characters'
    if (!form.role)               errs.role     = 'Select a role'
    setFormErr(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddStaff = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await adminService.createStaff(form)
      const newUser = res.data?.user
      if (newUser && newUser.role !== 'customer') {
        setStaff(prev => [newUser, ...prev])
      }
      toast.success(`${form.name} added as ${form.role}`)
      setForm(EMPTY_FORM)
      setFormErr({})
      closeAdd()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create staff')
    } finally { setSaving(false) }
  }

  /* ── Role change ─────────────────────────────────────── */
  const requestRoleChange = (user, newRole) => {
    if (user._id === me?._id) return toast.error("You can't change your own role")
    if (user.role === newRole) return
    setTarget({ user, newRole })
    openRole()
  }

  const confirmRoleChange = async () => {
    if (!target) return
    setSaving(true)
    try {
      await adminService.updateRole(target.user._id, target.newRole)
      setStaff(prev => prev.map(u =>
        u._id === target.user._id ? { ...u, role: target.newRole } : u
      ).filter(u => u.role !== 'customer'))
      toast.success(`${target.user.name} → ${target.newRole}`)
      closeRole()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Role change failed')
    } finally { setSaving(false); setTarget(null) }
  }

  /* ── Delete staff ────────────────────────────────────── */
  const requestDelete = (user) => {
    if (user._id === me?._id) return toast.error("You can't delete yourself")
    if (user.role === 'admin') return toast.error("Can't delete admin accounts")
    setDelTarget(user)
    openDel()
  }

  const confirmDelete = async () => {
    if (!delTarget) return
    setSaving(true)
    try {
      await adminService.deleteStaff(delTarget._id)
      setStaff(prev => prev.filter(u => u._id !== delTarget._id))
      toast.success(`${delTarget.name} has been removed`)
      closeDel()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally { setSaving(false); setDelTarget(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Staff Management</h2>
          <p className="section-subtitle">{staff.length} staff members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStaff} className="btn-ghost btn-sm">🔄 Refresh</button>
          <button onClick={openAdd} className="btn-primary btn-sm">+ Add Staff</button>
        </div>
      </div>

      {/* Role summary cards — only staff roles */}
      <div className="grid grid-cols-3 gap-3">
        {STAFF_ROLES.map(role => {
          const meta = ROLE_META[role]
          return (
            <div
              key={role}
              className={`card card-body cursor-pointer transition-all hover:shadow-hover ${
                roleFilter === role ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setRoleF(r => r === role ? 'all' : role)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <p className="text-xl font-display font-bold text-secondary leading-none">
                    {counts[role] || 0}
                  </p>
                  <p className="text-xs text-canteen-muted mt-0.5">{meta.label}s</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
        </div>
        <select
          className="form-select w-full sm:w-40"
          value={roleFilter}
          onChange={e => setRoleF(e.target.value)}
        >
          <option value="all">All Staff</option>
          {STAFF_ROLES.map(r => (
            <option key={r} value={r} className="capitalize">{ROLE_META[r].label}s</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={5} /> : (
        <div className="table-container overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                <th className="table-th">Staff Member</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Joined</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center py-10 text-canteen-muted">
                    No staff found
                  </td>
                </tr>
              ) : filtered.map(u => {
                const meta = ROLE_META[u.role] || ROLE_META.chef
                const isMe = u._id === me?._id
                return (
                  <tr key={u._id} className={`table-tr ${isMe ? 'bg-primary/5' : ''}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-secondary text-sm">{u.name}</p>
                          {isMe && <span className="text-xs text-primary font-bold">You</span>}
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-sm text-canteen-muted">{u.email}</td>
                    <td className="table-td">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="table-td text-xs text-canteen-muted">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="table-td text-right">
                      {isMe ? (
                        <span className="text-xs text-canteen-muted italic">You</span>
                      ) : (
                        <div className="flex gap-2 justify-end items-center">
                          <select
                            value={u.role}
                            onChange={e => requestRoleChange(u, e.target.value)}
                            className="form-select text-xs py-1.5 w-28"
                          >
                            {STAFF_ROLES.map(r => (
                              <option key={r} value={r} className="capitalize">
                                {ROLE_META[r].label}
                              </option>
                            ))}
                          </select>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => requestDelete(u)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-sm transition-colors"
                              title="Remove staff"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Staff Modal ────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => { closeAdd(); setForm(EMPTY_FORM); setFormErr({}) }}
        title="Add Staff Member" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label-text block mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Chef Ravi"
              className={`form-input w-full ${formErr.name ? 'border-canteen-danger' : ''}`}
            />
            {formErr.name && <p className="text-xs text-canteen-danger mt-1">{formErr.name}</p>}
          </div>

          <div>
            <label className="label-text block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="staff@college.edu"
              className={`form-input w-full ${formErr.email ? 'border-canteen-danger' : ''}`}
            />
            {formErr.email && <p className="text-xs text-canteen-danger mt-1">{formErr.email}</p>}
          </div>

          <div>
            <label className="label-text block mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min 6 characters"
              className={`form-input w-full ${formErr.password ? 'border-canteen-danger' : ''}`}
            />
            {formErr.password && <p className="text-xs text-canteen-danger mt-1">{formErr.password}</p>}
          </div>

          <div>
            <label className="label-text block mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {STAFF_ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    form.role === r
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-white text-canteen-muted border-canteen-border hover:border-secondary/40'
                  }`}
                >
                  {ROLE_META[r].icon} {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { closeAdd(); setForm(EMPTY_FORM); setFormErr({}) }}
              className="btn-ghost flex-1"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleAddStaff}
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? 'Adding…' : 'Add Staff'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Role change confirm ────────────────────────── */}
      <ConfirmDialog
        isOpen={roleOpen}
        onClose={() => { closeRole(); setTarget(null) }}
        onConfirm={confirmRoleChange}
        title="Change Role?"
        message={target
          ? `Change ${target.user.name}'s role from "${target.user.role}" to "${target.newRole}"? This updates their dashboard access immediately.`
          : ''
        }
        confirmLabel="Yes, Change Role"
        loading={saving}
      />

      {/* ── Delete confirm ─────────────────────────────── */}
      <ConfirmDialog
        isOpen={delOpen}
        onClose={() => { closeDel(); setDelTarget(null) }}
        onConfirm={confirmDelete}
        title="Remove Staff Member?"
        message={delTarget
          ? `Remove ${delTarget.name} (${delTarget.email}) from the system? This cannot be undone.`
          : ''
        }
        confirmLabel="Yes, Remove"
        confirmVariant="danger"
        loading={saving}
      />

    </div>
  )
}