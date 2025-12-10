'use client'

import { useQuery } from '@tanstack/react-query'
import { serversApi, bansApi, leaderboardsApi } from '@/lib/api'
import {
  ServerIcon,
  UsersIcon,
  ShieldIcon,
  TrophyIcon,
  ChartIcon,
  ClockIcon,
} from '@/components/icons'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ['admin-servers'],
    queryFn: () => serversApi.list(),
  })

  const { data: bansData, isLoading: bansLoading } = useQuery({
    queryKey: ['admin-bans'],
    queryFn: () => bansApi.list({ active: true }),
  })

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['admin-leaderboard'],
    queryFn: () => leaderboardsApi.list({ period: 'daily' }),
  })

  const servers = serversData?.data || []
  const bans = bansData?.data || []
  const players = leaderboardData?.data || []

  const onlineServers = servers.filter(s => s.status === 'online').length
  const totalPlayers = servers.reduce((acc, s) => acc + s.players, 0)
  const totalSlots = servers.reduce((acc, s) => acc + s.max_players, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h1 mb-2">Dashboard</h1>
        <p className="text-muted">Overview of your community platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<ServerIcon className="w-6 h-6" />}
          label="Servers Online"
          value={`${onlineServers}/${servers.length}`}
          color="pink"
          isLoading={serversLoading}
        />
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          label="Players Online"
          value={`${totalPlayers}/${totalSlots}`}
          color="cyan"
          isLoading={serversLoading}
        />
        <StatCard
          icon={<ShieldIcon className="w-6 h-6" />}
          label="Active Bans"
          value={bansData?.meta?.total?.toString() || '0'}
          color="green"
          isLoading={bansLoading}
        />
        <StatCard
          icon={<TrophyIcon className="w-6 h-6" />}
          label="Daily Active"
          value={players.length.toString()}
          color="yellow"
          isLoading={leaderboardLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-h4 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/bans/new" className="btn-primary text-center">
              Issue Ban
            </Link>
            <Link href="/admin/users" className="btn-secondary text-center">
              Manage Users
            </Link>
            <Link href="/admin/shop/new" className="btn-secondary text-center">
              Add Shop Item
            </Link>
            <Link href="/admin/logs" className="btn-secondary text-center">
              View Logs
            </Link>
          </div>
        </div>

        {/* Server Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4">Server Status</h3>
            <Link href="/admin/servers" className="text-small text-accent-pink hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {serversLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary-light" />
                    <span className="h-4 w-24 bg-primary-light rounded" />
                  </div>
                  <span className="h-4 w-12 bg-primary-light rounded" />
                </div>
              ))
            ) : servers.length === 0 ? (
              <p className="text-muted text-center py-4">No servers configured</p>
            ) : (
              servers.slice(0, 4).map((server) => (
                <div key={server.id} className="flex items-center justify-between p-3 bg-primary rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-accent-green' : 'bg-error'}`} />
                    <span className="text-small">{server.name}</span>
                  </div>
                  <span className="text-small text-muted">
                    {server.players}/{server.max_players}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4">Recent Bans</h3>
            <Link href="/admin/bans" className="text-small text-accent-pink hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {bansLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary rounded-lg animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-primary-light rounded" />
                    <div className="h-3 w-32 bg-primary-light rounded" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-3 w-12 bg-primary-light rounded ml-auto" />
                    <div className="h-3 w-16 bg-primary-light rounded ml-auto" />
                  </div>
                </div>
              ))
            ) : bans.length === 0 ? (
              <p className="text-muted text-center py-4">No recent bans</p>
            ) : (
              bans.slice(0, 5).map((ban) => (
                <div key={ban.id} className="flex items-center justify-between p-3 bg-primary rounded-lg">
                  <div>
                    <p className="text-small font-medium">{ban.username}</p>
                    <p className="text-tiny text-muted">{ban.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-tiny ${ban.scope === 'global' ? 'text-error' : 'text-warning'}`}>
                      {ban.scope}
                    </p>
                    <p className="text-tiny text-muted">
                      {new Date(ban.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Players Today */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4">Top Players Today</h3>
            <Link href="/leaderboards" className="text-small text-accent-pink hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {leaderboardLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-light" />
                    <span className="h-4 w-20 bg-primary-light rounded" />
                  </div>
                  <span className="h-4 w-16 bg-primary-light rounded" />
                </div>
              ))
            ) : players.length === 0 ? (
              <p className="text-muted text-center py-4">No activity today</p>
            ) : (
              players.slice(0, 5).map((player, index) => (
                <div key={player.steam_id} className="flex items-center justify-between p-3 bg-primary rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-tiny font-bold ${
                      index === 0 ? 'bg-highlight/20 text-highlight' :
                      index === 1 ? 'bg-gray-300/20 text-gray-300' :
                      index === 2 ? 'bg-amber-600/20 text-amber-600' :
                      'bg-primary-light text-muted'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-small">{player.username}</span>
                  </div>
                  <span className="text-small text-accent-cyan">{player.points.toLocaleString()} pts</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'pink' | 'cyan' | 'green' | 'yellow'
  isLoading?: boolean
}

function StatCard({ icon, label, value, color, isLoading }: StatCardProps) {
  const colorClasses = {
    pink: 'text-accent-pink bg-accent-pink/10',
    cyan: 'text-accent-cyan bg-accent-cyan/10',
    green: 'text-accent-green bg-accent-green/10',
    yellow: 'text-highlight bg-highlight/10',
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-small text-muted">{label}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-primary rounded animate-pulse" />
          ) : (
            <p className="text-h3">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}
