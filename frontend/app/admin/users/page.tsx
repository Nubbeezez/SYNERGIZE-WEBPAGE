'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, adminApi, type PaginatedResponse } from '@/lib/api'
import { UsersIcon, MagnifyingGlassIcon, ShieldIcon, CreditIcon } from '@/components/icons'

interface User {
  id: number
  steam_id: string
  username: string
  avatar_url: string | null
  role: string
  credits: number
  is_banned: boolean
  last_seen: string
  created_at: string
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, role: roleFilter }],
    queryFn: () => api.get<PaginatedResponse<User>>('/admin/users', {
      search: search || undefined,
      role: roleFilter || undefined,
    }),
  })

  const users = data?.data || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 mb-2">User Management</h1>
        <p className="text-muted">View and manage registered users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search by Steam ID or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-full md:w-48"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="vip">VIP</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary">
                <th className="px-4 py-3 text-left text-muted text-small font-medium">User</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Steam ID</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Role</th>
                <th className="px-4 py-3 text-right text-muted text-small font-medium">Credits</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Status</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Last Seen</th>
                <th className="px-4 py-3 text-right text-muted text-small font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-primary/50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-6 bg-primary rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-primary/50 hover:bg-primary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-muted">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small font-mono text-muted">{user.steam_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-highlight">{user.credits.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_banned ? (
                        <span className="px-2 py-1 rounded text-tiny font-medium bg-error/20 text-error">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-tiny font-medium bg-accent-green/20 text-accent-green">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small text-muted">
                        {new Date(user.last_seen).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="btn-secondary text-small"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="mt-6 text-center">
          <p className="text-muted text-small">
            Showing {users.length} of {data.meta.total} users
          </p>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const roleStyles: Record<string, string> = {
    user: 'bg-primary text-muted',
    vip: 'bg-highlight/20 text-highlight',
    moderator: 'bg-accent-cyan/20 text-accent-cyan',
    admin: 'bg-accent-pink/20 text-accent-pink',
    superadmin: 'bg-error/20 text-error',
  }

  return (
    <span className={`px-2 py-1 rounded text-tiny font-medium ${roleStyles[role] || roleStyles.user}`}>
      {role.toUpperCase()}
    </span>
  )
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [newRole, setNewRole] = useState(user.role)
  const [creditsToAdd, setCreditsToAdd] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  const handleRoleChange = async () => {
    if (newRole === user.role) return

    setIsUpdating(true)
    try {
      await adminApi.assignRole({
        steam_id: user.steam_id,
        role: newRole,
        scope: 'global',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      alert('Role updated successfully')
    } catch (err) {
      alert('Failed to update role')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddCredits = async () => {
    const amount = parseInt(creditsToAdd)
    if (!amount || isNaN(amount)) return

    setIsUpdating(true)
    try {
      await api.post('/admin/users/credits', {
        steam_id: user.steam_id,
        amount,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreditsToAdd('')
      alert('Credits added successfully')
    } catch (err) {
      alert('Failed to add credits')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl text-muted">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-h3">{user.username}</h2>
            <p className="text-small text-muted font-mono">{user.steam_id}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-primary rounded-lg">
          <div>
            <p className="text-tiny text-muted">Role</p>
            <RoleBadge role={user.role} />
          </div>
          <div>
            <p className="text-tiny text-muted">Credits</p>
            <p className="text-highlight font-bold">{user.credits.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-tiny text-muted">Status</p>
            <p className={user.is_banned ? 'text-error' : 'text-accent-green'}>
              {user.is_banned ? 'Banned' : 'Active'}
            </p>
          </div>
          <div>
            <p className="text-tiny text-muted">Joined</p>
            <p className="text-small">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Change Role */}
        <div className="mb-6">
          <h4 className="text-h4 mb-3 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-accent-pink" />
            Change Role
          </h4>
          <div className="flex gap-2">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="input flex-1"
            >
              <option value="user">User</option>
              <option value="vip">VIP</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <button
              onClick={handleRoleChange}
              disabled={isUpdating || newRole === user.role}
              className="btn-primary"
            >
              Update
            </button>
          </div>
        </div>

        {/* Add Credits */}
        <div className="mb-6">
          <h4 className="text-h4 mb-3 flex items-center gap-2">
            <CreditIcon className="w-5 h-5 text-highlight" />
            Add Credits
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(e.target.value)}
              placeholder="Amount"
              className="input flex-1"
            />
            <button
              onClick={handleAddCredits}
              disabled={isUpdating || !creditsToAdd}
              className="btn-primary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  )
}
