import { createFileRoute, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminHeader } from '@/components/layout/AdminHeader'
import '@/styles/admin.css'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const router = useRouter()
  const routerState = useRouterState()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  // Check if we're on the login page
  const isLoginPage = routerState.location.pathname === '/admin/login'

  useEffect(() => {
    // If we're done loading and NOT authenticated and NOT on login page, go to login
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.navigate({ to: '/admin/login', replace: true })
    }
  }, [isLoading, isAuthenticated, isLoginPage, router])

  // For login page, just render the outlet without the admin layout wrapper
  if (isLoginPage) {
    return <Outlet />
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-terminal-bg-dark) text-(--color-text-primary)">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
          <div className="font-mono text-sm animate-pulse text-(--color-text-secondary)">Initializing secure session...</div>
        </div>
      </div>
    )
  }

  // Prevent flash of content for protected pages
  if (!isAuthenticated) return null

  return (
    <div className="admin-layout bg-(--color-terminal-bg-dark) text-(--color-text-primary) font-mono">
      {/* Mobile Drawer (simplified for now, just toggles visibility or we can overlay) */}
      <div className={`${isMobileSidebarOpen ? 'block fixed inset-0 z-50 bg-black/50' : 'hidden'} md:block md:static md:bg-transparent`}>
         <div className={`h-full ${isMobileSidebarOpen ? 'w-[280px] bg-(--color-surface)' : ''} md:w-auto`}>
            <AdminSidebar />
         </div>
         {/* Close on click outside */}
         {isMobileSidebarOpen && (
           <div className="absolute inset-0 -z-10" onClick={() => setIsMobileSidebarOpen(false)} />
         )}
      </div>

      <AdminHeader onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
