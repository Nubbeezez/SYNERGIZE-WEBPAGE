'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useAuth,
  isAdmin as checkIsAdmin,
  isManager as checkIsManager,
  isOwner as checkIsOwner,
  getHighestRole,
  formatRoleName,
  getRoleColor,
} from '@/lib/auth'
import {
  DashboardIcon,
  UsersIcon,
  ShieldIcon,
  ServerIcon,
  ShoppingBagIcon,
  DocumentIcon,
  SettingsIcon,
} from '@/components/icons'

// Nav items with permission requirements
// minRole: minimum permission level required
// 'admin' = 10, 'manager' = 30, 'owner' = 100
type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  minRole: 'admin' | 'manager' | 'owner'
  badge?: string
}

const adminNavItems: NavItem[] = [
  { href: '/admin', icon: DashboardIcon, label: 'Dashboard', minRole: 'admin' },
  { href: '/admin/users', icon: UsersIcon, label: 'Users', minRole: 'manager', badge: 'Manager+' },
  { href: '/admin/bans', icon: ShieldIcon, label: 'Bans', minRole: 'admin' },
  { href: '/admin/servers', icon: ServerIcon, label: 'Servers', minRole: 'owner', badge: 'Owner' },
  { href: '/admin/shop', icon: ShoppingBagIcon, label: 'Shop Items', minRole: 'admin' },
  { href: '/admin/logs', icon: DocumentIcon, label: 'Audit Logs', minRole: 'admin' },
  { href: '/admin/settings', icon: SettingsIcon, label: 'Settings', minRole: 'owner', badge: 'Owner' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  // Check permissions using the new role system
  const isAuthenticated = !!user
  const userIsAdmin = checkIsAdmin(user)
  const userIsManager = checkIsManager(user)
  const userIsOwner = checkIsOwner(user)
  const highestRole = getHighestRole(user)

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

  if (!userIsAdmin) {
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

  // Filter nav items based on user's role
  const canAccessItem = (item: NavItem): boolean => {
    switch (item.minRole) {
      case 'owner': return userIsOwner
      case 'manager': return userIsManager
      case 'admin': return userIsAdmin
      default: return false
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-light border-r border-primary flex-shrink-0">
        <div className="p-6 border-b border-primary">
          <h2 className="text-h4 gradient-text">Admin Panel</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-tiny text-muted">{user?.username}</span>
            <span className={`text-tiny px-1.5 py-0.5 rounded border ${getRoleColor(highestRole)}`}>
              {formatRoleName(highestRole)}
            </span>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {adminNavItems
              .filter(canAccessItem)
              .map((item) => {
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
                      {item.badge && (
                        <span className="ml-auto text-tiny bg-primary text-muted px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
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
