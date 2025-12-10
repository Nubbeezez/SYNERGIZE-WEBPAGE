'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Only show loading screen on first visit (check sessionStorage)
    const hasVisited = sessionStorage.getItem('synergize_visited')

    if (hasVisited) {
      // Already visited this session, don't show loading screen
      setIsLoading(false)
      return
    }

    // First visit - show loading screen
    setIsLoading(true)
    sessionStorage.setItem('synergize_visited', 'true')

    // Start fade out after a short delay
    const timer = setTimeout(() => {
      setFadeOut(true)
      // Remove from DOM after fade animation
      setTimeout(() => setIsLoading(false), 500)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div
      className={`fixed inset-0 z-[100] bg-primary flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        {/* Logo with pulse animation */}
        <div className="animate-pulse-slow">
          <Image
            src="/logo.png"
            alt="Synergize"
            width={300}
            height={102}
            className="mx-auto"
            priority
          />
        </div>

        {/* Loading bar */}
        <div className="mt-8 w-64 h-1 bg-primary-light rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-accent-cyan via-highlight to-accent-pink rounded-full animate-loading-bar" />
        </div>

        {/* Loading text */}
        <p className="mt-4 text-muted text-small uppercase tracking-widest">
          Loading...
        </p>
      </div>
    </div>
  )
}
