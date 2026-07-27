import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string
  wrapperClassName?: string
}

export function TextField({
  label,
  error,
  hint,
  wrapperClassName = '',
  className = '',
  ...rest
}: TextFieldProps) {
  return (
    <div className={`ck-text-field ${wrapperClassName}`}>
      <label className="ck-text-field__label" htmlFor={rest.id ?? rest.name}>
        {label}
      </label>
      <input
        className={`ck-text-field__input${error ? ' ck-text-field__input--error' : ''} ${className}`}
        id={rest.id ?? rest.name}
        {...rest}
      />
      {error && <span className="ck-text-field__error">{error}</span>}
      {hint && !error && <span className="ck-text-field__hint">{hint}</span>}
    </div>
  )
}
