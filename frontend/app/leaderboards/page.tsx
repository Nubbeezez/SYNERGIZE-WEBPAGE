'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { leaderboardsApi, serversApi, type LeaderboardEntry } from '@/lib/api'
import { TrophyIcon, MagnifyingGlassIcon } from '@/components/icons'

const periods = [
  { value: 'all', label: 'All Time' },
  { value: 'monthly', label: 'This Month' },
  { value: 'weekly', label: 'This Week' },
  { value: 'daily', label: 'Today' },
]

const sortOptions = [
  { value: 'points', label: 'Points' },
  { value: 'kills', label: 'Kills' },
  { value: 'kd_ratio', label: 'K/D Ratio' },
  { value: 'wins', label: 'Wins' },
  { value: 'hours', label: 'Hours Played' },
]

export default function LeaderboardsPage() {
  const [period, setPeriod] = useState('all')
  const [sortBy, setSortBy] = useState('points')
  const [serverId, setServerId] = useState<number | undefined>()
  const [search, setSearch] = useState('')

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.list({ status: 'online' }),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboards', { period, sortBy, serverId }],
    queryFn: () => leaderboardsApi.list({
      period: period !== 'all' ? period : undefined,
      sort: sortBy,
      server_id: serverId,
    }),
    refetchInterval: 60000,
  })

  const servers = serversData?.data || []
  const entries = data?.data || []

  const filteredEntries = search
    ? entries.filter(e => e.username.toLowerCase().includes(search.toLowerCase()))
    : entries

  return (
    <div className="section">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrophyIcon className="w-8 h-8 text-accent-cyan" />
            <h1 className="text-h1">Leaderboards</h1>
          </div>
          <p className="text-muted">
            Track your progress and see how you rank against other players.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Period filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input w-full lg:w-48"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-full lg:w-48"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                Sort by {s.label}
              </option>
            ))}
          </select>

          {/* Server filter */}
          <select
            value={serverId || ''}
            onChange={(e) => setServerId(e.target.value ? Number(e.target.value) : undefined)}
            className="input w-full lg:w-48"
          >
            <option value="">All Servers</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard Table */}
        {isLoading ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary rounded" />
                  <div className="w-10 h-10 bg-primary rounded-full" />
                  <div className="flex-1 h-6 bg-primary rounded" />
                  <div className="w-20 h-6 bg-primary rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-error mb-4">Failed to load leaderboards</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted">No players found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary">
                    <th className="px-4 py-3 text-left text-muted text-small font-medium">Rank</th>
                    <th className="px-4 py-3 text-left text-muted text-small font-medium">Player</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">Points</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">Kills</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">Deaths</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">K/D</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">Wins</th>
                    <th className="px-4 py-3 text-right text-muted text-small font-medium">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <LeaderboardRow key={entry.steam_id} entry={entry} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.last_page > 1 && (
          <div className="mt-8 flex justify-center">
            <p className="text-muted text-small">
              Showing {filteredEntries.length} of {data.meta.total} players
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-highlight bg-highlight/10'
    if (rank === 2) return 'text-gray-300 bg-gray-300/10'
    if (rank === 3) return 'text-amber-600 bg-amber-600/10'
    return 'text-muted bg-primary'
  }

  const rank = entry.rank || index + 1

  return (
    <tr className="border-b border-primary/50 hover:bg-primary/30 transition-colors">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-small font-bold ${getRankStyle(rank)}`}>
          {rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={entry.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-muted">
              {entry.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{entry.username}</p>
            <p className="text-tiny text-muted">
              Last active: {new Date(entry.last_active).toLocaleDateString()}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-accent-cyan font-bold">{entry.points.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 text-right text-accent-green">
        {entry.kills.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right text-error">
        {entry.deaths.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={entry.kd_ratio >= 1 ? 'text-accent-green' : 'text-error'}>
          {entry.kd_ratio.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {entry.wins.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right text-muted">
        {entry.hours.toLocaleString()}h
      </td>
    </tr>
  )
}
