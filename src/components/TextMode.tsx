// src/components/TextMode.tsx (updated borderThickness)
import { useTheme } from '../hooks/useTheme'
import RectangularGlow from './RectangularGlow'

const TextMode: React.FC = () => {
  const theme = useTheme()

  const containerStyle: React.CSSProperties = {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    position: 'fixed',
    top: 0,
    left: 0,
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  }

  return (
    <div style={containerStyle}>
      <RectangularGlow hue={5} borderThickness={0.1} />
      {/* Add your text mode content here, e.g., <DemoPage /> */}
    </div>
  )
}

export default TextMode