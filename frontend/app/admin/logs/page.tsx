'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type AuditLog } from '@/lib/api'
import { DocumentIcon, MagnifyingGlassIcon, FilterIcon } from '@/components/icons'

const actionTypes = [
  { value: '', label: 'All Actions' },
  { value: 'ban.create', label: 'Ban Created' },
  { value: 'ban.remove', label: 'Ban Removed' },
  { value: 'role.assign', label: 'Role Assigned' },
  { value: 'role.remove', label: 'Role Removed' },
  { value: 'user.update', label: 'User Updated' },
  { value: 'shop.create', label: 'Shop Item Created' },
  { value: 'shop.update', label: 'Shop Item Updated' },
  { value: 'server.update', label: 'Server Updated' },
]

export default function AdminLogsPage() {
  const [actorSearch, setActorSearch] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', { actorSearch, action, dateFrom, dateTo }],
    queryFn: () => adminApi.getLogs({
      actor_steam_id: actorSearch || undefined,
      action: action || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    refetchInterval: 30000,
  })

  const logs = data?.data || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 mb-2">Audit Logs</h1>
        <p className="text-muted">Track all administrative actions across the platform.</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="w-5 h-5 text-muted" />
          <h3 className="text-h4">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-small text-muted mb-2">Admin Steam ID</label>
            <input
              type="text"
              placeholder="76561198..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-small text-muted mb-2">Action Type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input"
            >
              {actionTypes.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-small text-muted mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-small text-muted mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="card">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-primary rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-primary rounded w-1/3" />
                  <div className="h-4 bg-primary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted">No logs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="mt-6 text-center">
          <p className="text-muted text-small">
            Showing {logs.length} of {data.meta.total} logs
          </p>
        </div>
      )}
    </div>
  )
}

function LogEntry({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)

  const getActionColor = (action: string) => {
    if (action.includes('ban')) return 'text-error'
    if (action.includes('role')) return 'text-accent-pink'
    if (action.includes('shop')) return 'text-highlight'
    if (action.includes('user')) return 'text-accent-cyan'
    return 'text-muted'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return '+'
    if (action.includes('remove') || action.includes('delete')) return '-'
    if (action.includes('update')) return '~'
    return '•'
  }

  const formatAction = (action: string) => {
    return action.split('.').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div
      className="p-4 bg-primary rounded-lg cursor-pointer hover:bg-primary-light transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${getActionColor(log.action)} bg-current/10`}>
          {getActionIcon(log.action)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${getActionColor(log.action)}`}>
              {formatAction(log.action)}
            </span>
            <span className="text-muted">by</span>
            <span className="font-medium">{log.actor.username}</span>
          </div>

          <div className="flex items-center gap-4 mt-1 text-small text-muted">
            <span>{log.target_type} #{log.target_id}</span>
            <span>•</span>
            <span>{new Date(log.created_at).toLocaleString()}</span>
          </div>
        </div>

        <span className="text-muted text-small">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {expanded && Object.keys(log.payload).length > 0 && (
        <div className="mt-4 p-3 bg-primary-dark rounded text-small">
          <p className="text-muted mb-2">Payload:</p>
          <pre className="text-tiny overflow-x-auto">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
