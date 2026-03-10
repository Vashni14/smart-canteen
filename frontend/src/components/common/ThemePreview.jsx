/**
 * ThemePreview.jsx
 * Living style guide — shows every design token in action.
 * Use at route /theme (dev only) to verify the theme system.
 */
export default function ThemePreview() {
  return (
    <div className="page-container page-section space-y-12">

      {/* Header */}
      <div>
        <h1 className="section-title">🎨 SmartCanteen Design System</h1>
        <p className="section-subtitle">Phase 2 — Complete theme preview</p>
      </div>

      {/* ── Colors ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-secondary">Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Primary',   bg: 'bg-primary',         text: 'text-white' },
            { label: 'Secondary', bg: 'bg-secondary',       text: 'text-white' },
            { label: 'Accent',    bg: 'bg-accent',          text: 'text-secondary' },
            { label: 'BG',        bg: 'bg-canteen-bg border border-canteen-border', text: 'text-secondary' },
            { label: 'Success',   bg: 'bg-canteen-success', text: 'text-white' },
            { label: 'Danger',    bg: 'bg-canteen-danger',  text: 'text-white' },
            { label: 'Warning',   bg: 'bg-canteen-warning', text: 'text-white' },
            { label: 'Info',      bg: 'bg-canteen-info',    text: 'text-white' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} ${c.text} rounded-xl p-4 font-semibold text-sm`}>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ─────────────────────────────────────── */}
      <section className="space-y-3 card card-body">
        <h2 className="text-xl font-display font-bold text-secondary mb-4">Typography</h2>
        <p className="font-display font-bold text-4xl text-secondary">Display H1 — Poppins Bold</p>
        <p className="font-display font-bold text-3xl text-secondary">Display H2 — Poppins Bold</p>
        <p className="font-display font-bold text-2xl text-secondary">Display H3 — Poppins Bold</p>
        <p className="font-display font-semibold text-xl text-secondary">Display H4 — Poppins SemiBold</p>
        <p className="divider" />
        <p className="font-sans font-normal text-base text-secondary">Body text — Nunito Regular. Used for descriptions, paragraphs, and general content throughout the app.</p>
        <p className="font-sans font-semibold text-sm text-secondary">Body Semibold — Labels, form values, secondary info</p>
        <p className="font-sans text-sm text-canteen-muted">Muted small — helper text, timestamps, metadata</p>
        <p className="label-text">LABEL TEXT — uppercase tracking</p>
        <p className="font-mono text-sm text-secondary">Mono — Order IDs, codes, QR data</p>
      </section>

      {/* ── Buttons ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-secondary">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">Primary</button>
          <button className="btn-secondary">Secondary</button>
          <button className="btn-accent">Accent</button>
          <button className="btn-outline">Outline</button>
          <button className="btn-ghost">Ghost</button>
          <button className="btn-danger">Danger</button>
          <button className="btn-success">Success</button>
          <button className="btn-white">White</button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="btn-primary btn-sm">Small</button>
          <button className="btn-primary">Default</button>
          <button className="btn-primary btn-lg">Large</button>
          <button className="btn-primary btn-xl">X-Large</button>
          <button className="btn-primary" disabled>Disabled</button>
        </div>
      </section>

      {/* ── Badges ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xl font-display font-bold text-secondary">Badges & Status</h2>
        <div className="flex flex-wrap gap-2">
          <span className="badge-primary">Primary</span>
          <span className="badge-success">Success</span>
          <span className="badge-danger">Danger</span>
          <span className="badge-warning">Warning</span>
          <span className="badge-info">Info</span>
          <span className="badge-neutral">Neutral</span>
          <span className="badge-accent">Accent</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="status-pending">Pending</span>
          <span className="status-accepted">Accepted</span>
          <span className="status-preparing">Preparing</span>
          <span className="status-ready">Ready</span>
          <span className="status-collected">Collected</span>
          <span className="status-cancelled">Cancelled</span>
        </div>
      </section>

      {/* ── Cards ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-secondary">Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card card-body">
            <p className="card-title">Standard Card</p>
            <p className="card-subtitle">With shadow and border</p>
          </div>
          <div className="card-hover card-body">
            <p className="card-title">Hover Card</p>
            <p className="card-subtitle">Lifts on hover</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-primary/10">🍔</div>
            <div>
              <p className="stat-value">142</p>
              <p className="stat-label">Total Orders Today</p>
              <p className="stat-trend-up">↑ 12% vs yesterday</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Forms ──────────────────────────────────────────── */}
      <section className="card card-body space-y-4 max-w-md">
        <h2 className="text-xl font-display font-bold text-secondary">Form Controls</h2>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <div className="input-icon-wrap">
            <span className="input-icon-left">📧</span>
            <input className="form-input-icon-l" placeholder="you@example.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select">
            <option>Breakfast</option>
            <option>Snacks</option>
            <option>Beverages</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Error state</label>
          <input className="form-input-error" placeholder="Invalid input" />
          <p className="form-error">⚠ This field is required</p>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" rows="3" placeholder="Special instructions…" />
          <p className="form-hint">Optional — max 200 characters</p>
        </div>
      </section>

      {/* ── Alerts ─────────────────────────────────────────── */}
      <section className="space-y-3 max-w-lg">
        <h2 className="text-xl font-display font-bold text-secondary">Alerts</h2>
        <div className="alert-info">ℹ Your order is being prepared</div>
        <div className="alert-success">✅ Payment successful</div>
        <div className="alert-warning">⚠ Item stock is low</div>
        <div className="alert-danger">❌ Item is currently unavailable</div>
      </section>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xl font-display font-bold text-secondary">Tabs</h2>
        <div className="tab-list max-w-xs">
          <button className="tab-btn-active">All</button>
          <button className="tab-btn">Active</button>
          <button className="tab-btn">Done</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="tab-pill-active">All Items</button>
          <button className="tab-pill">Breakfast</button>
          <button className="tab-pill">Snacks</button>
          <button className="tab-pill">Beverages</button>
        </div>
      </section>

      {/* ── Skeletons ──────────────────────────────────────── */}
      <section className="space-y-3 max-w-sm">
        <h2 className="text-xl font-display font-bold text-secondary">Loading Skeletons</h2>
        <div className="card card-body space-y-3">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton-text w-3/4" />
          <div className="skeleton-text w-1/2" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      </section>

      {/* ── Empty State ─────────────────────────────────────── */}
      <section className="card">
        <div className="empty-state">
          <p className="empty-state-icon">🛒</p>
          <p className="empty-state-title">Your cart is empty</p>
          <p className="empty-state-desc">Add items from the menu to get started</p>
          <button className="btn-primary mt-4">Browse Menu</button>
        </div>
      </section>

      {/* ── Gradients ──────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xl font-display font-bold text-secondary">Gradients</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Primary',   cls: 'gradient-primary' },
            { label: 'Secondary', cls: 'gradient-secondary' },
            { label: 'Accent',    cls: 'gradient-accent' },
            { label: 'Success',   cls: 'gradient-success' },
            { label: 'Warm',      cls: 'gradient-warm' },
          ].map(g => (
            <div key={g.label} className={`${g.cls} rounded-xl h-16 flex items-end p-2`}>
              <span className="text-xs font-bold text-white drop-shadow">{g.label}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
