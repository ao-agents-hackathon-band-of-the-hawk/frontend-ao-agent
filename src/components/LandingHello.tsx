"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

interface Props {
  onComplete?: () => void
}

export default function LandingHello({ onComplete }: Props) {
  const TARGET_SPHERE_SIZE = 160

  // Fixed position and size values
  const TEXT_OFFSET_X = 5
  const TEXT_OFFSET_Y = -10
  const SPHERE_OFFSET_X = 0
  const SPHERE_OFFSET_Y = 0
  const SIZE_MULTIPLIER = 1

  // Estimate an initial "o" size from the heading's computed font-size
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const placeholderRef = useRef<HTMLSpanElement | null>(null)
  const circleRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [initialOSize, setInitialOSize] = useState<number>(40)
  const [isReady, setIsReady] = useState<boolean>(false)

  // Wait for fonts to load and calculate initial size
  useEffect(() => {
    const initializeSize = async () => {
      // Wait for fonts to load
      if (document.fonts) {
        await document.fonts.ready
      }
      
      // Small additional delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!headingRef.current) return
      
      const style = window.getComputedStyle(headingRef.current)
      const fontSize = Number.parseFloat(style.fontSize || "64")
      // Make initial size match the "o" in the font with fixed size multiplier
      setInitialOSize(Math.max(24, Math.round(fontSize * 0.55 * SIZE_MULTIPLIER)))
      setIsReady(true)
    }

    initializeSize()
  }, [])

  // Motion value for progress
  const progress = useMotionValue(0)

  // Transforms with smoother spring settings
  const sizeRaw = useTransform(progress, [0, 1], [initialOSize, TARGET_SPHERE_SIZE])
  const oSize = useSpring(sizeRaw, { stiffness: 80, damping: 25, mass: 0.4 })

  const opacityRaw = useTransform(progress, [0, 0.3], [1, 0], { clamp: true })
  const textOpacity = useSpring(opacityRaw, { stiffness: 100, damping: 30, mass: 0.3 })

  // Handle wheel and touch for progress
  useEffect(() => {
    let touchStartY = 0

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.2 : -0.2 // Step per wheel
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
        const delta = (touchStartY - touchY) / 300 // Sensitivity
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

  // Call onComplete when progress reaches 1 (with smooth delay)
  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      if (value >= 1) {
        // Add a smooth delay to make the transition less jarring
        setTimeout(() => {
          onComplete?.()
        }, 800) // 800ms delay for smoother transition
      }
    })
    return () => unsubscribe()
  }, [progress, onComplete])

  // Position the text with fixed offsets
  useEffect(() => {
    if (!isReady) return // Don't position until fonts are loaded and size is calculated
    
    const updateTextPosition = () => {
      if (!headingRef.current || !placeholderRef.current || !containerRef.current) return

      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Get the placeholder's position within the heading
      const placeholderRect = placeholderRef.current.getBoundingClientRect()
      const headingRect = headingRef.current.getBoundingClientRect()
      
      // Calculate offset from heading start to placeholder center
      const placeholderOffsetX = placeholderRect.left - headingRect.left + placeholderRect.width / 2
      const placeholderOffsetY = placeholderRect.top - headingRect.top + placeholderRect.height / 2
      
      // Position the heading with fixed offsets
      const headingLeft = viewportCenterX - containerRect.left - placeholderOffsetX + SPHERE_OFFSET_X + TEXT_OFFSET_X
      const headingTop = viewportCenterY - containerRect.top - placeholderOffsetY + SPHERE_OFFSET_Y + TEXT_OFFSET_Y
      
      headingRef.current.style.position = 'absolute'
      headingRef.current.style.left = `${headingLeft}px`
      headingRef.current.style.top = `${headingTop}px`
      headingRef.current.style.transform = 'none'
    }

    // Initial positioning with a small delay
    const timeoutId = setTimeout(updateTextPosition, 50)
    
    window.addEventListener('resize', updateTextPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateTextPosition)
    }
  }, [initialOSize, isReady])

  // Position the circle with fixed offsets
  useEffect(() => {
    if (!isReady) return // Don't position until ready
    
    const updateCirclePosition = () => {
      if (!circleRef.current || !containerRef.current) return

      // Position the circle at the center of the viewport with fixed offsets
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2

      // Get container's position relative to viewport
      const containerRect = containerRef.current.getBoundingClientRect()

      // Calculate position relative to container to center the circle in viewport
      const left = viewportCenterX - containerRect.left + SPHERE_OFFSET_X
      const top = viewportCenterY - containerRect.top + SPHERE_OFFSET_Y

      circleRef.current.style.left = `${left}px`
      circleRef.current.style.top = `${top}px`
    }

    // Initial positioning with a small delay
    const timeoutId = setTimeout(updateCirclePosition, 50)
    
    window.addEventListener('resize', updateCirclePosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateCirclePosition)
    }
  }, [isReady])

  return (
    <main className="bg-background text-foreground h-screen flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        <div style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}>
          <h1
            ref={headingRef}
            className="font-extrabold text-pretty text-center leading-none tracking-tight text-5xl md:text-7xl lg:text-8xl flex items-center select-none"
            aria-label="Hello there"
          >
            <motion.span style={{ opacity: textOpacity }}>Hell</motion.span>
            <span
              ref={placeholderRef}
              className="inline-block mx-[0.1em]"
              style={{ width: initialOSize, height: '1em' }}
            />
            <motion.span style={{ opacity: textOpacity }}> there</motion.span>
          </h1>
        </div>
        <motion.span
          ref={circleRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: oSize as unknown as number,
            height: oSize as unknown as number,
            borderRadius: "50%",
            backgroundColor: "#C3CB9C",
            transform: 'translate(-50%, -50%)',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      </div>
    </main>
  )
}