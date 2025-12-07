import { BookOpenIcon, ShieldIcon, ChatIcon, WarningIcon } from '@/components/icons'

export default function RulesPage() {
  return (
    <div className="section">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpenIcon className="w-10 h-10 text-accent-pink" />
            <h1 className="text-h1">Server Rules</h1>
          </div>
          <p className="text-muted max-w-2xl mx-auto">
            Please read and follow these rules to ensure a fair and enjoyable gaming experience for everyone.
            Violations may result in warnings, kicks, or bans.
          </p>
        </div>

        {/* Rules Sections */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* General Rules */}
          <RuleSection
            icon={<ShieldIcon className="w-6 h-6" />}
            title="General Rules"
            color="pink"
            rules={[
              {
                title: 'Respect All Players',
                description: 'Treat everyone with respect. Harassment, discrimination, and toxic behavior will not be tolerated.',
              },
              {
                title: 'No Cheating or Exploits',
                description: 'Using any form of cheats, hacks, or exploits is strictly prohibited. This includes aimbots, wallhacks, speed hacks, and any other third-party software that provides an unfair advantage.',
              },
              {
                title: 'No Smurfing',
                description: 'Creating alternate accounts to play against lower-skilled players is not allowed. Play on your main account.',
              },
              {
                title: 'English in Global Chat',
                description: 'Please use English in global chat so everyone can understand. Team chat can be in any language.',
              },
              {
                title: 'Follow Admin Instructions',
                description: 'Listen to and follow instructions from server administrators. Arguing with admins in-game will result in a mute or kick.',
              },
            ]}
          />

          {/* Communication Rules */}
          <RuleSection
            icon={<ChatIcon className="w-6 h-6" />}
            title="Communication Rules"
            color="cyan"
            rules={[
              {
                title: 'No Spam',
                description: 'Do not spam chat or voice. This includes repeated messages, excessive use of binds, or playing music/sounds through your microphone.',
              },
              {
                title: 'No Offensive Content',
                description: 'Do not use racist, sexist, homophobic, or otherwise offensive language or imagery. This includes profile pictures and usernames.',
              },
              {
                title: 'No Advertising',
                description: 'Do not advertise other servers, websites, or services without permission from staff.',
              },
              {
                title: 'Keep It Clean',
                description: 'Avoid excessive profanity and keep conversations civil. This is a community for all ages.',
              },
            ]}
          />

          {/* Gameplay Rules */}
          <RuleSection
            icon={<WarningIcon className="w-6 h-6" />}
            title="Gameplay Rules"
            color="green"
            rules={[
              {
                title: 'No Team Killing',
                description: 'Intentionally killing teammates is prohibited. Accidental team kills happen, but repeated offenses will be punished.',
              },
              {
                title: 'No Griefing',
                description: 'Do not intentionally sabotage your team. This includes blocking teammates, throwing the game, or giving away positions.',
              },
              {
                title: 'No AFK Farming',
                description: 'Do not go AFK to farm credits or stats. AFK players will be kicked to make room for active players.',
              },
              {
                title: 'Play the Objective',
                description: 'While having fun is important, please make an effort to play the game mode correctly. Do not purposely ignore objectives.',
              },
              {
                title: 'Fair Play',
                description: 'Do not exploit map glitches, spawn points, or game mechanics. Report any bugs you find to the staff.',
              },
            ]}
          />

          {/* Punishments */}
          <div className="card bg-gradient-card">
            <h2 className="text-h3 mb-6 text-center">Punishment Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-warning text-h4">1</span>
                </div>
                <h4 className="text-h4 mb-2">Warning</h4>
                <p className="text-small text-muted">
                  First offense for minor violations. A verbal or written warning.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-pink/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-accent-pink text-h4">2</span>
                </div>
                <h4 className="text-h4 mb-2">Temporary Ban</h4>
                <p className="text-small text-muted">
                  Repeated minor offenses or serious violations. Duration varies based on severity.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-error text-h4">3</span>
                </div>
                <h4 className="text-h4 mb-2">Permanent Ban</h4>
                <p className="text-small text-muted">
                  Cheating, severe toxicity, or repeated serious offenses. No appeals for cheating bans.
                </p>
              </div>
            </div>
          </div>

          {/* Appeal Info */}
          <div className="card text-center">
            <h3 className="text-h4 mb-4">Ban Appeals</h3>
            <p className="text-muted mb-4">
              If you believe you were unfairly banned, you can submit an appeal through our Discord server.
              Please include your Steam ID and a detailed explanation.
            </p>
            <p className="text-small text-muted">
              Note: Cheating bans are not eligible for appeal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RuleSectionProps {
  icon: React.ReactNode
  title: string
  color: 'pink' | 'cyan' | 'green'
  rules: { title: string; description: string }[]
}

function RuleSection({ icon, title, color, rules }: RuleSectionProps) {
  const colorClasses = {
    pink: 'text-accent-pink border-accent-pink/30',
    cyan: 'text-accent-cyan border-accent-cyan/30',
    green: 'text-accent-green border-accent-green/30',
  }

  return (
    <div className={`card border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-6">
        <span className={colorClasses[color].split(' ')[0]}>{icon}</span>
        <h2 className="text-h3">{title}</h2>
      </div>
      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={index} className="flex gap-4">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-tiny ${colorClasses[color].split(' ')[0]}`}>
              {index + 1}
            </span>
            <div>
              <h4 className="font-medium mb-1">{rule.title}</h4>
              <p className="text-small text-muted">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
