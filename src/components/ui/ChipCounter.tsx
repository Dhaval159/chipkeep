interface ChipCounterProps {
  value: number
  label?: string
  animate?: boolean
}

export function ChipCounter({ value, label, animate = false }: ChipCounterProps) {
  return (
    <span className="ck-chip-counter">
      <span className={`ck-chip-counter__value${animate ? ' ck-chip-counter__value--animate' : ''}`}>
        {value.toLocaleString()}
      </span>
      {label && <span className="ck-chip-counter__label">{label}</span>}
    </span>
  )
}
