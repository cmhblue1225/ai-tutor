import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body font-medium text-text-primary mb-s">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'input',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-xs text-caption text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-xs text-caption text-text-tertiary">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input