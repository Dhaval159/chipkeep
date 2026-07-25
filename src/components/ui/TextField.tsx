import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  error?: string | null
  wrapperClassName?: string
}

export function TextField({ label, error, id, wrapperClassName, ...rest }: TextFieldProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`ck-text-field ${wrapperClassName ?? ''}`.trim()}>
      {label && (
        <label className="ck-text-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="ck-text-field__input"
        {...rest}
      />
      {error && <span className="ck-text-field__error">{error}</span>}
    </div>
  )
}
