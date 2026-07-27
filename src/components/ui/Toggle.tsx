interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`ck-toggle${disabled ? '' : ''}`}>
      <div
        className={`ck-toggle__track${checked ? ' ck-toggle__track--checked' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div className="ck-toggle__thumb" />
      </div>
      {label && <span className="ck-toggle__label">{label}</span>}
    </label>
  )
}
