import Link from 'next/link'
import { SteamIcon, DiscordIcon } from './icons'

export function Footer() {
  return (
    <footer className="bg-primary-light/50 border-t border-white/5">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-h4 font-bold">Synergize</span>
            </Link>
            <p className="text-muted text-small mb-4">
              The ultimate CS2 community platform for competitive gaming.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted hover:text-accent-cyan transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SteamIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-small font-semibold uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/servers" className="text-muted hover:text-white transition-colors text-small">
                  Servers
                </Link>
              </li>
              <li>
                <Link href="/leaderboards" className="text-muted hover:text-white transition-colors text-small">
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link href="/bans" className="text-muted hover:text-white transition-colors text-small">
                  Ban List
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-muted hover:text-white transition-colors text-small">
                  Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-small font-semibold uppercase tracking-wider mb-4">
              Community
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/rules" className="text-muted hover:text-white transition-colors text-small">
                  Rules
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted hover:text-white transition-colors text-small">
                  Support
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted hover:text-white transition-colors text-small">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="text-muted hover:text-white transition-colors text-small">
                  Steam Group
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-small font-semibold uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-muted hover:text-white transition-colors text-small">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted hover:text-white transition-colors text-small">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted hover:text-white transition-colors text-small">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-small">
            &copy; {new Date().getFullYear()} Synergize. All rights reserved.
          </p>
          <p className="text-muted text-tiny">
            Not affiliated with Valve Corporation.
          </p>
        </div>
      </div>
    </footer>
  )
}
