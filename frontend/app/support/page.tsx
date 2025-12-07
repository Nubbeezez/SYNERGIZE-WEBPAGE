'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { settingsApi, SiteSettings } from '@/lib/api'
import {
  ChatIcon,
  ChevronDownIcon,
  BookOpenIcon,
  ShieldIcon,
  CreditIcon,
  ServerIcon,
  UserIcon,
  WarningIcon,
} from '@/components/icons'

// Discord icon component
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  )
}

// FAQ data
const faqCategories = [
  {
    name: 'General',
    icon: BookOpenIcon,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Simply click the "Login with Steam" button in the navigation bar. Your account will be automatically created using your Steam profile information.',
      },
      {
        q: 'Is Synergize free to use?',
        a: 'Yes! Synergize is completely free to use. You can browse servers, view leaderboards, and participate in the community at no cost. Optional premium features and shop items are available for purchase.',
      },
      {
        q: 'How do I join a server?',
        a: 'Go to the Servers page, find a server you want to join, and click the "Connect" button. This will launch CS2 and connect you directly to the server.',
      },
    ],
  },
  {
    name: 'Credits & Shop',
    icon: CreditIcon,
    questions: [
      {
        q: 'How do I earn credits?',
        a: 'You can earn credits by playing on our servers, participating in events, and climbing the leaderboards. Credits are awarded based on your activity and achievements.',
      },
      {
        q: 'What can I buy with credits?',
        a: 'Credits can be used to purchase VIP status, custom tags, reserved slots, and other cosmetic items in our shop. Check the Shop page for all available items.',
      },
      {
        q: 'Can I transfer credits to another player?',
        a: 'Currently, credit transfers between players are not supported. This is to prevent abuse and maintain a fair economy.',
      },
      {
        q: 'I purchased something but didn\'t receive it?',
        a: 'Purchases are usually instant. If you haven\'t received your item, try reconnecting to the server. If the issue persists, create a ticket on our Discord.',
      },
    ],
  },
  {
    name: 'Servers & Gameplay',
    icon: ServerIcon,
    questions: [
      {
        q: 'Why can\'t I connect to a server?',
        a: 'Make sure you have CS2 installed and running. Check if the server is online on our Servers page. If the server shows as online but you still can\'t connect, the server may be full or you may be banned.',
      },
      {
        q: 'How do leaderboards work?',
        a: 'Leaderboards track your performance across our servers. Stats like kills, deaths, playtime, and wins are recorded and ranked. Different game modes may have separate leaderboards.',
      },
      {
        q: 'My stats aren\'t updating?',
        a: 'Stats are updated periodically, usually within a few minutes of playing. If your stats haven\'t updated after 30 minutes, please report the issue on Discord.',
      },
    ],
  },
  {
    name: 'Bans & Appeals',
    icon: ShieldIcon,
    questions: [
      {
        q: 'Why was I banned?',
        a: 'Bans are issued for rule violations such as cheating, toxic behavior, or exploiting. Check the Bans page to see your ban reason. You can appeal by creating a ticket on Discord.',
      },
      {
        q: 'How do I appeal a ban?',
        a: 'Join our Discord server and create a ticket in the #support channel. Provide your Steam ID, the ban reason, and why you believe the ban should be lifted. Appeals are reviewed by our staff.',
      },
      {
        q: 'How long do bans last?',
        a: 'Ban duration depends on the severity of the violation. Minor offenses may result in temporary bans (hours to days), while serious violations like cheating result in permanent bans.',
      },
      {
        q: 'Can I check if I\'m banned?',
        a: 'Yes! Use the ban checker on our Bans page. Enter your Steam ID to see if you have any active bans and their details.',
      },
    ],
  },
  {
    name: 'Account & Profile',
    icon: UserIcon,
    questions: [
      {
        q: 'How do I change my username?',
        a: 'Your username is pulled from your Steam profile. To change it, update your Steam profile name and it will sync automatically on your next login.',
      },
      {
        q: 'Can I link multiple Steam accounts?',
        a: 'No, each Synergize account is tied to a single Steam account. This is to prevent abuse and ensure fair gameplay.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To request account deletion, please create a ticket on our Discord. Note that this will permanently delete all your data, credits, and purchases.',
      },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-primary last:border-0">
      <button
        className="w-full py-4 flex items-center justify-between text-left hover:text-accent-pink transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDownIcon
          className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-muted animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState('General')
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    settingsApi.getPublic()
      .then((res) => setSettings(res.data))
      .catch(() => {})
  }, [])

  const discordInvite = settings?.discord_invite || '#'

  return (
    <div className="container-custom py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-h1 mb-4">Support Center</h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Need help? Check our FAQ below or join our Discord for direct support from our team.
        </p>
      </div>

      {/* Discord CTA */}
      <div className="card bg-gradient-to-r from-[#5865F2]/20 to-accent-pink/20 border-[#5865F2]/30 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-6 p-2">
          <div className="w-20 h-20 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
            <DiscordIcon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-h3 mb-2">Join Our Discord</h2>
            <p className="text-muted mb-4">
              Get instant support, chat with the community, and stay updated on announcements.
              Our staff team is active and ready to help!
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-small text-muted">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                Staff available daily
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-cyan"></span>
                Ticket system for private issues
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-pink"></span>
                Community events & giveaways
              </span>
            </div>
          </div>
          <a
            href={discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-[#5865F2] hover:bg-[#4752C4] flex items-center gap-2 flex-shrink-0"
          >
            <DiscordIcon className="w-5 h-5" />
            Join Discord
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link href="/rules" className="card hover:border-accent-pink/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-pink/20 flex items-center justify-center group-hover:bg-accent-pink/30 transition-colors">
              <BookOpenIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-accent-pink transition-colors">Server Rules</h3>
              <p className="text-small text-muted">Read our community guidelines</p>
            </div>
          </div>
        </Link>

        <Link href="/bans" className="card hover:border-accent-cyan/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-cyan/20 flex items-center justify-center group-hover:bg-accent-cyan/30 transition-colors">
              <ShieldIcon className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-accent-cyan transition-colors">Ban Checker</h3>
              <p className="text-small text-muted">Check your ban status</p>
            </div>
          </div>
        </Link>

        <Link href="/servers" className="card hover:border-highlight/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-highlight/20 flex items-center justify-center group-hover:bg-highlight/30 transition-colors">
              <ServerIcon className="w-6 h-6 text-highlight" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-highlight transition-colors">Server Status</h3>
              <p className="text-small text-muted">Check if servers are online</p>
            </div>
          </div>
        </Link>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-h2 mb-6 text-center">Frequently Asked Questions</h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {faqCategories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeCategory === category.name
                    ? 'bg-accent-pink text-white'
                    : 'bg-primary hover:bg-primary-light text-muted hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* FAQ Items */}
        <div className="card max-w-3xl mx-auto">
          {faqCategories
            .find((c) => c.name === activeCategory)
            ?.questions.map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="text-center">
        <div className="card inline-block">
          <WarningIcon className="w-12 h-12 text-highlight mx-auto mb-4" />
          <h3 className="text-h4 mb-2">Still need help?</h3>
          <p className="text-muted mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href={discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <DiscordIcon className="w-5 h-5" />
            Create a Ticket on Discord
          </a>
        </div>
      </div>
    </div>
  )
}
