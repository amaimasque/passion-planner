import React, { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  error?: string;
}

export default function Input({ label, leftIcon, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full pr-4 py-3 text-sm',
            leftIcon ? 'pl-10' : 'pl-4',
            'bg-app-surface border rounded-xl text-ink',
            'placeholder:text-ink-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary',
            'transition-all duration-200',
            error ? 'border-danger' : 'border-app-border',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
