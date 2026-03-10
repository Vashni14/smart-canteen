import { useState, useEffect } from 'react'
import { adminService } from '@services/index'
import { useAuth } from '@context/AuthContext'
import { useDisclosure } from '@hooks/useHelpers'
import ConfirmDialog from '@components/common/ConfirmDialog'
import SearchBar from '@components/common/SearchBar'
import LoadingSkeleton from '@components/common/LoadingSkeleton'
import { formatDate } from '@utils/index'
import toast from 'react-hot-toast'

const ROLES     = ['customer', 'chef', 'pickup', 'admin']
const ROLE_META = {
  customer: { icon: '🧑‍🎓', color: 'badge-neutral',  label: 'Customer' },
  chef:     { icon: '👨‍🍳', color: 'badge-warning',  label: 'Chef'     },
  pickup:   { icon: '📦',   color: 'badge-info',     label: 'Pickup'   },
  admin:    { icon: '🛡️',  color: 'badge-danger',   label: 'Admin'    },
}

export default function AdminStaff() {
  const { user: me }         = useAuth()
  const [staff,   setStaff]  = useState([])
  const [loading, setLoad]   = useState(true)
  const [search,  setSearch] = useState('')
  const [roleFilter, setRoleF]= useState('all')
  const [target,  setTarget] = useState(null)   // { user, newRole }
  const [saving,  setSaving] = useState(false)
  const { isOpen, open, close } = useDisclosure()

  const fetchStaff = async () => {
    setLoad(true)
    try {
      const res = await adminService.getStaff()
      setStaff(res.data?.users || res.data || [])
    } catch { toast.error('Failed to load staff list') }
    finally { setLoad(false) }
  }

  useEffect(() => { fetchStaff() }, [])

  /* ── Filter ─────────────────────────────────────────── */
  const filtered = staff.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  /* ── Role change ─────────────────────────────────────── */
  const requestRoleChange = (user, newRole) => {
    if (user._id === me?._id) return toast.error("You can't change your own role")
    if (user.role === newRole) return
    setTarget({ user, newRole })
    open()
  }

  const confirmRoleChange = async () => {
    if (!target) return
    setSaving(true)
    try {
      await adminService.updateRole(target.user._id, target.newRole)
      setStaff(prev => prev.map(u =>
        u._id === target.user._id ? { ...u, role: target.newRole } : u
      ))
      toast.success(`${target.user.name}'s role changed to ${target.newRole}`)
      close()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Role change failed')
    } finally {
      setSaving(false)
      setTarget(null)
    }
  }

  /* ── Role counts ─────────────────────────────────────── */
  const counts = ROLES.reduce((acc, r) => {
    acc[r] = staff.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Staff Management</h2>
          <p className="section-subtitle">{staff.length} registered users</p>
        </div>
        <button onClick={fetchStaff} className="btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(role => {
          const meta = ROLE_META[role]
          return (
            <div key={role}
              className={`card card-body cursor-pointer transition-all hover:shadow-card-hover ${roleFilter === role ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setRoleF(r => r === role ? 'all' : role)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <p className="text-xl font-display font-bold text-secondary leading-none">{counts[role] || 0}</p>
                  <p className="text-xs text-canteen-muted capitalize mt-0.5">{meta.label}s</p>
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
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton variant="table" rows={6} /> : (
        <div className="table-container overflow-x-auto">
          <table className="table-base">
            <thead className="table-thead">
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Email</th>
                <th className="table-th">Current Role</th>
                <th className="table-th">Joined</th>
                <th className="table-th text-right">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-10 text-canteen-muted">No users found</td></tr>
              ) : filtered.map(u => {
                const meta    = ROLE_META[u.role] || ROLE_META.customer
                const isMe    = u._id === me?._id
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
                      <span className={meta.color}>{meta.icon} {meta.label}</span>
                    </td>
                    <td className="table-td text-xs text-canteen-muted">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="table-td text-right">
                      {isMe ? (
                        <span className="text-xs text-canteen-muted italic">Cannot edit</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => requestRoleChange(u, e.target.value)}
                          className="form-select text-xs py-1.5 w-32"
                        >
                          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm role change */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => { close(); setTarget(null) }}
        onConfirm={confirmRoleChange}
        title="Change User Role?"
        message={target ? `Change ${target.user.name}'s role from "${target.user.role}" to "${target.newRole}"? This affects their dashboard access immediately.` : ''}
        confirmLabel="Yes, Change Role"
        loading={saving}
      />

    </div>
  )
}
