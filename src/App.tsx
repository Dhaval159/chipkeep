import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import CreateGame from './pages/CreateGame'
import Settings from './pages/Settings'
import Game from './pages/Game'
import History from './pages/History'
import { LoadGameModal } from './components/LoadGameModal'

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/game" element={<Game />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
      <LoadGameModal />
    </>
  )
}

export default App
