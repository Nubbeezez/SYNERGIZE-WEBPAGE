'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type ShopItem } from '@/lib/api'
import { useAuth, isOwner as checkIsOwner } from '@/lib/auth'
import {
  ShoppingBagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CreditIcon,
} from '@/components/icons'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const ITEM_TYPES = [
  { value: 'vip', label: 'VIP' },
  { value: 'perk', label: 'Perk' },
  { value: 'skin', label: 'Skin' },
  { value: 'role', label: 'Role' },
  { value: 'other', label: 'Other' },
]

export default function AdminShopPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<ShopItem | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const userIsOwner = checkIsOwner(user)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop', typeFilter],
    queryFn: () => adminApi.getShopItems({
      type: typeFilter || undefined,
    }),
  })

  const items = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteShopItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop'] })
      setDeletingItem(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleShopItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 mb-2">Shop Items</h1>
          <p className="text-muted">
            {userIsOwner ? 'Manage VIP and other shop items.' : 'View shop items (read-only).'}
          </p>
        </div>
        {userIsOwner && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-48"
        >
          <option value="">All Types</option>
          {ITEM_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-primary rounded w-2/3 mb-4" />
              <div className="h-4 bg-primary rounded w-full mb-2" />
              <div className="h-4 bg-primary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-h3 mb-2">No Shop Items</h2>
          <p className="text-muted mb-4">
            {userIsOwner ? "You haven't added any shop items yet." : 'No shop items available.'}
          </p>
          {userIsOwner && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`card ${!item.available ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'vip'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-accent-pink/20 text-accent-pink'
                    }`}
                  >
                    {item.type === 'vip' ? (
                      <span className="text-lg font-bold">V</span>
                    ) : (
                      <ShoppingBagIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-tiny text-muted uppercase">{item.type}</span>
                  </div>
                </div>
                {userIsOwner && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 hover:bg-primary rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4 text-muted" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-2 hover:bg-error/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4 text-error" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-small text-muted mb-4 line-clamp-2">{item.description}</p>

              <div className="space-y-2 text-small">
                <div className="flex justify-between">
                  <span className="text-muted">Price</span>
                  <span className="flex items-center gap-1 text-highlight font-semibold">
                    <CreditIcon className="w-4 h-4" />
                    {item.price.toLocaleString()}
                  </span>
                </div>
                {item.metadata?.duration_days && (
                  <div className="flex justify-between">
                    <span className="text-muted">Duration</span>
                    <span>{item.metadata.duration_days} days</span>
                  </div>
                )}
                {item.stock !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted">Stock</span>
                    <span className={item.stock === 0 ? 'text-error' : ''}>
                      {item.stock === 0 ? 'Out of stock' : item.stock}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted">Status</span>
                  {userIsOwner ? (
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      disabled={toggleMutation.isPending}
                      className={`px-2 py-1 rounded text-tiny font-medium transition-colors ${
                        item.available
                          ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
                          : 'bg-error/20 text-error hover:bg-error/30'
                      }`}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </button>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-tiny font-medium ${
                        item.available
                          ? 'bg-accent-green/20 text-accent-green'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {userIsOwner && (showAddModal || editingItem) && (
        <ShopItemFormModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-shop'] })
            setShowAddModal(false)
            setEditingItem(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userIsOwner && (
        <ConfirmDialog
          isOpen={!!deletingItem}
          title="Delete Shop Item"
          message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  )
}

function ShopItemFormModal({
  item,
  onClose,
  onSuccess,
}: {
  item: ShopItem | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = !!item
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 1000,
    type: item?.type || 'vip',
    available: item?.available ?? true,
    stock: item?.stock ?? null,
    duration_days: item?.metadata?.duration_days ?? 30,
    hasStock: item?.stock !== null,
    hasDuration: item?.type === 'vip' || (item?.metadata?.duration_days !== undefined),
  })
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createShopItem>[0]) =>
      adminApi.createShopItem(data),
    onSuccess,
    onError: (err: unknown) => {
      const error = err as { message?: string }
      setError(error.message || 'Failed to create item')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Parameters<typeof adminApi.updateShopItem>[1] }) =>
      adminApi.updateShopItem(data.id, data.updates),
    onSuccess,
    onError: (err: unknown) => {
      const error = err as { message?: string }
      setError(error.message || 'Failed to update item')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      type: formData.type,
      available: formData.available,
      stock: formData.hasStock ? formData.stock : null,
      duration_days: formData.hasDuration ? formData.duration_days : null,
    }

    if (isEditing && item) {
      updateMutation.mutate({ id: item.id, updates: data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h3">{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-primary rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-small font-medium mb-1">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="VIP 30 Days"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-small font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Get VIP perks including reserved slots, custom tags, and more!"
              className="input min-h-[80px]"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
                className="input"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small font-medium mb-1">Price (Credits)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                placeholder="1000"
                className="input"
                min={0}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 bg-primary rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasDuration}
                onChange={(e) => setFormData((f) => ({ ...f, hasDuration: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-small font-medium">Time-limited item</span>
            </label>
            {formData.hasDuration && (
              <div>
                <label className="block text-tiny text-muted mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={formData.duration_days || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, duration_days: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                  className="input"
                  min={1}
                />
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="p-4 bg-primary rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasStock}
                onChange={(e) => setFormData((f) => ({ ...f, hasStock: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-small font-medium">Limited stock</span>
            </label>
            {formData.hasStock && (
              <div>
                <label className="block text-tiny text-muted mb-1">Stock quantity</label>
                <input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  className="input"
                  min={0}
                />
              </div>
            )}
          </div>

          {/* Availability */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={(e) => setFormData((f) => ({ ...f, available: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-small font-medium">Available for purchase</span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-error/20 text-error text-small">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
