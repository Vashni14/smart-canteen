export default function EmptyState({
  icon        = '📭',
  title       = 'Nothing here yet',
  description = '',
  actionLabel,
  onAction,
  children,
}) {
  return (
    <div className="card animate-fade-in">
      <div className="empty-state">
        <div className="w-16 h-16 bg-canteen-bg rounded-2xl flex items-center justify-center mb-2">
          <span className="empty-state-icon mb-0 text-3xl">{icon}</span>
        </div>
        <p className="empty-state-title">{title}</p>
        {description && <p className="empty-state-desc mt-1">{description}</p>}
        {children}
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-primary mt-5">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Prebuilt variants ──────────────────────────────────── */

export function EmptyCart({ onBrowse }) {
  return (
    <EmptyState
      icon="🛒"
      title="Your cart is empty"
      description="Add some delicious items from the menu to get started."
      actionLabel="Browse Menu"
      onAction={onBrowse}
    />
  )
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="📋"
      title="No orders yet"
      description="Your order history will appear here once you place your first order."
    />
  )
}

export function EmptyMenu() {
  return (
    <EmptyState
      icon="🍽️"
      title="Menu is empty"
      description="No items found in this category. Try a different filter."
    />
  )
}

export function EmptySearch({ query }) {
  return (
    <EmptyState
      icon="🔍"
      title={`No results for "${query}"`}
      description="Try a different search term or browse by category."
    />
  )
}

export function EmptyKitchen() {
  return (
    <EmptyState
      icon="👨‍🍳"
      title="No active orders"
      description="New orders will appear here in real time."
    />
  )
}

export function EmptyInventory() {
  return (
    <EmptyState
      icon="🏪"
      title="No inventory items"
      description="Add inventory items to start tracking stock levels."
    />
  )
}
