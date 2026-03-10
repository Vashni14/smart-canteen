import { useState, useEffect } from 'react'
import { useOnline } from '@hooks/useHelpers'

export default function OfflineBanner() {
  const online             = useOnline()
  const [show, setShow]    = useState(!online)
  const [wasOffline, setWasOffline] = useState(false)
  const [backMsg, setBackMsg]       = useState(false)

  useEffect(() => {
    if (!online) {
      setShow(true)
      setWasOffline(true)
      setBackMsg(false)
    } else if (wasOffline) {
      // Just came back online — show a brief "back online" message
      setShow(false)
      setBackMsg(true)
      const t = setTimeout(() => setBackMsg(false), 3500)
      return () => clearTimeout(t)
    }
  }, [online, wasOffline])

  return (
    <>
      {/* Offline banner — slides down from top */}
      <div
        className={`fixed top-0 inset-x-0 z-[500] transition-transform duration-500 ${
          show ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-canteen-danger text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-semibold shadow-lg">
          <span className="text-base animate-pulse-soft">📡</span>
          <span>You're offline — some features may not work.</span>
          <button
            onClick={() => setShow(false)}
            className="ml-auto text-white/70 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Back online toast-style banner */}
      {backMsg && (
        <div className="fixed top-4 inset-x-0 z-[500] flex justify-center pointer-events-none animate-slide-down">
          <div className="bg-canteen-success text-white px-5 py-2.5 rounded-2xl shadow-modal flex items-center gap-2 text-sm font-bold">
            <span>✅</span> Back online!
          </div>
        </div>
      )}
    </>
  )
}
