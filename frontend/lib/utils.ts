import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes with clsx
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers with K/M suffixes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// Format player count (e.g., "18/24")
export function formatPlayerCount(players: number, maxPlayers: number): string {
  return `${players}/${maxPlayers}`
}

// Format time duration (e.g., "2h 30m")
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) {
    return `${h}h`
  }
  return `${h}h ${m}m`
}

// Format date relative to now
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'just now'
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString()
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format date and time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Calculate K/D ratio
export function calculateKDRatio(kills: number, deaths: number): number {
  if (deaths === 0) return kills
  return Math.round((kills / deaths) * 100) / 100
}

// Validate Steam ID format
export function isValidSteamId(steamId: string): boolean {
  return /^7656119\d{10}$/.test(steamId)
}

// Generate Steam profile URL
export function getSteamProfileUrl(steamId: string): string {
  return `https://steamcommunity.com/profiles/${steamId}`
}

// Generate connect URL for CS2
export function getConnectUrl(ip: string, port: number): string {
  return `steam://connect/${ip}:${port}`
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Region code to name mapping
export const regionNames: Record<string, string> = {
  EU: 'Europe',
  NA: 'North America',
  SA: 'South America',
  AS: 'Asia',
  OC: 'Oceania',
  AF: 'Africa',
}

export function getRegionName(code: string): string {
  return regionNames[code] || code
}
