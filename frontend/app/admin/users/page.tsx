'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUser } from '@/lib/api'
import {
  useAuth,
  isOwner as checkIsOwner,
  VALID_ROLES,
  formatRoleName,
  getRoleColor,
  ROLE_HIERARCHY,
} from '@/lib/auth'
import { useDebounce } from '@/lib/hooks'
import { UsersIcon, MagnifyingGlassIcon, ShieldIcon, CheckIcon, XMarkIcon } from '@/components/icons'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search: debouncedSearch, role: roleFilter, page }],
    queryFn: () => adminApi.getUsers({
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      page,
      per_page: 20,
    }),
  })

  const users = data?.data || []
  const meta = data?.meta

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 mb-2">User Management</h1>
        <p className="text-muted">Search users and manage their roles.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search by Steam ID or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="input w-full md:w-48"
        >
          <option value="">All Roles</option>
          {VALID_ROLES.map((role) => (
            <option key={role} value={role}>
              {formatRoleName(role)}
            </option>
          ))}
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
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Roles</th>
                <th className="px-4 py-3 text-right text-muted text-small font-medium">Credits</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Status</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Joined</th>
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
                          <Image
                            src={user.avatar_url}
                            alt={user.username}
                            width={32}
                            height={32}
                            className="rounded-full"
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
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.filter(r => r !== 'user').map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded text-tiny font-medium border ${getRoleColor(role)}`}
                          >
                            {formatRoleName(role)}
                          </span>
                        ))}
                        {(!user.roles || user.roles.length === 0 || (user.roles.length === 1 && user.roles[0] === 'user')) && (
                          <span className="px-2 py-0.5 rounded text-tiny font-medium bg-gray-500/20 text-gray-400">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-highlight">{user.credits?.toLocaleString() || 0}</span>
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
                        {new Date(user.created_at).toLocaleDateString()}
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
      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-muted text-small">
            Showing {users.length} of {meta.total} users (Page {meta.page} of {meta.last_page})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary text-small"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              className="btn-secondary text-small"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserRoleModal
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
          }}
        />
      )}
    </div>
  )
}

function UserRoleModal({
  user,
  currentUser,
  onClose,
  onUpdate,
}: {
  user: AdminUser
  currentUser: ReturnType<typeof useAuth>['user']
  onClose: () => void
  onUpdate: () => void
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || ['user'])
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isCurrentUserOwner = checkIsOwner(currentUser)

  // Determine which roles the current user can assign
  const canAssignRole = (role: string): boolean => {
    // Owner can assign any role
    if (isCurrentUserOwner) return true

    // Manager can assign roles below manager level
    const roleLevel = ROLE_HIERARCHY[role] || 0
    return roleLevel < ROLE_HIERARCHY['manager']
  }

  const handleToggleRole = (role: string) => {
    if (!canAssignRole(role)) return

    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Can't remove 'user' role
        if (role === 'user') return prev
        return prev.filter((r) => r !== role)
      } else {
        return [...prev, role]
      }
    })
    setSuccess(false)
    setError(null)
  }

  const handleSave = async () => {
    setIsUpdating(true)
    setError(null)
    setSuccess(false)

    try {
      await adminApi.updateUserRoles(user.id, selectedRoles)
      setSuccess(true)
      onUpdate()
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to update roles')
    } finally {
      setIsUpdating(false)
    }
  }

  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify((user.roles || ['user']).sort())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl text-muted">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-h3">{user.username}</h2>
            <p className="text-small text-muted font-mono">{user.steam_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-primary rounded-lg">
          <div>
            <p className="text-tiny text-muted">Credits</p>
            <p className="text-highlight font-bold">{user.credits?.toLocaleString() || 0}</p>
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

        {/* Role Selection */}
        <div className="mb-6">
          <h4 className="text-h4 mb-3 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-accent-pink" />
            Manage Roles
          </h4>
          <p className="text-small text-muted mb-4">
            Select the roles for this user. Changes are saved when you click &quot;Save Changes&quot;.
          </p>

          <div className="space-y-2">
            {VALID_ROLES.filter(r => r !== 'user').map((role) => {
              const isSelected = selectedRoles.includes(role)
              const canAssign = canAssignRole(role)
              const roleLevel = ROLE_HIERARCHY[role]

              return (
                <button
                  key={role}
                  onClick={() => handleToggleRole(role)}
                  disabled={!canAssign}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `${getRoleColor(role)} border-current`
                      : canAssign
                      ? 'border-primary hover:border-white/20 bg-primary/50'
                      : 'border-primary/50 bg-primary/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-current border-current' : 'border-muted'
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3 h-3 text-primary" />}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatRoleName(role)}</p>
                      <p className="text-tiny text-muted">
                        {role === 'vip' && 'Purchased VIP perks'}
                        {role === 'admin' && 'Basic admin access'}
                        {role === 'senior-admin' && 'Admin for 1+ year (honorary)'}
                        {role === 'head-admin' && 'Leads a team of admins'}
                        {role === 'manager' && 'Almost full access'}
                        {role === 'owner' && 'Full access to everything'}
                      </p>
                    </div>
                  </div>
                  <span className="text-tiny text-muted">Level {roleLevel}</span>
                </button>
              )
            })}
          </div>

          {!isCurrentUserOwner && (
            <p className="text-tiny text-muted mt-3">
              Note: You can only assign roles below Manager level. Only the Owner can assign Manager or Owner roles.
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/20 text-error text-small">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-accent-green/20 text-accent-green text-small flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            Roles updated successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || !hasChanges}
            className="btn-primary flex-1"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
