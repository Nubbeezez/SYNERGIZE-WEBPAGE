'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ServerIcon, TrophyIcon, ShieldIcon, ShoppingBagIcon } from '@/components/icons'
import { ScrollReveal } from '@/components/ScrollReveal'
import { useEffect, useState, useRef } from 'react'

export default function HomePage() {
  return (
    <div className="bg-gradient-mesh bg-grid-pattern">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollReveal>
              <h1 className="text-display font-heading mb-6 tracking-tight flex items-center justify-center gap-6 flex-wrap">
                <span>Welcome to</span>
                <Image
                  src="/logo.png"
                  alt="Synergize"
                  width={400}
                  height={136}
                  priority
                />
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                The ultimate CS2 community platform. Browse servers, climb the leaderboards,
                and join the most competitive gaming community.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/servers" className="btn-primary btn-lg btn-glow group">
                  Browse Servers
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/leaderboards" className="btn-secondary btn-lg">
                  View Leaderboards
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="text-h2 font-heading text-center mb-12 tracking-tight">
              Everything You Need
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={0}>
              <FeatureCard
                icon={<ServerIcon className="w-8 h-8" />}
                title="Server Browser"
                description="Find and connect to the best CS2 servers with real-time status updates."
                href="/servers"
                color="pink"
              />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <FeatureCard
                icon={<TrophyIcon className="w-8 h-8" />}
                title="Leaderboards"
                description="Track your progress and compete with players across all servers."
                href="/leaderboards"
                color="cyan"
              />
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <FeatureCard
                icon={<ShieldIcon className="w-8 h-8" />}
                title="Ban List"
                description="Transparent ban records to maintain a fair gaming environment."
                href="/bans"
                color="green"
              />
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <FeatureCard
                icon={<ShoppingBagIcon className="w-8 h-8" />}
                title="Shop"
                description="Spend your credits on exclusive perks and customizations."
                href="/shop"
                color="yellow"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScrollReveal delay={0}>
              <AnimatedStatCard value={10} suffix="+" label="Active Servers" />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <AnimatedStatCard value={5000} suffix="+" label="Players" />
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <AnimatedStatCard value={100} suffix="K+" label="Matches Played" />
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <StatCard value="24/7" label="Uptime" />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-custom">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
            <ScrollReveal>
              <Image
                src="/logo.png"
                alt="Synergize"
                width={200}
                height={68}
                className="mx-auto mb-6"
              />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h2 className="text-h2 font-heading mb-4 tracking-tight">Ready to Join?</h2>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Log in with your Steam account to track your stats, earn credits,
                and unlock exclusive perks.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <Link href="/api/v1/auth/steam/init" className="btn-primary btn-lg btn-glow group">
                <SteamIcon className="w-5 h-5" />
                Login with Steam
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: 'pink' | 'cyan' | 'green' | 'yellow'
}

function FeatureCard({ icon, title, description, href, color }: FeatureCardProps) {
  const colorConfig = {
    pink: {
      icon: 'text-accent-pink',
      border: 'border-l-accent-pink',
      glow: 'hover:shadow-neon-pink',
      iconBg: 'bg-accent-pink/10',
    },
    cyan: {
      icon: 'text-accent-cyan',
      border: 'border-l-accent-cyan',
      glow: 'hover:shadow-neon-cyan',
      iconBg: 'bg-accent-cyan/10',
    },
    green: {
      icon: 'text-accent-green',
      border: 'border-l-accent-green',
      glow: 'hover:shadow-neon-green',
      iconBg: 'bg-accent-green/10',
    },
    yellow: {
      icon: 'text-highlight',
      border: 'border-l-highlight',
      glow: 'hover:shadow-neon-yellow',
      iconBg: 'bg-highlight/10',
    },
  }

  const config = colorConfig[color]

  return (
    <Link href={href} className="group block h-full">
      <div className={`h-full rounded-lg glass-card p-5 border-l-4 ${config.border} transition-all duration-300 hover:-translate-y-2 ${config.glow}`}>
        <div className={`mb-4 w-12 h-12 rounded-lg ${config.iconBg} flex items-center justify-center ${config.icon} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-h4 font-heading mb-2 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-small">
          {description}
        </p>
      </div>
    </Link>
  )
}

interface AnimatedStatCardProps {
  value: number
  suffix?: string
  label: string
}

function AnimatedStatCard({ value, suffix = '', label }: AnimatedStatCardProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          // Animate the count
          const duration = 1500
          const steps = 60
          const stepValue = value / steps
          let current = 0

          const timer = setInterval(() => {
            current += stepValue
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)

          return () => clearInterval(timer)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value, hasAnimated])

  return (
    <div ref={ref} className="text-center p-6">
      <div className="text-5xl font-heading font-bold gradient-text mb-2 tracking-tight">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 uppercase tracking-wider text-small">
        {label}
      </div>
    </div>
  )
}

interface StatCardProps {
  value: string
  label: string
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="text-center p-6">
      <div className="text-5xl font-heading font-bold gradient-text mb-2 tracking-tight">
        {value}
      </div>
      <div className="text-gray-400 uppercase tracking-wider text-small">
        {label}
      </div>
    </div>
  )
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z"/>
    </svg>
  )
}
