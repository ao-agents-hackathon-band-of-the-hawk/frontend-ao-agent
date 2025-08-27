// src/components/Transition.tsx (updated for detailed flow animation)
import { useEffect } from 'react'
import { motion, useMotionValue, animate, useTransform } from 'framer-motion'
import Orb from '../Orb'
import RectangularGlow from './RectangularGlow'

interface TransitionProps {
  direction: 'toText' | 'toVoice'
  onComplete: () => void
}

const Transition: React.FC<TransitionProps> = ({ direction, onComplete }) => {
  const isToText = direction === 'toText'
  const orbSize = 300

  // Motion values for animated props
  const yPercent = useMotionValue(isToText ? 50 : 100)
  const deform = useMotionValue(isToText ? 0 : 0.8)
  const scaleX = useMotionValue(isToText ? 1 : 1.6)
  const scaleY = useMotionValue(isToText ? 1 : 0.2)
  const orbOpacity = useMotionValue(isToText ? 1 : 0)
  const breakProgress = useMotionValue(isToText ? 0 : 1)
  const rectWidth = useMotionValue(isToText ? 0 : 2)
  const rectHeight = useMotionValue(isToText ? 0.2 : 2)
  const rectOpacity = useMotionValue(isToText ? 0 : 1)
  const topSpreadProgress = useMotionValue(isToText ? 0 : 1)
  const centerY = useTransform(rectHeight, h => h / 2 - 1)

  const topStyle = useTransform(yPercent, v => `calc(${v}% - ${orbSize / 2}px)`)

  useEffect(() => {
    const fallDuration = 1.0
    const squashDuration = 0.4
    const breakDuration = 0.3
    const fadeDuration = 0.4
    const bottomSpreadDuration = 0.4
    const sideExtendDuration = 0.5
    const topFillDuration = 0.4

    const easeInCubic = (t: number) => t * t * t
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    if (isToText) {
      Promise.all([
        animate(yPercent, 100, { duration: fallDuration, ease: easeInCubic }),
        animate(deform, 0.8, { duration: fallDuration, ease: easeInCubic })
      ]).then(() => 
        Promise.all([
          animate(scaleX, 1.6, { duration: squashDuration, ease: easeOutCubic }),
          animate(scaleY, 0.2, { duration: squashDuration, ease: easeOutCubic })
        ])
      ).then(() => 
        animate(breakProgress, 1, { duration: breakDuration, ease: easeInOutQuad })
      ).then(() => 
        animate(orbOpacity, 0, { duration: fadeDuration, ease: easeInOutQuad })
      ).then(() => {
        animate(rectOpacity, 1, { duration: bottomSpreadDuration, ease: easeInOutQuad })
        return animate(rectWidth, 2, { duration: bottomSpreadDuration, ease: easeOutCubic })
      }).then(() => 
        animate(rectHeight, 2, { duration: sideExtendDuration, ease: easeOutCubic })
      ).then(() => 
        animate(topSpreadProgress, 1, { duration: topFillDuration, ease: easeInOutQuad })
      ).then(onComplete)
    } else {
      animate(topSpreadProgress, 0, { duration: topFillDuration, ease: easeInOutQuad })
      .then(() => 
        animate(rectHeight, 0.2, { duration: sideExtendDuration, ease: easeInCubic })
      ).then(() => {
        animate(rectOpacity, 0, { duration: bottomSpreadDuration, ease: easeInOutQuad })
        return animate(rectWidth, 0, { duration: bottomSpreadDuration, ease: easeInCubic })
      }).then(() => 
        animate(orbOpacity, 1, { duration: fadeDuration, ease: easeInOutQuad })
      ).then(() => 
        animate(breakProgress, 0, { duration: breakDuration, ease: easeInOutQuad })
      ).then(() => 
        Promise.all([
          animate(scaleX, 1, { duration: squashDuration, ease: easeOutCubic }),
          animate(scaleY, 1, { duration: squashDuration, ease: easeOutCubic })
        ])
      ).then(() => 
        Promise.all([
          animate(yPercent, 50, { duration: fallDuration, ease: easeOutCubic }),
          animate(deform, 0, { duration: fallDuration, ease: easeOutCubic })
        ])
      ).then(onComplete)
    }
  }, [isToText, onComplete])

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }

  const orbWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    width: `${orbSize}px`,
    height: `${orbSize}px`,
    transform: 'translate(-50%, 0)',
  }

  return (
    <>
      <div style={containerStyle}>
        <motion.div
          style={{
            ...orbWrapperStyle,
            top: topStyle,
          }}
        >
          <Orb
            hue={5}
            positionY={0}
            deform={deform}
            scaleX={scaleX}
            scaleY={scaleY}
            opacity={orbOpacity}
            breakProgress={breakProgress}
            pulseIntensity={0.3}
            hoverIntensity={0.2} // Fixed during transition
            rotateOnHover={false}
            forceHoverState={false}
          />
        </motion.div>
      </div>
      <div style={{ ...containerStyle, overflow: 'visible' }}>
        <RectangularGlow
          hue={5}
          borderThickness={0.1}
          rectWidth={rectWidth}
          rectHeight={rectHeight}
          centerY={centerY}
          opacity={rectOpacity}
          topSpreadProgress={topSpreadProgress}
        />
      </div>
    </>
  )
}

export default Transition