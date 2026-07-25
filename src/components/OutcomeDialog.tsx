import type { Player } from '../types/game'
import { Button } from './ui/Button'

interface OutcomeDialogProps {
  title: string
  message?: string
  cost?: number
  options: Player[]
  optionLabel: (player: Player) => string
  onSelect: (playerId: string) => void
  onCancel: () => void
}

export function OutcomeDialog({
  title,
  message,
  cost,
  options,
  optionLabel,
  onSelect,
  onCancel,
}: OutcomeDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="modal__title">{title}</h2>
        {message && <p className="subtitle">{message}</p>}
        {cost !== undefined && cost > 0 && (
          <p className="subtitle">Cost added to pot: {cost.toLocaleString()}</p>
        )}

        <div className="bet-actions">
          {options.map((player) => (
            <Button
              key={player.id}
              variant="primary"
              fullWidth
              onClick={() => onSelect(player.id)}
            >
              {optionLabel(player)}
            </Button>
          ))}
          <Button variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
