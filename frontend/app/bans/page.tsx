'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bansApi, type Ban } from '@/lib/api'
import { ShieldIcon, MagnifyingGlassIcon, ClockIcon } from '@/components/icons'

const scopes = [
  { value: '', label: 'All Bans' },
  { value: 'global', label: 'Global Bans' },
  { value: 'server', label: 'Server Bans' },
]

export default function BansPage() {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['bans', { search, scope, active: activeOnly }],
    queryFn: () => bansApi.list({
      search: search || undefined,
      scope: scope || undefined,
      active: activeOnly,
    }),
    refetchInterval: 30000,
  })

  const bans = data?.data || []

  return (
    <div className="section">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldIcon className="w-8 h-8 text-accent-green" />
            <h1 className="text-h1">Ban List</h1>
          </div>
          <p className="text-muted">
            Public record of banned players. We maintain transparency to ensure fair gameplay.
          </p>
        </div>

        {/* Check Your Status */}
        <BanChecker />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search by Steam ID or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Scope filter */}
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="input w-full md:w-48"
          >
            {scopes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-primary bg-primary text-accent-pink focus:ring-accent-pink"
            />
            <span className="text-small">Active bans only</span>
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-primary-light/30 text-center">
            <p className="text-h2 text-error">{data?.meta?.total || 0}</p>
            <p className="text-tiny text-muted">Total Bans</p>
          </div>
          <div className="card bg-primary-light/30 text-center">
            <p className="text-h2 text-accent-pink">{bans.filter(b => b.scope === 'global').length}</p>
            <p className="text-tiny text-muted">Global Bans</p>
          </div>
          <div className="card bg-primary-light/30 text-center">
            <p className="text-h2 text-accent-cyan">{bans.filter(b => b.scope === 'server').length}</p>
            <p className="text-tiny text-muted">Server Bans</p>
          </div>
          <div className="card bg-primary-light/30 text-center">
            <p className="text-h2 text-highlight">{bans.filter(b => b.is_permanent).length}</p>
            <p className="text-tiny text-muted">Permanent</p>
          </div>
        </div>

        {/* Ban List */}
        {isLoading ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-primary rounded w-1/4" />
                    <div className="h-4 bg-primary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-error mb-4">Failed to load ban list</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        ) : bans.length === 0 ? (
          <div className="card text-center py-12">
            <ShieldIcon className="w-16 h-16 text-accent-green mx-auto mb-4" />
            <p className="text-muted">No bans found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bans.map((ban) => (
              <BanCard key={ban.id} ban={ban} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.last_page > 1 && (
          <div className="mt-8 flex justify-center">
            <p className="text-muted text-small">
              Showing {bans.length} of {data.meta.total} bans
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BanChecker() {
  const [steamId, setSteamId] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{ is_banned: boolean; bans: Ban[] } | null>(null)

  const handleCheck = async () => {
    if (!steamId.trim()) return

    setChecking(true)
    try {
      const response = await bansApi.check(steamId.trim())
      setResult(response.data)
    } catch (err) {
      setResult(null)
      alert('Failed to check ban status')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="card bg-gradient-card mb-8">
      <h3 className="text-h4 mb-4">Check Your Ban Status</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Enter Steam ID (e.g., 76561198...)"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          className="input flex-1"
        />
        <button
          onClick={handleCheck}
          disabled={checking || !steamId.trim()}
          className="btn-primary"
        >
          {checking ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.is_banned ? 'bg-error/20 text-error' : 'bg-accent-green/20 text-accent-green'}`}>
          {result.is_banned ? (
            <div>
              <p className="font-bold mb-2">This account has {result.bans.length} active ban(s)</p>
              {result.bans.map((ban, i) => (
                <p key={i} className="text-small">
                  - {ban.reason} ({ban.is_permanent ? 'Permanent' : `Expires: ${new Date(ban.expires_at!).toLocaleDateString()}`})
                </p>
              ))}
            </div>
          ) : (
            <p className="font-bold">This account is not banned</p>
          )}
        </div>
      )}
    </div>
  )
}

function BanCard({ ban }: { ban: Ban }) {
  const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date()

  return (
    <div className={`card ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-tiny font-bold ${
              ban.scope === 'global' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
            }`}>
              {ban.scope.toUpperCase()}
            </span>
            {ban.is_permanent && (
              <span className="px-2 py-1 rounded text-tiny font-bold bg-primary text-muted">
                PERMANENT
              </span>
            )}
            {isExpired && (
              <span className="px-2 py-1 rounded text-tiny font-bold bg-accent-green/20 text-accent-green">
                EXPIRED
              </span>
            )}
          </div>

          <h4 className="text-h4 mb-1">{ban.username}</h4>
          <p className="text-small text-muted font-mono mb-2">{ban.steam_id}</p>

          <p className="text-small">
            <span className="text-muted">Reason:</span>{' '}
            <span className="text-error">{ban.reason}</span>
          </p>

          {ban.server && (
            <p className="text-small text-muted">
              Server: {ban.server.name}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-col items-end text-small text-muted">
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon className="w-4 h-4" />
            <span>Banned: {new Date(ban.created_at).toLocaleDateString()}</span>
          </div>
          {ban.expires_at && (
            <p>
              {isExpired ? 'Expired' : 'Expires'}: {new Date(ban.expires_at).toLocaleDateString()}
            </p>
          )}
          <p className="text-tiny mt-2">
            By: {ban.actor.username}
          </p>
        </div>
      </div>
    </div>
  )
}
