import { useEffect, useRef, useState } from 'react'

interface ChipCounterProps {
  value: number
  label?: string
}

export function ChipCounter({ value, label }: ChipCounterProps) {
  const [animate, setAnimate] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimate(true)
      prevValue.current = value
      const timer = setTimeout(() => setAnimate(false), 200)
      return () => clearTimeout(timer)
    }
  }, [value])

  return (
    <span className="ck-chip-counter">
      <span
        className={`ck-chip-counter__value ${animate ? 'ck-chip-counter__value--animate' : ''}`}
      >
        {value.toLocaleString()}
      </span>
      {label && <span className="ck-chip-counter__label">{label}</span>}
    </span>
  )
}
