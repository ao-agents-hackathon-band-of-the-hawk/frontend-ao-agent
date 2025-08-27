// src/App.tsx (updated)
import { useState } from 'react'
import VoiceMode from './components/VoiceMode'
import TextMode from './components/TextMode'
import Transition from './components/Transition'
import './App.css'

function App() {
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState<'toText' | 'toVoice'>('toText')

  // Simple swipe detection using touch events
  const [touchStartY, setTouchStartY] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || transitioning) return

    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY - touchEndY

    if (deltaY > 50 && mode === 'voice') {
      // Swipe up
      setDirection('toText')
      setTransitioning(true)
    } else if (deltaY < -50 && mode === 'text') {
      // Swipe down
      setDirection('toVoice')
      setTransitioning(true)
    }

    setTouchStartY(null)
  }

  const handleComplete = () => {
    setMode(direction === 'toText' ? 'text' : 'voice')
    setTransitioning(false)
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      {transitioning ? (
        <Transition direction={direction} onComplete={handleComplete} />
      ) : mode === 'voice' ? (
        <VoiceMode />
      ) : (
        <TextMode />
      )}
    </div>
  )
}

export default App