import { Outlet } from 'react-router-dom'
import Sidebar              from '@components/common/Sidebar'
import DashboardHeader      from '@components/common/DashboardHeader'
import OfflineBanner        from '@components/common/OfflineBanner'
import SessionExpiredModal  from '@components/common/SessionExpiredModal'
import ErrorBoundary        from '@components/common/ErrorBoundary'
import PageTransition       from '@components/common/PageTransition'
import { useSocket }        from '@context/SocketContext'

export default function DashboardLayout({ role }) {
  const { connected } = useSocket()

  return (
    <div className="min-h-screen flex bg-canteen-bg">
      <OfflineBanner />
      <SessionExpiredModal />
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader role={role} connected={connected} />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
