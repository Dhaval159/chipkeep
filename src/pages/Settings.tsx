import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SectionHeader } from '../components/ui/SectionHeader'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <SectionHeader title="ChipKeep" />

      <Button
        variant="secondary"
        onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start' }}
      >
        ← Back
      </Button>

      <p className="subtitle">Settings — coming soon.</p>
    </div>
  )
}
