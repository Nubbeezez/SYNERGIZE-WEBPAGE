'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bansApi, adminApi, serversApi, type Ban } from '@/lib/api'
import { ShieldIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@/components/icons'

export default function AdminBansPage() {
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bans', { search }],
    queryFn: () => bansApi.list({ search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.removeBan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bans'] })
    },
  })

  const handleDelete = async (ban: Ban) => {
    if (!confirm(`Are you sure you want to remove the ban for ${ban.username}?`)) return
    try {
      await deleteMutation.mutateAsync(ban.id)
    } catch (err) {
      alert('Failed to remove ban')
    }
  }

  const bans = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 mb-2">Ban Management</h1>
          <p className="text-muted">Manage player bans across all servers.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          New Ban
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search by Steam ID or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Bans Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary">
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Player</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Steam ID</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Reason</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Scope</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Expires</th>
                <th className="px-4 py-3 text-left text-muted text-small font-medium">Banned By</th>
                <th className="px-4 py-3 text-right text-muted text-small font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-primary/50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-6 bg-primary rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : bans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    No bans found
                  </td>
                </tr>
              ) : (
                bans.map((ban) => (
                  <tr key={ban.id} className="border-b border-primary/50 hover:bg-primary/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium">{ban.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small font-mono text-muted">{ban.steam_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small">{ban.reason}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${
                        ban.scope === 'global' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                      }`}>
                        {ban.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small text-muted">
                        {ban.is_permanent ? 'Never' : ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small text-muted">{ban.actor.username}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(ban)}
                        className="p-2 text-error hover:bg-error/20 rounded transition-colors"
                        title="Remove ban"
                      >
                        <TrashIcon className="w-4 h-4" />
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
            Showing {bans.length} of {data.meta.total} bans
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBanModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function CreateBanModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    steam_id: '',
    reason: '',
    scope: 'global',
    server_id: '',
    duration: 'permanent',
    custom_days: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.list(),
  })

  const servers = serversData?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let expires_at: string | undefined
      if (formData.duration !== 'permanent') {
        const days = formData.duration === 'custom'
          ? parseInt(formData.custom_days)
          : parseInt(formData.duration)
        const date = new Date()
        date.setDate(date.getDate() + days)
        expires_at = date.toISOString()
      }

      await adminApi.createBan({
        steam_id: formData.steam_id,
        reason: formData.reason,
        scope: formData.scope,
        server_id: formData.scope === 'server' && formData.server_id ? parseInt(formData.server_id) : undefined,
        expires_at,
      })

      queryClient.invalidateQueries({ queryKey: ['admin-bans'] })
      onClose()
    } catch (err) {
      alert('Failed to create ban')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-h3 mb-6">Create New Ban</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-small text-muted mb-2">Steam ID</label>
            <input
              type="text"
              value={formData.steam_id}
              onChange={(e) => setFormData({ ...formData, steam_id: e.target.value })}
              placeholder="76561198..."
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-small text-muted mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for the ban..."
              className="input min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-small text-muted mb-2">Scope</label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="input"
            >
              <option value="global">Global (All Servers)</option>
              <option value="server">Specific Server</option>
            </select>
          </div>

          {formData.scope === 'server' && (
            <div>
              <label className="block text-small text-muted mb-2">Server</label>
              <select
                value={formData.server_id}
                onChange={(e) => setFormData({ ...formData, server_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select a server</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-small text-muted mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="input"
            >
              <option value="permanent">Permanent</option>
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {formData.duration === 'custom' && (
            <div>
              <label className="block text-small text-muted mb-2">Days</label>
              <input
                type="number"
                value={formData.custom_days}
                onChange={(e) => setFormData({ ...formData, custom_days: e.target.value })}
                placeholder="Number of days"
                className="input"
                min="1"
                required
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
