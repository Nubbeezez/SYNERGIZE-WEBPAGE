'use client'

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const variantClasses = {
  primary: 'bg-accent-pink hover:bg-accent-pink/80 text-white',
  secondary: 'bg-primary-light hover:bg-primary border border-white/10 text-white',
  outline: 'bg-transparent border border-accent-pink text-accent-pink hover:bg-accent-pink/10',
  ghost: 'bg-transparent hover:bg-white/5 text-white',
  danger: 'bg-error hover:bg-error/80 text-white',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-small',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-body',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="w-4 h-4">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="w-4 h-4">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
