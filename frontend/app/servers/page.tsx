'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serversApi, type Server } from '@/lib/api'
import { useDebounce } from '@/lib/hooks'
import { ServerCard } from '@/components/ServerCard'
import { MagnifyingGlassIcon } from '@/components/icons'

const regions = [
  { value: '', label: 'All Regions' },
  { value: 'EU', label: 'Europe' },
  { value: 'NA', label: 'North America' },
  { value: 'SA', label: 'South America' },
  { value: 'AS', label: 'Asia' },
  { value: 'OC', label: 'Oceania' },
]

export default function ServersPage() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState<string>('')

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useQuery({
    queryKey: ['servers', { search: debouncedSearch, region, status }],
    queryFn: () => serversApi.list({
      search: debouncedSearch || undefined,
      region: region || undefined,
      status: status || undefined,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const servers = data?.data || []
  const totalPlayers = servers.reduce((acc, s) => acc + s.players, 0)
  const onlineServers = servers.filter(s => s.status === 'online').length

  return (
    <div className="section">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 mb-2">Server Browser</h1>
          <p className="text-muted">
            Find and connect to our CS2 servers. {onlineServers} servers online with {totalPlayers} players.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search servers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Region filter */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="input w-full md:w-48"
          >
            {regions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Server List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-primary rounded w-3/4 mb-4" />
                <div className="h-4 bg-primary rounded w-1/2 mb-2" />
                <div className="h-4 bg-primary rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-error mb-4">Failed to load servers</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        ) : servers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted mb-4">No servers found</p>
            {(search || region || status) && (
              <button
                onClick={() => {
                  setSearch('')
                  setRegion('')
                  setStatus('')
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}

        {/* Pagination would go here */}
        {data?.meta && data.meta.last_page > 1 && (
          <div className="mt-8 flex justify-center">
            <p className="text-muted text-small">
              Showing {servers.length} of {data.meta.total} servers
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
