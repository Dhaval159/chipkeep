import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import CreateGame from './pages/CreateGame'
import Settings from './pages/Settings'
import Game from './pages/Game'
import History from './pages/History'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Lobby from './pages/Lobby'
import { LoadGameModal } from './components/LoadGameModal'
import { MultiplayerGameProvider } from './context/MultiplayerGameProvider'

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/game" element={<Game />} />
          <Route
            path="/game/:roomId"
            element={
              <MultiplayerGameProvider>
                <Game />
              </MultiplayerGameProvider>
            }
          />
          <Route path="/history" element={<History />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
        </Route>
      </Routes>
      <LoadGameModal />
    </>
  )
}

export default App
