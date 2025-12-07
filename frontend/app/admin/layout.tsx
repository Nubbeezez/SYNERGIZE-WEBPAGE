'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  DashboardIcon,
  UsersIcon,
  ShieldIcon,
  ServerIcon,
  ShoppingBagIcon,
  DocumentIcon,
  SettingsIcon,
} from '@/components/icons'

const adminNavItems = [
  { href: '/admin', icon: DashboardIcon, label: 'Dashboard' },
  { href: '/admin/users', icon: UsersIcon, label: 'Users' },
  { href: '/admin/bans', icon: ShieldIcon, label: 'Bans' },
  { href: '/admin/servers', icon: ServerIcon, label: 'Servers' },
  { href: '/admin/shop', icon: ShoppingBagIcon, label: 'Shop Items' },
  { href: '/admin/logs', icon: DocumentIcon, label: 'Audit Logs' },
  { href: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Check if user has admin access
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-pink border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center max-w-md">
          <ShieldIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-h2 mb-2">Access Denied</h1>
          <p className="text-muted mb-6">Please log in to access the admin panel.</p>
          <Link href="/api/v1/auth/steam/init" className="btn-primary">
            Login with Steam
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center max-w-md">
          <ShieldIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-h2 mb-2">Access Denied</h1>
          <p className="text-muted mb-6">You do not have permission to access the admin panel.</p>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-light border-r border-primary flex-shrink-0">
        <div className="p-6 border-b border-primary">
          <h2 className="text-h4 gradient-text">Admin Panel</h2>
          <p className="text-tiny text-muted mt-1">Welcome, {user?.username}</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-accent-pink/20 text-accent-pink'
                        : 'text-muted hover:text-white hover:bg-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-primary">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-white transition-colors">
            <span>&larr;</span>
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
