import { Outlet } from 'react-router-dom'
import Navbar               from '@components/common/Navbar'
import Footer               from '@components/common/Footer'
import OfflineBanner        from '@components/common/OfflineBanner'
import SessionExpiredModal  from '@components/common/SessionExpiredModal'
import ErrorBoundary        from '@components/common/ErrorBoundary'
import PageTransition       from '@components/common/PageTransition'

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canteen-bg">
      <OfflineBanner />
      <SessionExpiredModal />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
