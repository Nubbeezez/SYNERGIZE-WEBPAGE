'use client'

import Link from 'next/link'
import { type Server } from '@/lib/api'
import { UsersIcon, MapPinIcon, PlayIcon } from './icons'
import { getRegionName, getConnectUrl, copyToClipboard } from '@/lib/utils'
import { useState } from 'react'

interface ServerCardProps {
  server: Server
}

export function ServerCard({ server }: ServerCardProps) {
  const [copied, setCopied] = useState(false)

  const handleConnect = () => {
    window.location.href = getConnectUrl(server.ip, server.port)
  }

  const handleCopyIp = async () => {
    const success = await copyToClipboard(`${server.ip}:${server.port}`)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const playerPercentage = (server.players / server.max_players) * 100

  return (
    <div className="card-hover group">
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${server.status === 'online' ? 'status-dot-online' : 'status-dot-offline'}`}
          />
          <span className="text-tiny text-muted uppercase tracking-wider">
            {server.status}
          </span>
        </div>
        <span className="badge bg-primary-light text-muted">
          {getRegionName(server.region)}
        </span>
      </div>

      {/* Server name */}
      <Link href={`/servers/${server.id}`}>
        <h3 className="text-h4 mb-2 group-hover:text-accent-pink transition-colors line-clamp-1">
          {server.name}
        </h3>
      </Link>

      {/* Map */}
      <div className="flex items-center gap-2 text-muted text-small mb-3">
        <MapPinIcon className="w-4 h-4" />
        <span>{server.map || 'Unknown map'}</span>
      </div>

      {/* Player count bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-small mb-1">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted" />
            <span>
              {server.players}/{server.max_players}
            </span>
          </div>
          <span className="text-muted">{Math.round(playerPercentage)}%</span>
        </div>
        <div className="h-1.5 bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              playerPercentage >= 90
                ? 'bg-error'
                : playerPercentage >= 70
                ? 'bg-warning'
                : 'bg-accent-green'
            }`}
            style={{ width: `${playerPercentage}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      {server.tags && server.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {server.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-tiny px-2 py-0.5 rounded bg-primary text-muted"
            >
              {tag}
            </span>
          ))}
          {server.tags.length > 3 && (
            <span className="text-tiny px-2 py-0.5 rounded bg-primary text-muted">
              +{server.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={server.status !== 'online'}
          className="btn-primary flex-1"
        >
          <PlayIcon className="w-4 h-4" />
          Connect
        </button>
        <button
          onClick={handleCopyIp}
          className="btn-secondary px-3"
          title="Copy server IP"
        >
          {copied ? '✓' : 'IP'}
        </button>
      </div>
    </div>
  )
}
