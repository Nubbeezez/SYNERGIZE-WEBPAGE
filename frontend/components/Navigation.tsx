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
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link flex items-center gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}

            {/* Community Dropdown */}
            <div className="relative">
              <button
                className="nav-link flex items-center gap-2"
                onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
                onBlur={() => setTimeout(() => setCommunityDropdownOpen(false), 150)}
              >
                Community
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${communityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {communityDropdownOpen && (
                <div className="dropdown animate-fade-in">
                  {communityItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="dropdown-item"
                      target={item.external ? '_blank' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-primary-light animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-nav-hover transition-colors"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent-pink flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-small font-medium">{user.username}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {userDropdownOpen && (
                  <div className="dropdown right-0 left-auto animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-small text-muted">Credits</p>
                      <p className="font-semibold text-accent-yellow">{user.credits?.toLocaleString() || 0}</p>
                    </div>
                    <Link href="/profile" className="dropdown-item flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </Link>
                    {isAdmin(user) && (
                      <Link href="/admin" className="dropdown-item flex items-center gap-2">
                        <CogIcon className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="dropdown-item w-full text-left flex items-center gap-2 text-error"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/api/v1/auth/steam/init" className="btn-primary btn-sm">
                <SteamIcon className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-nav-hover transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-slide-down">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-white/5 my-2" />
              {communityItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-white/5 my-2" />
              {user ? (
                <>
                  <Link href="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {isAdmin(user) && (
                    <Link href="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className="nav-link text-left text-error">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/api/v1/auth/steam/init" className="btn-primary">
                  <SteamIcon className="w-4 h-4" />
                  Login with Steam
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
