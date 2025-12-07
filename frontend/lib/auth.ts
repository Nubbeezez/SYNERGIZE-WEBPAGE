'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'

export interface User {
  id: number
  steam_id: string
  username: string
  avatar_url: string | null
  role: string
  roles?: string[]
  credits: number
  is_banned: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: () => void
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: () => {
        // Redirect to Steam OAuth
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/steam/init`
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          // Ignore errors on logout
        }
        set({ user: null, isAuthenticated: false })
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const response = await api.get<{ data: User }>('/users/me')
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Hook for easy access
export function useAuth() {
  const { user, isLoading, isAuthenticated, login, logout, fetchUser } = useAuthStore()

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    fetchUser,
  }
}

// Auth provider component to fetch user on mount
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuthStore()

  // Fetch user on initial load
  if (typeof window !== 'undefined') {
    // Only fetch once on mount
    const hasInitialized = useAuthStore.getState().user !== undefined || !useAuthStore.getState().isLoading
    if (!hasInitialized) {
      fetchUser()
    }
  }

  return <>{children}</>
}
