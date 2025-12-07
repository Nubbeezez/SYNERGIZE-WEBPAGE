'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopApi, type ShopItem } from '@/lib/api'
import { ShoppingBagIcon, CreditIcon, CheckIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'

const categories = [
  { value: '', label: 'All Items' },
  { value: 'perk', label: 'Perks' },
  { value: 'skin', label: 'Skins' },
  { value: 'role', label: 'Roles' },
  { value: 'other', label: 'Other' },
]

export default function ShopPage() {
  const [category, setCategory] = useState('')
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop', { type: category }],
    queryFn: () => shopApi.list({
      type: category || undefined,
      available: true,
    }),
  })

  const purchaseMutation = useMutation({
    mutationFn: (itemId: number) => shopApi.purchase(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['shop'] })
    },
  })

  const handlePurchase = async (itemId: number) => {
    if (!isAuthenticated) {
      alert('Please login to purchase items')
      return
    }

    setPurchasingId(itemId)
    try {
      await purchaseMutation.mutateAsync(itemId)
      alert('Purchase successful!')
    } catch (err) {
      alert('Purchase failed. Please try again.')
    } finally {
      setPurchasingId(null)
    }
  }

  const items = data?.data || []

  return (
    <div className="section">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBagIcon className="w-8 h-8 text-highlight" />
              <h1 className="text-h1">Shop</h1>
            </div>
            <p className="text-muted">
              Spend your credits on exclusive perks and customizations.
            </p>
          </div>

          {/* Balance */}
          {isAuthenticated && user && (
            <div className="mt-4 md:mt-0">
              <div className="card bg-gradient-card inline-flex items-center gap-3 px-6 py-3">
                <CreditIcon className="w-6 h-6 text-highlight" />
                <div>
                  <p className="text-tiny text-muted">Your Balance</p>
                  <p className="text-h3 text-highlight">{user.credits?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-small font-medium transition-all ${
                category === cat.value
                  ? 'bg-accent-pink text-white'
                  : 'bg-primary text-muted hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-32 bg-primary rounded mb-4" />
                <div className="h-6 bg-primary rounded w-3/4 mb-2" />
                <div className="h-4 bg-primary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-error mb-4">Failed to load shop items</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12">
            <ShoppingBagIcon className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted mb-2">No items available</p>
            <p className="text-small text-muted">Check back later for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                onPurchase={handlePurchase}
                isPurchasing={purchasingId === item.id}
                canAfford={user?.credits ? user.credits >= item.price : false}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 card bg-primary-light/30">
          <h3 className="text-h4 mb-4">How to earn credits</h3>
          <ul className="space-y-2 text-muted">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-accent-green" />
              Play on our servers and earn points
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-accent-green" />
              Complete daily challenges
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-accent-green" />
              Win matches and tournaments
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-accent-green" />
              Participate in community events
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

interface ShopItemCardProps {
  item: ShopItem
  onPurchase: (id: number) => void
  isPurchasing: boolean
  canAfford: boolean
  isAuthenticated: boolean
}

function ShopItemCard({ item, onPurchase, isPurchasing, canAfford, isAuthenticated }: ShopItemCardProps) {
  const typeColors = {
    perk: 'bg-accent-pink/20 text-accent-pink',
    skin: 'bg-accent-cyan/20 text-accent-cyan',
    role: 'bg-accent-green/20 text-accent-green',
    other: 'bg-highlight/20 text-highlight',
  }

  const typeIcons = {
    perk: '⚡',
    skin: '🎨',
    role: '👑',
    other: '📦',
  }

  return (
    <div className="card-hover flex flex-col h-full">
      {/* Icon/Preview */}
      <div className="h-32 bg-gradient-card rounded-lg mb-4 flex items-center justify-center">
        <span className="text-5xl">{typeIcons[item.type] || '📦'}</span>
      </div>

      {/* Type badge */}
      <span className={`self-start px-2 py-1 rounded text-tiny font-medium mb-2 ${typeColors[item.type]}`}>
        {item.type.toUpperCase()}
      </span>

      {/* Name */}
      <h3 className="text-h4 mb-2">{item.name}</h3>

      {/* Description */}
      <p className="text-small text-muted mb-4 flex-1">{item.description}</p>

      {/* Price & Action */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary">
        <div className="flex items-center gap-2">
          <CreditIcon className="w-5 h-5 text-highlight" />
          <span className="text-h4 text-highlight">{item.price.toLocaleString()}</span>
        </div>
        <button
          onClick={() => onPurchase(item.id)}
          disabled={isPurchasing || !item.available || (!canAfford && isAuthenticated)}
          className={`btn-primary text-small ${
            !item.available ? 'opacity-50 cursor-not-allowed' :
            !isAuthenticated ? '' :
            !canAfford ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isPurchasing ? 'Purchasing...' :
           !item.available ? 'Unavailable' :
           !isAuthenticated ? 'Login to Buy' :
           !canAfford ? 'Not Enough' : 'Purchase'}
        </button>
      </div>
    </div>
  )
}
