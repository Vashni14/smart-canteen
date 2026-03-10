/* ----------------------------------------------------------
   LoadingSkeleton — multiple variants for different contexts
   Usage:
     <LoadingSkeleton variant="food-grid" />
     <LoadingSkeleton variant="order-list" count={4} />
     <LoadingSkeleton variant="dashboard" />
     <LoadingSkeleton variant="detail" />
     <LoadingSkeleton variant="table" rows={5} />
---------------------------------------------------------- */

export default function LoadingSkeleton({ variant = 'card', count = 3, rows = 5 }) {
  const variants = {
    'food-grid':   <FoodGridSkeleton count={count} />,
    'order-list':  <OrderListSkeleton count={count} />,
    'dashboard':   <DashboardSkeleton />,
    'detail':      <DetailSkeleton />,
    'table':       <TableSkeleton rows={rows} />,
    'card':        <CardSkeleton />,
    'profile':     <ProfileSkeleton />,
  }

  return variants[variant] || <CardSkeleton />
}

/* ── Variants ────────────────────────────────────────────── */

function FoodGridSkeleton({ count }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton h-44 rounded-none" />
          <div className="p-4 space-y-2">
            <div className="skeleton-text w-3/4" />
            <div className="skeleton-text w-full" />
            <div className="skeleton-text w-1/2" />
            <div className="flex justify-between items-center pt-1">
              <div className="skeleton h-5 w-14 rounded-lg" />
              <div className="skeleton h-7 w-16 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function OrderListSkeleton({ count }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card card-body flex items-center gap-4 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-text w-1/3" />
            <div className="skeleton-text w-1/2" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-1/2" />
              <div className="skeleton h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="card">
        <div className="card-header">
          <div className="skeleton h-5 w-40" />
        </div>
        <div className="card-body">
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card card-body space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-text w-1/3" />
            <div className="skeleton-text w-1/4" />
          </div>
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
        <div className="divider" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-text w-1/2" />
              <div className="skeleton-text w-1/4" />
            </div>
          </div>
        ))}
        <div className="divider" />
        <div className="flex justify-between">
          <div className="skeleton-text w-20" />
          <div className="skeleton h-5 w-24" />
        </div>
      </div>
    </div>
  )
}

function TableSkeleton({ rows }) {
  return (
    <div className="table-container animate-pulse">
      {/* thead */}
      <div className="table-thead px-4 py-3 flex gap-8">
        {[20, 28, 40, 16, 20, 24].map((w, i) => (
          <div key={i} className={`skeleton-text w-${w}`} />
        ))}
      </div>
      {/* rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="table-tr px-4 py-3.5 flex gap-8">
          {[20, 28, 40, 16, 20, 24].map((w, j) => (
            <div key={j} className="skeleton-text flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="card card-body space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="skeleton-circle w-10 h-10" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-text w-1/2" />
          <div className="skeleton-text w-1/3" />
        </div>
      </div>
      <div className="skeleton h-24 w-full" />
      <div className="skeleton-text w-3/4" />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="card card-body flex items-center gap-4 animate-pulse">
      <div className="skeleton-circle w-16 h-16 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-text w-40" />
        <div className="skeleton-text w-32" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}
