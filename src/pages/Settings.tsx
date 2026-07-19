import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <header className="header">
        <h1 className="logo">ChipKeep</h1>
      </header>

      <button
        type="button"
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <p className="subtitle">Settings — coming soon.</p>
    </div>
  )
}
