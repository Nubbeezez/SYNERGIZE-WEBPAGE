'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth, isAdmin } from '@/lib/auth'
import { settingsApi, SiteSettings } from '@/lib/api'
import {
  ServerIcon,
  TrophyIcon,
  ShieldIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  MenuIcon,
  XMarkIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  SteamIcon,
} from './icons'

const navItems = [
  { name: 'Servers', href: '/servers', icon: ServerIcon },
  { name: 'Leaderboards', href: '/leaderboards', icon: TrophyIcon },
  { name: 'Bans', href: '/bans', icon: ShieldIcon },
  { name: 'Shop', href: '/shop', icon: ShoppingBagIcon },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    settingsApi.getPublic()
      .then((res) => setSettings(res.data))
      .catch(() => {})
  }, [])

  const communityItems = [
    { name: 'Discord', href: settings?.discord_invite || '#', external: true },
    { name: 'Rules', href: '/rules' },
    { name: 'Support', href: '/support' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/5">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Synergize"
              width={152}
              height={52}
              className="h-[52px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link flex items-center gap-2"
                aria-label={item.name}
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}

            {/* Community Dropdown */}
            <div className="relative">
              <button
                className="nav-link flex items-center gap-2"
                onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
                onBlur={() => setTimeout(() => setCommunityDropdownOpen(false), 150)}
                aria-expanded={communityDropdownOpen}
                aria-haspopup="true"
                aria-label="Community menu"
              >
                Community
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${communityDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {communityDropdownOpen && (
                <div className="dropdown animate-fade-in" role="menu" aria-label="Community links">
                  {communityItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="dropdown-item"
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      role="menuitem"
                    >
                      {item.name}
                      {item.external && <span className="sr-only">(opens in new tab)</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side - Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-primary-light animate-pulse" aria-label="Loading user" />
            ) : user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-nav-hover transition-colors"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`User menu for ${user.username}`}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full"
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent-pink flex items-center justify-center" aria-hidden="true">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-small font-medium">{user.username}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {userDropdownOpen && (
                  <div className="dropdown right-0 left-auto animate-fade-in" role="menu" aria-label="User options">
                    <div className="px-4 py-2 border-b border-white/10" role="status" aria-live="polite">
                      <p className="text-small text-muted">Credits</p>
                      <p className="font-semibold text-accent-yellow">{user.credits?.toLocaleString() || 0}</p>
                    </div>
                    <Link href="/profile" className="dropdown-item flex items-center gap-2" role="menuitem">
                      <UserIcon className="w-4 h-4" aria-hidden="true" />
                      Profile
                    </Link>
                    {isAdmin(user) && (
                      <Link href="/admin" className="dropdown-item flex items-center gap-2" role="menuitem">
                        <CogIcon className="w-4 h-4" aria-hidden="true" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="dropdown-item w-full text-left flex items-center gap-2 text-error"
                      role="menuitem"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/api/v1/auth/steam/init" className="btn-primary btn-sm" aria-label="Login with Steam">
                <SteamIcon className="w-4 h-4" aria-hidden="true" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-nav-hover transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            ) : (
              <MenuIcon className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden py-4 border-t border-white/5 animate-slide-down"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-2" role="menu">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                  role="menuitem"
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-white/5 my-2" role="separator" aria-hidden="true" />
              {communityItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                  role="menuitem"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {item.name}
                  {item.external && <span className="sr-only">(opens in new tab)</span>}
                </Link>
              ))}
              <div className="border-t border-white/5 my-2" role="separator" aria-hidden="true" />
              {user ? (
                <>
                  <Link href="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)} role="menuitem">
                    Profile
                  </Link>
                  {isAdmin(user) && (
                    <Link href="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)} role="menuitem">
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className="nav-link text-left text-error" role="menuitem">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/api/v1/auth/steam/init" className="btn-primary" aria-label="Login with Steam">
                  <SteamIcon className="w-4 h-4" aria-hidden="true" />
                  Login with Steam
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
