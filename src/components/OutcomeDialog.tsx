import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { X } from 'lucide-react'

interface OutcomeOption {
  id: string
  name: string
}

interface OutcomeDialogProps {
  title: string
  message: string
  options: OutcomeOption[]
  optionLabel: (option: OutcomeOption) => string
  onSelect: (winnerId: string) => void
  onCancel: () => void
}

export function OutcomeDialog({ title, message, options, optionLabel, onSelect, onCancel }: OutcomeDialogProps) {
  return (
    <div className="ck-dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="ck-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="ck-dialog__title">{title}</h2>
          <button
            onClick={onCancel}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="ck-dialog__description">{message}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="endhand-standing-card"
              style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onClick={() => onSelect(option.id)}
            >
              <Avatar name={option.name} size="md" />
              <div className="endhand-standing-card__info">
                <span className="endhand-standing-card__name">
                  {optionLabel(option)}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="ck-dialog__actions">
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
