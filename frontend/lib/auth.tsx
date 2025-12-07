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

// Helper to check if user has a specific role
export function hasRole(user: User | null, role: string): boolean {
  return user?.roles?.includes(role) ?? false
}

// Helper to check if user is admin or higher
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin') || hasRole(user, 'superadmin')
}

// Helper to check if user is superadmin
export function isSuperAdmin(user: User | null): boolean {
  return hasRole(user, 'superadmin')
}
