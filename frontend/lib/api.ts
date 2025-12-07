const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: ApiError = errorData.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }
      throw new ApiRequestError(error.message, error.code, response.status, error.details)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let url = path
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export class ApiRequestError extends Error {
  code: string
  status: number
  details?: Record<string, string[]>

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export const api = new ApiClient(API_BASE_URL)

// Type definitions for API responses
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    last_page: number
  }
}

export interface Server {
  id: number
  name: string
  ip: string
  port: number
  region: string
  status: 'online' | 'offline'
  map: string
  players: number
  max_players: number
  tags: string[]
  last_polled_at: string
}

export interface LeaderboardEntry {
  rank: number
  steam_id: string
  username: string
  avatar_url: string | null
  kills: number
  deaths: number
  wins: number
  hours: number
  points: number
  kd_ratio: number
  last_active: string
}

export interface Ban {
  id: number
  steam_id: string
  username: string
  reason: string
  scope: 'global' | 'server'
  server: Server | null
  expires_at: string | null
  is_permanent: boolean
  created_at: string
  actor: {
    steam_id: string
    username: string
  }
}

export interface ShopItem {
  id: number
  name: string
  description: string
  price: number
  type: 'perk' | 'skin' | 'role' | 'other'
  available: boolean
  metadata: Record<string, unknown>
}

export interface AuditLog {
  id: number
  actor: {
    steam_id: string
    username: string
  }
  action: string
  target_type: string
  target_id: number
  payload: Record<string, unknown>
  created_at: string
}

// API function helpers
export const serversApi = {
  list: (params?: { status?: string; region?: string; search?: string; page?: number }) =>
    api.get<PaginatedResponse<Server>>('/servers', params),
  get: (id: number) => api.get<{ data: Server }>(`/servers/${id}`),
}

export const leaderboardsApi = {
  list: (params?: { server_id?: number; period?: string; sort?: string; page?: number }) =>
    api.get<PaginatedResponse<LeaderboardEntry>>('/leaderboards', params),
  getPlayer: (steamId: string) =>
    api.get<{ data: LeaderboardEntry }>(`/leaderboards/player/${steamId}`),
}

export const bansApi = {
  list: (params?: { steam_id?: string; search?: string; scope?: string; active?: boolean; page?: number }) =>
    api.get<PaginatedResponse<Ban>>('/bans', params),
  check: (steamId: string) =>
    api.get<{ data: { is_banned: boolean; bans: Ban[] } }>(`/bans/check/${steamId}`),
}

export const shopApi = {
  list: (params?: { type?: string; available?: boolean }) =>
    api.get<{ data: ShopItem[] }>('/shop/items', params),
  purchase: (itemId: number) =>
    api.post<{ data: { message: string; item: ShopItem; new_balance: number } }>('/shop/purchase', { item_id: itemId }),
}

export const adminApi = {
  // Bans
  createBan: (data: { steam_id: string; reason: string; scope: string; server_id?: number; expires_at?: string }) =>
    api.post<{ data: Ban }>('/admin/bans', data),
  removeBan: (id: number, reason?: string) =>
    api.delete<{ data: { message: string } }>(`/admin/bans/${id}`),

  // Roles
  assignRole: (data: { steam_id: string; role: string; scope: string; server_id?: number; expires_at?: string }) =>
    api.post<{ data: { message: string } }>('/admin/assign-role', data),
  removeRole: (assignmentId: number) =>
    api.delete<{ data: { message: string } }>(`/admin/roles/${assignmentId}`),

  // Logs
  getLogs: (params?: { actor_steam_id?: string; action?: string; from?: string; to?: string; page?: number }) =>
    api.get<PaginatedResponse<AuditLog>>('/admin/logs', params),
}
