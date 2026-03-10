import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeMap = { sm: 'modal-box-sm', md: 'modal-box', lg: 'modal-box-lg' }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={sizeMap[size] || 'modal-box'} role="dialog" aria-modal="true">
        {/* Header */}
        {title && (
          <div className="modal-header">
            <h3 className="card-title">{title}</h3>
            <button
              onClick={onClose}
              className="btn-icon btn-ghost text-canteen-muted"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
