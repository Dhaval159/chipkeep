import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ArrowLeft, Info, Volume2, Smartphone, Moon } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Theme', value: 'Dark', description: 'Appearance mode' },
        { icon: Volume2, label: 'Sound', value: 'On', description: 'Game audio feedback' },
        { icon: Smartphone, label: 'Animations', value: 'Enabled', description: 'Motion effects' },
      ],
    },
    {
      title: 'Information',
      items: [
        { icon: Info, label: 'Version', value: '1.0.0', description: 'Current build' },
        { icon: Info, label: 'GitHub', value: '', description: 'View source code' },
      ],
    },
  ]

  return (
    <div className="ck-page ck-page--narrow" style={{ gap: 'var(--space-24)' }}>
      <button className="ck-back" onClick={() => navigate('/')} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="ck-page-header">
        <h1 className="ck-page-header__title">Settings</h1>
        <p className="ck-page-header__subtitle">Customize your experience</p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">{group.title}</h2>
          </div>
          <div className="home-actions">
            {group.items.map((item) => (
              <div
                key={item.label}
                className="lobby-player-card"
                style={{ cursor: 'default' }}
              >
                <div className="action-sheet-item__icon" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                  <item.icon size={18} />
                </div>
                <div className="lobby-player-card__info">
                  <div className="lobby-player-card__name-row">
                    <span className="lobby-player-card__name">{item.label}</span>
                  </div>
                  <div className="lobby-player-card__meta">
                    <span className="lobby-player-card__status lobby-player-card__status--online">{item.description}</span>
                  </div>
                </div>
                {item.value && (
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="home-actions" style={{ marginTop: 'auto', paddingTop: 'var(--space-24)' }}>
        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
          Close
        </Button>
      </div>
    </div>
  )
}
