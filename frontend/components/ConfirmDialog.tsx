'use client'

import { useEffect, useRef } from 'react'
import { XMarkIcon } from './icons'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      button: 'bg-error hover:bg-error/80 text-white',
      icon: 'text-error',
    },
    warning: {
      button: 'bg-warning hover:bg-warning/80 text-black',
      icon: 'text-warning',
    },
    info: {
      button: 'btn-primary',
      icon: 'text-accent-cyan',
    },
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel()
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="card max-w-md w-full animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="confirm-dialog-title" className="text-h3">
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-primary rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p id="confirm-dialog-message" className="text-muted mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${variantStyles[variant].button}`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
import { useState, useCallback } from 'react'

export interface UseConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<UseConfirmDialogOptions>({
    title: 'Confirm',
    message: 'Are you sure?',
  })
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: UseConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)
    setIsLoading(false)

    return new Promise((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef(true)
      setResolveRef(null)
    }
    setIsOpen(false)
  }, [resolveRef])

  const handleCancel = useCallback(() => {
    if (resolveRef) {
      resolveRef(false)
      setResolveRef(null)
    }
    setIsOpen(false)
  }, [resolveRef])

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const DialogComponent = useCallback(
    () => (
      <ConfirmDialog
        isOpen={isOpen}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...options}
      />
    ),
    [isOpen, isLoading, options, handleConfirm, handleCancel]
  )

  return {
    confirm,
    setLoading,
    ConfirmDialog: DialogComponent,
  }
}
