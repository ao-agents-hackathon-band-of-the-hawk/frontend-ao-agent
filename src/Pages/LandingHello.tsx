"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

interface Props {
  onComplete?: () => void
}

export default function LandingHello({ onComplete }: Props) {
  const TARGET_SPHERE_SIZE = 180
  
 
  const INITIAL_O_SIZE = 55

 
  const TEXT_OFFSET_X = 5
  const TEXT_OFFSET_Y = 22
  
  
  const SPHERE_OFFSET_X = 0
  const SPHERE_OFFSET_Y = -32

  // Refs and state
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const placeholderRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState<boolean>(false)
  const [isPositioned, setIsPositioned] = useState<boolean>(false)

  // Set isReady to true after the component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Motion value for progress
  const progress = useMotionValue(0)

  // Transforms with smoother spring settings
  const sizeRaw = useTransform(progress, [0, 1], [INITIAL_O_SIZE, TARGET_SPHERE_SIZE])
  const oSize = useSpring(sizeRaw, { stiffness: 80, damping: 25, mass: 0.4 })

  const opacityRaw = useTransform(progress, [0, 0.3], [1, 0], { clamp: true })
  const textOpacity = useSpring(opacityRaw, { stiffness: 100, damping: 30, mass: 0.3 })

  // Handle wheel and touch for progress
  useEffect(() => {
    let touchStartY = 0

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.2 : -0.2
      progress.set(Math.min(1, Math.max(0, progress.get() + delta)))
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault()
        const touchY = e.touches[0].clientY
        const delta = (touchStartY - touchY) / 300
        progress.set(Math.min(1, Math.max(0, progress.get() + delta)))
        touchStartY = touchY
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [progress])

  // Call onComplete when progress reaches 1
  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      if (value >= 1) {
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
    })
    return () => unsubscribe()
  }, [progress, onComplete])

  // Position the text relative to the center
  useEffect(() => {
    if (!isReady) return
    
    const updateTextPosition = () => {
      if (!headingRef.current || !placeholderRef.current || !containerRef.current) return

      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const containerRect = containerRef.current.getBoundingClientRect()
      
      const placeholderRect = placeholderRef.current.getBoundingClientRect()
      const headingRect = headingRef.current.getBoundingClientRect()
      
      const placeholderOffsetX = placeholderRect.left - headingRect.left + placeholderRect.width / 2
      const placeholderOffsetY = placeholderRect.top - headingRect.top + placeholderRect.height / 2
      
      const headingLeft = viewportCenterX - containerRect.left - placeholderOffsetX + SPHERE_OFFSET_X + TEXT_OFFSET_X
      const headingTop = viewportCenterY - containerRect.top - placeholderOffsetY + SPHERE_OFFSET_Y + TEXT_OFFSET_Y
      
      headingRef.current.style.position = 'absolute'
      headingRef.current.style.left = `${headingLeft}px`
      headingRef.current.style.top = `${headingTop}px`
      headingRef.current.style.transform = 'none'
      
      setIsPositioned(true)
    }

    const timeoutId = setTimeout(updateTextPosition, 50)
    window.addEventListener('resize', updateTextPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateTextPosition)
    }
  }, [isReady])
  
  // Only show content when everything is ready and positioned
  const showContent = isReady && isPositioned

  return (
    <main className="bg-background text-foreground h-screen flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        <div 
          style={{ 
            opacity: showContent ? 1 : 0, 
            transition: 'opacity 0.3s ease-in-out',
            visibility: showContent ? 'visible' : 'hidden'
          }}
        >
          <h1
            ref={headingRef}
            className="font-extrabold text-pretty text-center leading-none tracking-tight text-8xl flex items-center select-none"
            aria-label="Hello there"
          >
            <motion.span style={{ opacity: textOpacity }}>Hell</motion.span>
            <span
              ref={placeholderRef}
              className="inline-block mx-[0.1em]"
              style={{ width: INITIAL_O_SIZE, height: '1em' }}
            />
            <motion.span style={{ opacity: textOpacity }}> there</motion.span>
          </h1>
        </div>
        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: `calc(50% + ${SPHERE_OFFSET_Y}px)`,
            left: `calc(50% + ${SPHERE_OFFSET_X}px)`,
            width: oSize as unknown as number,
            height: oSize as unknown as number,
            borderRadius: "50%",
            backgroundColor: "#C3CB9C",
            transform: 'translate(-50%, -50%)',
            opacity: showContent ? 1 : 0,
            visibility: showContent ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      </div>
    </main>
  )
}