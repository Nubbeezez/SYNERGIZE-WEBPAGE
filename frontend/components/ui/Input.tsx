'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-small font-medium text-white mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2 bg-primary border rounded-lg
            text-white placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-accent-pink/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error/50' : 'border-white/10'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-tiny text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-tiny text-muted">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
