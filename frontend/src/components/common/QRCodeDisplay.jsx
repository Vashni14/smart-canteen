import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ orderId, orderNumber, status }) {
  const qrRef    = useRef(null)
  const isReady  = status === 'ready'
  const qrValue  = JSON.stringify({ orderId, orderNumber, ts: Date.now() })

  const handleDownload = () => {
    const svg    = qrRef.current?.querySelector('svg')
    if (!svg) return
    const blob   = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href       = url
    a.download   = `order-${orderNumber}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="qr-wrapper animate-scale-in">
      {/* Title */}
      <div>
        <p className="font-display font-bold text-secondary text-base">Pickup QR Code</p>
        <p className="text-xs text-canteen-muted mt-0.5">Show this at the counter</p>
      </div>

      {/* QR or locked state */}
      <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
        isReady ? 'border-canteen-success bg-white' : 'border-canteen-border bg-canteen-bg'
      }`}>
        {/* Blur overlay when not ready */}
        {!isReady && (
          <div className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-2">
            <span className="text-3xl">🔒</span>
            <p className="text-xs font-bold text-canteen-muted text-center px-4">
              QR unlocks when order is Ready
            </p>
          </div>
        )}

        <div ref={qrRef} className={!isReady ? 'opacity-20 select-none pointer-events-none' : ''}>
          <QRCodeSVG
            value={qrValue}
            size={180}
            bgColor="#FFFFFF"
            fgColor="#2E3A59"
            level="H"
            includeMargin={false}
            imageSettings={{
              src: '',
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>
      </div>

      {/* Order number */}
      <div className="text-center">
        <p className="label-text">Order Number</p>
        <p className="font-mono font-bold text-secondary text-lg tracking-widest mt-0.5">
          #{orderNumber}
        </p>
      </div>

      {/* Status chip */}
      <span className={`status-${status}`}>
        {isReady ? '🛎️ Ready for pickup!' : 'Waiting for order to be ready…'}
      </span>

      {/* Download (only when ready) */}
      {isReady && (
        <button onClick={handleDownload} className="btn-outline btn-sm">
          ⬇ Download QR
        </button>
      )}
    </div>
  )
}
