'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type Server } from '@/lib/api'
import { useAuth, isOwner as checkIsOwner } from '@/lib/auth'
import {
  ServerIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
} from '@/components/icons'

const REGIONS = [
  { value: 'NA', label: 'North America' },
  { value: 'EU', label: 'Europe' },
  { value: 'AS', label: 'Asia' },
  { value: 'SA', label: 'South America' },
  { value: 'AU', label: 'Australia' },
]

export default function AdminServersPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const [deletingServer, setDeletingServer] = useState<Server | null>(null)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const userIsOwner = checkIsOwner(user)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-servers'],
    queryFn: () => adminApi.getServers(),
  })

  const servers = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-servers'] })
      setDeletingServer(null)
    },
  })

  if (!userIsOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card text-center max-w-md">
          <ServerIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-h2 mb-2">Access Denied</h1>
          <p className="text-muted">
            Only the owner can manage game servers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 mb-2">Server Management</h1>
          <p className="text-muted">Add, edit, and remove game servers from the server list.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Server
        </button>
      </div>

      {/* Servers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-primary rounded w-2/3 mb-4" />
              <div className="h-4 bg-primary rounded w-1/2 mb-2" />
              <div className="h-4 bg-primary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="card text-center py-12">
          <ServerIcon className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-h3 mb-2">No Servers</h2>
          <p className="text-muted mb-4">You haven&apos;t added any game servers yet.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            Add Your First Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <div key={server.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      server.status === 'online' ? 'bg-accent-green' : 'bg-error'
                    }`}
                  />
                  <h3 className="font-semibold">{server.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingServer(server)}
                    className="p-2 hover:bg-primary rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => setDeletingServer(server)}
                    className="p-2 hover:bg-error/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-small">
                <div className="flex justify-between">
                  <span className="text-muted">Address</span>
                  <span className="font-mono">{server.ip}:{server.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Region</span>
                  <span>{REGIONS.find(r => r.value === server.region)?.label || server.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Players</span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    {server.players}/{server.max_players}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Map</span>
                  <span>{server.map || 'Unknown'}</span>
                </div>
                {server.tags && server.tags.length > 0 && (
                  <div className="pt-2 border-t border-primary">
                    <div className="flex flex-wrap gap-1">
                      {server.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-tiny bg-accent-cyan/20 text-accent-cyan"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-primary">
                <div className="flex items-center justify-between text-tiny text-muted">
                  <span>Last polled</span>
                  <span>
                    {server.last_polled_at
                      ? new Date(server.last_polled_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingServer) && (
        <ServerFormModal
          server={editingServer}
          onClose={() => {
            setShowAddModal(false)
            setEditingServer(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-servers'] })
            setShowAddModal(false)
            setEditingServer(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-h3 mb-4">Delete Server</h2>
            <p className="text-muted mb-6">
              Are you sure you want to delete <strong>{deletingServer.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingServer(null)}
                className="btn-secondary flex-1"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingServer.id)}
                className="btn-primary bg-error hover:bg-error/80 flex-1"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ServerFormModal({
  server,
  onClose,
  onSuccess,
}: {
  server: Server | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = !!server
  const [formData, setFormData] = useState({
    name: server?.name || '',
    ip: server?.ip || '',
    port: server?.port || 27015,
    region: server?.region || 'NA',
    max_players: server?.max_players || 10,
    tags: server?.tags?.join(', ') || '',
    rcon_password: '',
  })
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createServer>[0]) =>
      adminApi.createServer(data),
    onSuccess,
    onError: (err: unknown) => {
      const error = err as { message?: string }
      setError(error.message || 'Failed to create server')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Parameters<typeof adminApi.updateServer>[1] }) =>
      adminApi.updateServer(data.id, data.updates),
    onSuccess,
    onError: (err: unknown) => {
      const error = err as { message?: string }
      setError(error.message || 'Failed to update server')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const data = {
      name: formData.name,
      ip: formData.ip,
      port: formData.port,
      region: formData.region,
      max_players: formData.max_players,
      tags,
      ...(formData.rcon_password ? { rcon_password: formData.rcon_password } : {}),
    }

    if (isEditing && server) {
      updateMutation.mutate({ id: server.id, updates: data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h3">{isEditing ? 'Edit Server' : 'Add New Server'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-primary rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-small font-medium mb-1">Server Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Awesome Server"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium mb-1">IP Address / Hostname</label>
              <input
                type="text"
                value={formData.ip}
                onChange={(e) => setFormData((f) => ({ ...f, ip: e.target.value }))}
                placeholder="192.168.1.1 or play.example.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-small font-medium mb-1">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData((f) => ({ ...f, port: parseInt(e.target.value) || 27015 }))}
                placeholder="27015"
                className="input"
                min={1}
                max={65535}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium mb-1">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData((f) => ({ ...f, region: e.target.value }))}
                className="input"
              >
                {REGIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small font-medium mb-1">Max Players</label>
              <input
                type="number"
                value={formData.max_players}
                onChange={(e) => setFormData((f) => ({ ...f, max_players: parseInt(e.target.value) || 10 }))}
                placeholder="10"
                className="input"
                min={1}
                max={128}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-small font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData((f) => ({ ...f, tags: e.target.value }))}
              placeholder="competitive, 128tick, ranked"
              className="input"
            />
            <p className="text-tiny text-muted mt-1">Optional tags to help categorize the server</p>
          </div>

          <div>
            <label className="block text-small font-medium mb-1">
              RCON Password {isEditing && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={formData.rcon_password}
              onChange={(e) => setFormData((f) => ({ ...f, rcon_password: e.target.value }))}
              placeholder="••••••••"
              className="input"
            />
            <p className="text-tiny text-muted mt-1">
              Optional: Used for sending commands to the server
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error/20 text-error text-small">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
