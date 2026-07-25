interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className="ck-toggle" aria-disabled={disabled}>
      <div
        className={`ck-toggle__track ${checked ? 'ck-toggle__track--checked' : ''}`}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) onChange(!checked)
          }
        }}
        onClick={() => {
          if (!disabled) onChange(!checked)
        }}
      >
        <div className="ck-toggle__thumb" />
      </div>
      {label && <span className="ck-toggle__label">{label}</span>}
    </label>
  )
}
