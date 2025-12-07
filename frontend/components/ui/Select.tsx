'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDownIcon } from '../icons'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-small font-medium text-white mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-4 py-2 pr-10 bg-primary border rounded-lg appearance-none
              text-white
              focus:outline-none focus:ring-2 focus:ring-accent-pink/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error focus:ring-error/50' : 'border-white/10'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-tiny text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-tiny text-muted">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
