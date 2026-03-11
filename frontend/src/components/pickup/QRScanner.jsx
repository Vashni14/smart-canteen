import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export default function QRScanner({ onScan, onClose }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const scannedRef = useRef(false)

  const [status,   setStatus]  = useState('idle')   // idle|loading|scanning|manual
  const [error,    setError]   = useState('')
  const [manual,   setManual]  = useState('')
  const [camDiag,  setCamDiag] = useState('')

  // Don't auto-start — let user choose to avoid permission prompt issues
  useEffect(() => {
    return stopCamera
  }, [])

  const startCamera = async () => {
    scannedRef.current = false
    setStatus('loading')
    setError('')
    setCamDiag('')

    // Check if mediaDevices API exists at all
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamDiag('MediaDevices API not available.')
      setError('Camera API not supported on this browser. Try Chrome or Safari.')
      setStatus('manual')
      return
    }

    // Check if we're on a secure context (required for camera)
    if (!window.isSecureContext) {
      setCamDiag('Not a secure context (needs HTTPS).')
      setError('Camera requires HTTPS. Open the site using https:// not http://')
      setStatus('manual')
      return
    }

    try {
      // Try back camera first, fall back to any camera
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } }
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
        setStatus('scanning')
        rafRef.current = requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      const diagMsg = `${err.name}: ${err.message}`
      setCamDiag(diagMsg)

      let userMsg = 'Camera unavailable.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg = 'Camera permission denied. In your browser, tap the 🔒 or camera icon in the address bar and allow camera access, then try again.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMsg = 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        userMsg = 'Camera is in use by another app. Close other apps and try again.'
      } else if (err.name === 'OverconstrainedError') {
        userMsg = 'Camera constraint error. Try again.'
      }

      setError(userMsg)
      setStatus('manual')
    }
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const scanFrame = () => {
    if (scannedRef.current) return

    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code?.data) {
      scannedRef.current = true
      stopCamera()
      onScan(code.data)
      return
    }

    rafRef.current = requestAnimationFrame(scanFrame)
  }

  const handleManualSubmit = () => {
    const val = manual.trim()
    if (!val) return
    stopCamera()
    onScan(val)
  }

  return (
    <div className="flex flex-col items-center gap-4">

      {/* ── Camera section ───────────────────────────── */}
      {status === 'idle' && (
        <button onClick={startCamera} className="btn-outline w-full gap-2 py-4">
          📷 Open Camera Scanner
        </button>
      )}

      {(status === 'loading' || status === 'scanning') && (
        <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-primary ${cls}`} />
                ))}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-primary/80"
                  style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }}
                />
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-white text-center space-y-2">
                <svg className="w-8 h-8 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm font-semibold">Starting camera…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'scanning' && (
        <div className="flex items-center gap-3 w-full">
          <p className="text-sm text-canteen-muted font-semibold flex-1 text-center">
            Point at the customer's QR code
          </p>
          <button
            onClick={() => { stopCamera(); setStatus('idle') }}
            className="btn-ghost btn-xs"
          >
            Stop
          </button>
        </div>
      )}

      {/* Error with diagnosis */}
      {error && (
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1">
          <p className="text-sm text-yellow-800 font-semibold">⚠ {error}</p>
          {camDiag && (
            <p className="text-xs text-yellow-600 font-mono">{camDiag}</p>
          )}
          <button onClick={startCamera} className="text-xs text-yellow-700 underline mt-1">
            Try again
          </button>
        </div>
      )}

      {/* ── Divider ──────────────────────────────────── */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-canteen-border" />
        <span className="text-xs text-canteen-muted font-bold">ENTER ORDER NUMBER</span>
        <div className="flex-1 h-px bg-canteen-border" />
      </div>

      {/* ── Manual entry — PRIMARY flow ──────────────── */}
      <div className="w-full space-y-2">
        <p className="text-xs text-canteen-muted text-center">
          Type the order number shown on the customer's screen
        </p>
        <input
          type="text"
          value={manual}
          onChange={e => setManual(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
          placeholder="SC0001"
          className="form-input font-mono text-center text-xl tracking-widest uppercase w-full"
          autoComplete="off"
          autoFocus
        />
        <button
          onClick={handleManualSubmit}
          disabled={!manual.trim()}
          className="btn-primary w-full text-base py-3"
        >
          ✅ Verify & Collect
        </button>
      </div>

      <button onClick={() => { stopCamera(); onClose() }} className="btn-ghost w-full">
        Cancel
      </button>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-48px); opacity: 0.6; }
          50%       { transform: translateY(48px);  opacity: 1;   }
        }
      `}</style>
    </div>
  )
}