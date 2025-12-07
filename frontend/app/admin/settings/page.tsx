'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { SettingsIcon, CheckIcon, WarningIcon } from '@/components/icons'

// Discord icon
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  )
}

// Steam icon
function SteamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.86 3.48 8.9 8.08 9.79l3.02-3.02c-.1-.02-.2-.03-.3-.03-2.76 0-5-2.24-5-5 0-2.46 1.78-4.5 4.12-4.92V5.56C7.73 6.1 4.5 9.72 4.5 14c0 4.14 3.36 7.5 7.5 7.5 3.93 0 7.16-3.03 7.47-6.88l1.88-1.88C21.78 11.73 22 10.89 22 10c0-4.42-4.48-8-10-8zM10 14c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
    </svg>
  )
}

const settingsConfig = [
  {
    key: 'discord_invite',
    label: 'Discord Invite Link',
    description: 'Full Discord invite URL (e.g., https://discord.gg/yourcode)',
    icon: DiscordIcon,
    placeholder: 'https://discord.gg/your-invite-code',
  },
  {
    key: 'steam_group_url',
    label: 'Steam Group URL',
    description: 'Full Steam group URL',
    icon: SteamIcon,
    placeholder: 'https://steamcommunity.com/groups/yourgroup',
  },
  {
    key: 'site_name',
    label: 'Site Name',
    description: 'Name displayed in the browser title and footer',
    icon: SettingsIcon,
    placeholder: 'Synergize',
  },
  {
    key: 'site_description',
    label: 'Site Description',
    description: 'Short description shown in the footer',
    icon: SettingsIcon,
    placeholder: 'The ultimate CS2 community platform',
  },
]

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isOwner = user?.roles?.includes('owner')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
    enabled: isOwner,
  })

  const saveMutation = useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      adminApi.updateSettingsBatch(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  // Initialize form data when settings load
  useEffect(() => {
    if (data?.data) {
      const initialData: Record<string, string> = {}
      data.data.forEach((setting) => {
        initialData[setting.key] = String(setting.value)
      })
      setFormData(initialData)
    }
  }, [data])

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleSave = () => {
    const settings = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
    }))
    saveMutation.mutate(settings)
  }

  const handleReset = () => {
    if (data?.data) {
      const initialData: Record<string, string> = {}
      data.data.forEach((setting) => {
        initialData[setting.key] = String(setting.value)
      })
      setFormData(initialData)
      setHasChanges(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card text-center max-w-md">
          <WarningIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-h2 mb-2">Access Denied</h1>
          <p className="text-muted">
            Only the site owner can access settings. Contact the owner if you need changes.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="card text-center max-w-md">
          <WarningIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-h2 mb-2">Error Loading Settings</h1>
          <p className="text-muted">
            Failed to load settings. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 mb-2">Site Settings</h1>
          <p className="text-muted">Configure site-wide settings and social links.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-2 text-accent-green text-small">
              <CheckIcon className="w-4 h-4" />
              Saved!
            </span>
          )}
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="btn-secondary"
                disabled={saveMutation.isPending}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-primary rounded w-1/4 mb-2" />
                <div className="h-10 bg-primary rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Social Links */}
          <div className="card">
            <h2 className="text-h3 mb-6 flex items-center gap-2">
              <DiscordIcon className="w-6 h-6 text-[#5865F2]" />
              Social Links
            </h2>
            <div className="space-y-6">
              {settingsConfig
                .filter((s) => s.key === 'discord_invite' || s.key === 'steam_group_url')
                .map((setting) => {
                  const Icon = setting.icon
                  return (
                    <div key={setting.key}>
                      <label className="flex items-center gap-2 text-small font-medium mb-2">
                        <Icon className="w-4 h-4 text-muted" />
                        {setting.label}
                      </label>
                      <input
                        type="url"
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        placeholder={setting.placeholder}
                        className="input"
                      />
                      <p className="text-tiny text-muted mt-1">{setting.description}</p>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Site Info */}
          <div className="card">
            <h2 className="text-h3 mb-6 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-accent-pink" />
              Site Information
            </h2>
            <div className="space-y-6">
              {settingsConfig
                .filter((s) => s.key === 'site_name' || s.key === 'site_description')
                .map((setting) => {
                  const Icon = setting.icon
                  return (
                    <div key={setting.key}>
                      <label className="flex items-center gap-2 text-small font-medium mb-2">
                        <Icon className="w-4 h-4 text-muted" />
                        {setting.label}
                      </label>
                      {setting.key === 'site_description' ? (
                        <textarea
                          value={formData[setting.key] || ''}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          placeholder={setting.placeholder}
                          className="input min-h-[80px]"
                          rows={2}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[setting.key] || ''}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          placeholder={setting.placeholder}
                          className="input"
                        />
                      )}
                      <p className="text-tiny text-muted mt-1">{setting.description}</p>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Info Box */}
          <div className="card bg-accent-cyan/10 border-accent-cyan/30">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-accent-cyan" />
              </div>
              <div>
                <h3 className="font-medium mb-1">How Settings Work</h3>
                <p className="text-small text-muted">
                  Changes are saved to the database and cached for performance. The frontend
                  fetches these settings on load, so changes will be visible after a page refresh.
                  Social links will update across the navigation, footer, and support page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
