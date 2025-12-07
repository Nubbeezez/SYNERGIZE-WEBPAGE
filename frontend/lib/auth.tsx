'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export interface User {
  id: number
  steam_id: string
  username: string
  avatar_url: string | null
  credits: number
  roles: string[]
  is_banned: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: () => void
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.get<{ data: User }>('/users/me')
      setUser(data.data)
    } catch (err) {
      // User is not authenticated - this is normal
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = () => {
    // Redirect to Steam login
    window.location.href = '/api/v1/auth/steam/init'
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
      setUser(null)
      window.location.href = '/'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const refetch = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Role hierarchy (matches backend)
 * user: normal user (no login required for basic site access)
 * vip: bought VIP perks
 * admin: granted through application
 * senior-admin: admin after 1 year (same permissions, honorary title)
 * head-admin: leads a team of ~5 admins
 * manager: almost full access, just under owner
 * owner: full access to everything
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  'user': 0,
  'vip': 1,
  'admin': 10,
  'senior-admin': 10,
  'head-admin': 20,
  'manager': 30,
  'owner': 100,
}

export const VALID_ROLES = Object.keys(ROLE_HIERARCHY)

// Get user's permission level
export function getPermissionLevel(user: User | null): number {
  if (!user?.roles) return 0
  let highest = 0
  for (const role of user.roles) {
    const level = ROLE_HIERARCHY[role] ?? 0
    if (level > highest) highest = level
  }
  return highest
}

// Get user's highest role name
export function getHighestRole(user: User | null): string {
  if (!user?.roles) return 'user'
  let highest = 'user'
  let highestLevel = 0
  for (const role of user.roles) {
    const level = ROLE_HIERARCHY[role] ?? 0
    if (level > highestLevel) {
      highestLevel = level
      highest = role
    }
  }
  return highest
}

// Helper to check if user has a specific role
export function hasRole(user: User | null, role: string): boolean {
  return user?.roles?.includes(role) ?? false
}

// Check if user can access admin panel (admin or higher)
export function isAdmin(user: User | null): boolean {
  return getPermissionLevel(user) >= ROLE_HIERARCHY['admin']
}

// Check if user is head-admin or higher
export function isHeadAdmin(user: User | null): boolean {
  return getPermissionLevel(user) >= ROLE_HIERARCHY['head-admin']
}

// Check if user is manager or higher
export function isManager(user: User | null): boolean {
  return getPermissionLevel(user) >= ROLE_HIERARCHY['manager']
}

// Check if user is owner
export function isOwner(user: User | null): boolean {
  return hasRole(user, 'owner')
}

// Check if user can manage roles (manager or owner)
export function canManageRoles(user: User | null): boolean {
  return isManager(user)
}

// Check if user can manage servers (owner only)
export function canManageServers(user: User | null): boolean {
  return isOwner(user)
}

// Check if user can manage settings (owner only)
export function canManageSettings(user: User | null): boolean {
  return isOwner(user)
}

// Format role name for display
export function formatRoleName(role: string): string {
  return role.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Get role color for badges
export function getRoleColor(role: string): string {
  switch (role) {
    case 'owner': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'manager': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'head-admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'senior-admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'admin': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    case 'vip': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}
