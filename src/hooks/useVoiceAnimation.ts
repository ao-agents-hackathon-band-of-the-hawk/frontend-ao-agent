// src/hooks/useVoiceAnimation.ts
import { useRef, useCallback, useEffect } from 'react';
import type { VoiceState } from './useVoiceLogic';

interface UseVoiceAnimationProps {
  voiceState: VoiceState;
  userSpeaking: boolean;
}

export const useVoiceAnimation = ({ voiceState, userSpeaking }: UseVoiceAnimationProps) => {
  // Animation references
  const currentScaleRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);
  const currentBrightnessRef = useRef<number>(1);
  const targetBrightnessRef = useRef<number>(1);
  const currentSaturateRef = useRef<number>(1);
  const targetSaturateRef = useRef<number>(1);
  const breathePhaseRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  
  const sphereRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Animation loop
  const animate = useCallback(() => {
    if (!sphereRef.current) return;
    
    const now = Date.now();
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = now;
    
    const smoothingFactor = 0.1;
    
    // Different animations based on state
    switch (voiceState) {
      case 'idle':
        // Gentle breathing animation
        breathePhaseRef.current += deltaTime * Math.PI * 2 / 6; // 6-second breath cycle
        const breatheAmplitude = 0.05;
        targetScaleRef.current = 1 + Math.abs(Math.sin(breathePhaseRef.current)) * breatheAmplitude;
        targetBrightnessRef.current = 1 + Math.sin(breathePhaseRef.current) * 0.03;
        targetSaturateRef.current = 1;
        break;
        
      case 'listening':
        // Active listening - responsive to VAD
        if (userSpeaking) {
          targetScaleRef.current = 1.3;
          targetBrightnessRef.current = 1.4;
          targetSaturateRef.current = 1.6;
        } else {
          // Pulse while waiting for speech
          breathePhaseRef.current += deltaTime * Math.PI * 2 / 2; // Faster 2-second pulse
          targetScaleRef.current = 1.1 + Math.abs(Math.sin(breathePhaseRef.current)) * 0.1;
          targetBrightnessRef.current = 1.1 + Math.sin(breathePhaseRef.current) * 0.1;
          targetSaturateRef.current = 1.2;
        }
        break;
        
      case 'processing':
      case 'waiting_response':
        // Spinning animation with glow
        rotationRef.current += deltaTime * 120; // 120 degrees per second
        breathePhaseRef.current += deltaTime * Math.PI * 2 / 1.5; // Fast pulse
        targetScaleRef.current = 1.2 + Math.abs(Math.sin(breathePhaseRef.current)) * 0.15;
        targetBrightnessRef.current = 1.3 + Math.sin(breathePhaseRef.current) * 0.2;
        targetSaturateRef.current = 1.5;
        
        // Don't apply rotation here - it will be handled separately
        break;
    }
    
    // Smooth interpolation
    currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * smoothingFactor;
    currentBrightnessRef.current += (targetBrightnessRef.current - currentBrightnessRef.current) * smoothingFactor;
    currentSaturateRef.current += (targetSaturateRef.current - currentSaturateRef.current) * smoothingFactor;
    
    // Apply transforms - handle rotation separately for processing states
    if (voiceState === 'processing' || voiceState === 'waiting_response') {
      sphereRef.current.style.transform = `scale(${currentScaleRef.current}) rotate(${rotationRef.current}deg)`;
    } else {
      sphereRef.current.style.transform = `scale(${currentScaleRef.current})`;
    }
    sphereRef.current.style.filter = `brightness(${currentBrightnessRef.current}) saturate(${currentSaturateRef.current})`;
    
    animationRef.current = requestAnimationFrame(animate);
  }, [voiceState, userSpeaking]);
  
  // Start animation loop
  useEffect(() => {
    lastUpdateTimeRef.current = Date.now();
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);
  
  // Get current scale for imperative handle
  const getCurrentSize = useCallback(() => {
    return 160 * currentScaleRef.current;
  }, []);
  
  return {
    sphereRef,
    getCurrentSize,
  };
};