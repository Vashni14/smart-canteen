import { useEffect, useRef, useState } from 'react'

/**
 * QRScanner — uses device camera + canvas to decode QR codes via jsQR.
 * Falls back to manual input if camera is unavailable.
 *
 * Props:
 *   onScan(data: string)  — called when a valid QR is decoded
 *   onClose()             — close/cancel callback
 */
export default function QRScanner({ onScan, onClose }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)

  const [status,    setStatus]    = useState('loading') // loading | scanning | error | manual
  const [error,     setError]     = useState('')
  const [manual,    setManual]    = useState('')
  const [lastScan,  setLastScan]  = useState(null)
  const [torchOn,   setTorchOn]   = useState(false)
  const [jsqr,      setJsqr]      = useState(null)

  // Dynamically load jsQR from CDN
  useEffect(() => {
    if (window.jsQR) { setJsqr(() => window.jsQR); return }
    const script    = document.createElement('script')
    script.src      = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'
    script.onload   = () => setJsqr(() => window.jsQR)
    script.onerror  = () => setStatus('manual')
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  // Start camera once jsQR is ready
  useEffect(() => {
    if (!jsqr) return
    startCamera()
    return () => stopCamera()
  }, [jsqr])

  const startCamera = async () => {
    setStatus('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStatus('scanning')
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Camera not available on this device.'
      setError(msg)
      setStatus('manual')
    }
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const scanFrame = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    const ctx = canvas.getContext('2d')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code      = jsqr(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      const now = Date.now()
      if (!lastScan || now - lastScan > 2500) {
        setLastScan(now)
        stopCamera()
        onScan(code.data)
        return
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame)
  }

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(v => !v)
    } catch {}
  }

  const handleManualSubmit = () => {
    if (!manual.trim()) return
    onScan(manual.trim())
  }

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Camera view */}
      {status !== 'manual' && (
        <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted playsInline autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner brackets */}
              <div className="relative w-48 h-48">
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-primary ${cls}`} />
                ))}
                {/* Scanning line */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-scan-line"
                  style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
              </div>
            </div>
          )}

          {/* Loading spinner */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white space-y-2">
                <svg className="w-8 h-8 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-semibold">Starting camera…</p>
              </div>
            </div>
          )}

          {/* Torch toggle */}
          {status === 'scanning' && (
            <button
              onClick={toggleTorch}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                torchOn ? 'bg-accent' : 'bg-black/50 text-white'
              }`}
            >
              🔦
            </button>
          )}
        </div>
      )}

      {/* Status text */}
      {status === 'scanning' && (
        <p className="text-sm text-canteen-muted font-semibold text-center">
          Point the camera at the customer's QR code
        </p>
      )}

      {/* Error */}
      {status === 'manual' && error && (
        <div className="alert-warning w-full text-sm">⚠ {error}</div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-canteen-border" />
        <span className="text-xs text-canteen-muted font-semibold">OR ENTER MANUALLY</span>
        <div className="flex-1 h-px bg-canteen-border" />
      </div>

      {/* Manual input */}
      <div className="w-full space-y-3">
        <div className="input-icon-wrap">
          <span className="input-icon-left">🔢</span>
          <input
            type="text"
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Enter order number e.g. ABC123"
            className="form-input-icon-l font-mono uppercase"
            autoComplete="off"
          />
        </div>
        <button
          onClick={handleManualSubmit}
          disabled={!manual.trim()}
          className="btn-primary w-full"
        >
          Verify Order
        </button>
      </div>

      {/* Switch to camera */}
      {status === 'manual' && !error && (
        <button onClick={startCamera} className="btn-outline w-full">
          📷 Use Camera Instead
        </button>
      )}

      <button onClick={() => { stopCamera(); onClose() }} className="btn-ghost w-full">
        Cancel
      </button>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-48px); opacity: 0.6; }
          50%       { transform: translateY(48px);  opacity: 1; }
        }
      `}</style>
    </div>
  )
}
