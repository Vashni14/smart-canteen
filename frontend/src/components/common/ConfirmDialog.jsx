import Modal from './Modal'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title       = 'Are you sure?',
  message     = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  loading      = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
          danger ? 'bg-canteen-danger/10' : 'bg-primary/10'
        }`}>
          <span className="text-2xl">{danger ? '🗑️' : '❓'}</span>
        </div>
        <h3 className="font-display font-bold text-secondary text-lg mb-1">{title}</h3>
        <p className="text-sm text-canteen-muted">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
