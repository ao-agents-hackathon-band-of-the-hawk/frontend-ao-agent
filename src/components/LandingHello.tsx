"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"

interface Props {
  onComplete?: () => void
}

export default function LandingHello({ onComplete }: Props) {
  const TARGET_SPHERE_SIZE = 160

  // Estimate an initial "o" size from the heading's computed font-size
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const placeholderRef = useRef<HTMLSpanElement | null>(null)
  const circleRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [initialOSize, setInitialOSize] = useState<number>(40)

  // Manual adjustment states
  const [textOffsetX, setTextOffsetX] = useState<number>(0)
  const [textOffsetY, setTextOffsetY] = useState<number>(0)
  const [sphereOffsetX, setSphereOffsetX] = useState<number>(0)
  const [sphereOffsetY, setSphereOffsetY] = useState<number>(0)
  const [sizeMultiplier, setSizeMultiplier] = useState<number>(1)
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false)
  const [isDraggingSphere, setIsDraggingSphere] = useState<boolean>(false)

  useEffect(() => {
    if (!headingRef.current) return
    const style = window.getComputedStyle(headingRef.current)
    const fontSize = Number.parseFloat(style.fontSize || "64")
    // Make initial size match the "o" in the font - about 50-55% of font size
    setInitialOSize(Math.max(24, Math.round(fontSize * 0.55 * sizeMultiplier)))
  }, [sizeMultiplier])

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
      // Don't scroll if dragging
      if (isDraggingText || isDraggingSphere) return
      
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
      // Don't scroll if dragging
      if (isDraggingText || isDraggingSphere) return
      
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
  }, [progress, isDraggingText, isDraggingSphere])

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

  // Position the text so the placeholder "o" aligns with the viewport center circle
  useEffect(() => {
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
      
      // Position the heading so the placeholder center aligns with viewport center + manual offsets
      const headingLeft = viewportCenterX - containerRect.left - placeholderOffsetX + sphereOffsetX + textOffsetX
      const headingTop = viewportCenterY - containerRect.top - placeholderOffsetY + sphereOffsetY + textOffsetY
      
      headingRef.current.style.position = 'absolute'
      headingRef.current.style.left = `${headingLeft}px`
      headingRef.current.style.top = `${headingTop}px`
      headingRef.current.style.transform = 'none'
    }

    updateTextPosition()
    window.addEventListener('resize', updateTextPosition)

    return () => window.removeEventListener('resize', updateTextPosition)
  }, [initialOSize, textOffsetX, textOffsetY, sphereOffsetX, sphereOffsetY])

  // Position the circle at the center of the viewport
  useEffect(() => {
    const updateCirclePosition = () => {
      if (!circleRef.current || !containerRef.current) return

      // Position the circle at the center of the viewport + manual offsets
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2

      // Get container's position relative to viewport
      const containerRect = containerRef.current.getBoundingClientRect()

      // Calculate position relative to container to center the circle in viewport
      const left = viewportCenterX - containerRect.left + sphereOffsetX
      const top = viewportCenterY - containerRect.top + sphereOffsetY

      circleRef.current.style.left = `${left}px`
      circleRef.current.style.top = `${top}px`
    }

    updateCirclePosition()
    window.addEventListener('resize', updateCirclePosition)

    return () => window.removeEventListener('resize', updateCirclePosition)
  }, [sphereOffsetX, sphereOffsetY])

  // Mouse drag handlers for text
  const handleTextMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingText(true)
    const startX = e.clientX - textOffsetX
    const startY = e.clientY - textOffsetY

    const handleMouseMove = (e: MouseEvent) => {
      setTextOffsetX(e.clientX - startX)
      setTextOffsetY(e.clientY - startY)
    }

    const handleMouseUp = () => {
      setIsDraggingText(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Mouse drag handlers for sphere
  const handleSphereMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingSphere(true)
    const startX = e.clientX - sphereOffsetX
    const startY = e.clientY - sphereOffsetY

    const handleMouseMove = (e: MouseEvent) => {
      setSphereOffsetX(e.clientX - startX)
      setSphereOffsetY(e.clientY - startY)
    }

    const handleMouseUp = () => {
      setIsDraggingSphere(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 5
      
      switch (e.key) {
        // Text movement
        case 'ArrowUp':
          if (e.shiftKey) setTextOffsetY(prev => prev - step)
          break
        case 'ArrowDown':
          if (e.shiftKey) setTextOffsetY(prev => prev + step)
          break
        case 'ArrowLeft':
          if (e.shiftKey) setTextOffsetX(prev => prev - step)
          break
        case 'ArrowRight':
          if (e.shiftKey) setTextOffsetX(prev => prev + step)
          break
        
        // Sphere movement
        case 'w':
        case 'W':
          setSphereOffsetY(prev => prev - step)
          break
        case 's':
        case 'S':
          setSphereOffsetY(prev => prev + step)
          break
        case 'a':
        case 'A':
          setSphereOffsetX(prev => prev - step)
          break
        case 'd':
        case 'D':
          setSphereOffsetX(prev => prev + step)
          break
        
        // Size adjustment
        case '+':
        case '=':
          setSizeMultiplier(prev => Math.min(3, prev + 0.1))
          break
        case '-':
        case '_':
          setSizeMultiplier(prev => Math.max(0.3, prev - 0.1))
          break
        
        // Reset
        case 'r':
        case 'R':
          setTextOffsetX(0)
          setTextOffsetY(0)
          setSphereOffsetX(0)
          setSphereOffsetY(0)
          setSizeMultiplier(1)
          break
        
        // Log current values
        case 'l':
        case 'L':
          console.log('=== LANDING PAGE POSITION VALUES ===')
          console.log(`textOffsetX: ${textOffsetX}`)
          console.log(`textOffsetY: ${textOffsetY}`)
          console.log(`sphereOffsetX: ${sphereOffsetX}`)
          console.log(`sphereOffsetY: ${sphereOffsetY}`)
          console.log(`sizeMultiplier: ${sizeMultiplier}`)
          console.log('=====================================')
          
          // Also copy to clipboard if available
          if (navigator.clipboard) {
            const values = `textOffsetX: ${textOffsetX}, textOffsetY: ${textOffsetY}, sphereOffsetX: ${sphereOffsetX}, sphereOffsetY: ${sphereOffsetY}, sizeMultiplier: ${sizeMultiplier}`
            navigator.clipboard.writeText(values).then(() => {
              console.log('Values copied to clipboard!')
            }).catch(() => {
              console.log('Could not copy to clipboard')
            })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [textOffsetX, textOffsetY, sphereOffsetX, sphereOffsetY, sizeMultiplier])

  return (
    <main className="bg-background text-foreground h-screen flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        <div>
          <h1
            ref={headingRef}
            className="font-extrabold text-pretty text-center leading-none tracking-tight text-5xl md:text-7xl lg:text-8xl flex items-center select-none"
            aria-label="Hello there"
            onMouseDown={handleTextMouseDown}
            style={{ cursor: isDraggingText ? 'grabbing' : 'grab' }}
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
          onMouseDown={handleSphereMouseDown}
          style={{
            position: 'absolute',
            width: oSize as unknown as number,
            height: oSize as unknown as number,
            borderRadius: "50%",
            backgroundColor: "#C3CB9C",
            transform: 'translate(-50%, -50%)',
            cursor: isDraggingSphere ? 'grabbing' : 'grab',
          }}
        />
      </div>
      
      {/* Controls overlay */}
      <div className="fixed top-5 left-5 z-[1000] bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-[300px]">
        <div className="mb-2 text-yellow-300 font-semibold">Landing Page Controls</div>
        <div className="text-[10px] space-y-1">
          <div><strong>Text:</strong> Drag or Shift+Arrows</div>
          <div><strong>Sphere:</strong> Drag or WASD</div>
          <div><strong>Size:</strong> +/- keys</div>
          <div><strong>Reset:</strong> R key</div>
          <div><strong>Log Values:</strong> L key</div>
          <div className="pt-2 border-t border-white/20">
            <div>Text: ({textOffsetX}, {textOffsetY})</div>
            <div>Sphere: ({sphereOffsetX}, {sphereOffsetY})</div>
            <div>Size: {sizeMultiplier.toFixed(1)}x</div>
          </div>
          <div className="pt-2 border-t border-white/20 text-green-300">
            <div>Press L to log values to console</div>
            <div>and copy to clipboard!</div>
          </div>
        </div>
      </div>
    </main>
  )
}