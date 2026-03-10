// ── Currency ───────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

// ── Date/Time ──────────────────────────────────────────────────
export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))

export const formatTime = (date) =>
  new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date(date))

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60)   return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return formatDate(date)
}

// ── Order Status ───────────────────────────────────────────────
export const ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'collected', 'cancelled']

export const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'warning', step: 0 },
  accepted:  { label: 'Accepted',  color: 'info',    step: 1 },
  preparing: { label: 'Preparing', color: 'primary', step: 2 },
  ready:     { label: 'Ready',     color: 'success', step: 3 },
  collected: { label: 'Collected', color: 'neutral', step: 4 },
  cancelled: { label: 'Cancelled', color: 'danger',  step: -1 },
}

export const getStatusClass = (status) => {
  const map = {
    pending:   'status-pending',
    accepted:  'status-accepted',
    preparing: 'status-preparing',
    ready:     'status-ready',
    collected: 'status-collected',
    cancelled: 'status-cancelled',
  }
  return map[status] || 'badge-neutral'
}

// ── Food Categories ────────────────────────────────────────────
export const CATEGORIES = ['All', 'Breakfast', 'Snacks', 'Lunch', 'Dinner', 'Beverages', 'Desserts']

// ── Role helpers ───────────────────────────────────────────────
export const ROLE_HOME = {
  customer: '/menu',
  chef:     '/kitchen',
  pickup:   '/pickup',
  admin:    '/admin',
}

// ── Misc ───────────────────────────────────────────────────────
export const clsx = (...classes) => classes.filter(Boolean).join(' ')

export const truncate = (str, n = 60) =>
  str?.length > n ? str.slice(0, n) + '…' : str

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const generateOrderId = () =>
  'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()