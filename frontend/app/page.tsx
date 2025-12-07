import Link from 'next/link'
import { ServerIcon, TrophyIcon, ShieldIcon, ShoppingBagIcon } from '@/components/icons'

export default function HomePage() {
  return (
    <div className="bg-gradient-mesh">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-display mb-6">
              Welcome to{' '}
              <span className="gradient-text">Synergize</span>
            </h1>
            <p className="text-h4 text-muted mb-8 max-w-2xl mx-auto">
              The ultimate CS2 community platform. Browse servers, climb the leaderboards,
              and join the most competitive gaming community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/servers" className="btn-primary btn-lg">
                Browse Servers
              </Link>
              <Link href="/leaderboards" className="btn-secondary btn-lg">
                View Leaderboards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section bg-primary-light/30">
        <div className="container-custom">
          <h2 className="text-h2 text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<ServerIcon className="w-8 h-8" />}
              title="Server Browser"
              description="Find and connect to the best CS2 servers with real-time status updates."
              href="/servers"
              color="pink"
            />
            <FeatureCard
              icon={<TrophyIcon className="w-8 h-8" />}
              title="Leaderboards"
              description="Track your progress and compete with players across all servers."
              href="/leaderboards"
              color="cyan"
            />
            <FeatureCard
              icon={<ShieldIcon className="w-8 h-8" />}
              title="Ban List"
              description="Transparent ban records to maintain a fair gaming environment."
              href="/bans"
              color="green"
            />
            <FeatureCard
              icon={<ShoppingBagIcon className="w-8 h-8" />}
              title="Shop"
              description="Spend your credits on exclusive perks and customizations."
              href="/shop"
              color="yellow"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value="10+" label="Active Servers" />
            <StatCard value="5,000+" label="Players" />
            <StatCard value="100K+" label="Matches Played" />
            <StatCard value="24/7" label="Uptime" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-card">
        <div className="container-custom text-center">
          <h2 className="text-h2 mb-4">Ready to Join?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Log in with your Steam account to track your stats, earn credits,
            and unlock exclusive perks.
          </p>
          <Link href="/api/v1/auth/steam/init" className="btn-primary btn-lg">
            <SteamIcon className="w-5 h-5" />
            Login with Steam
          </Link>
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
  const colorClasses = {
    pink: 'text-accent-pink group-hover:shadow-neon-pink',
    cyan: 'text-accent-cyan group-hover:shadow-neon-cyan',
    green: 'text-accent-green group-hover:shadow-neon-green',
    yellow: 'text-highlight group-hover:shadow-neon-yellow',
  }

  return (
    <Link href={href} className="group">
      <div className="card-hover h-full">
        <div className={`mb-4 ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-h4 mb-2 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-muted text-small">
          {description}
        </p>
      </div>
    </Link>
  )
}

interface StatCardProps {
  value: string
  label: string
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="text-center p-6">
      <div className="text-h1 font-bold gradient-text mb-2">
        {value}
      </div>
      <div className="text-muted">
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
