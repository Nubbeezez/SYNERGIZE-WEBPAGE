'use client'

import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses = {
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-error/20 text-error border-error/30',
  info: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
  outline: 'bg-transparent text-muted border-white/20',
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-tiny',
  md: 'px-2 py-1 text-small',
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
