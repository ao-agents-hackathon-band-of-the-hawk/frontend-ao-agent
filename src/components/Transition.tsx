import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface TransitionProps {
  isTextMode: boolean;
  onTransitionComplete?: () => void;
  imageUrl?: string;
}

const Transition: React.FC<TransitionProps> = ({ 
  isTextMode, 
  onTransitionComplete,
  imageUrl 
}) => {
  const theme = useTheme();
  const [transitionStage, setTransitionStage] = useState<'voice' | 'expanding' | 'text'>('voice');
  
  // Voice mode audio context refs (copied from VoiceMode)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const breathePhaseRef = useRef<number>(0);
  
  // Voice activity smoothing
  const currentScaleRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);
  const currentBrightnessRef = useRef<number>(1);
  const targetBrightnessRef = useRef<number>(1);
  const currentSaturateRef = useRef<number>(1);
  const targetSaturateRef = useRef<number>(1);

  const [voiceScale, setVoiceScale] = useState(1);
  const [voiceBrightness, setVoiceBrightness] = useState(1);
  const [voiceSaturate, setVoiceSaturate] = useState(1);

  // Dynamic transition starting values
  const [transitionStartSize, setTransitionStartSize] = useState(160);

  const startListening = async () => {
    if (isTextMode) return; // Don't start listening in text mode
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.85;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (analyserRef.current && !isTextMode) {
          analyserRef.current.getByteFrequencyData(dataArray);

          const sampleRate = audioContextRef.current!.sampleRate;
          const voiceStart = Math.floor((85 / (sampleRate / 2)) * bufferLength);
          const voiceEnd = Math.floor((3000 / (sampleRate / 2)) * bufferLength);

          let sum = 0;
          for (let i = voiceStart; i < voiceEnd; i++) {
            sum += dataArray[i];
          }
          const average = sum / (voiceEnd - voiceStart);

          const threshold = 15;
          const maxLevel = 100;
          const normalizedLevel = Math.min(Math.max((average - threshold) / (maxLevel - threshold), 0), 1);

          const now = Date.now();
          const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
          lastUpdateTimeRef.current = now;

          const smoothingFactor = 0.1;

          if (normalizedLevel > 0) {
            targetScaleRef.current = 1.3 + normalizedLevel * 0.5; // More dramatic scaling
            targetBrightnessRef.current = 1 + normalizedLevel * 0.2;
            targetSaturateRef.current = 1 + normalizedLevel * 0.4;
            breathePhaseRef.current = 0;
          } else {
            breathePhaseRef.current += deltaTime * Math.PI * 2 / 8;
            const breatheAmplitude = 0.15 + Math.sin(breathePhaseRef.current * 0.3) * 0.05; // More dramatic breathing
            targetScaleRef.current = 1 + Math.abs(Math.sin(breathePhaseRef.current)) * breatheAmplitude;
            targetBrightnessRef.current = 1 + Math.sin(breathePhaseRef.current) * 0.05;
            targetSaturateRef.current = 1;
          }

          currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * smoothingFactor;
          currentBrightnessRef.current += (targetBrightnessRef.current - currentBrightnessRef.current) * smoothingFactor;
          currentSaturateRef.current += (targetSaturateRef.current - currentSaturateRef.current) * smoothingFactor;

          // Force React re-render by updating state
          setVoiceScale(currentScaleRef.current);
          setVoiceBrightness(currentBrightnessRef.current);
          setVoiceSaturate(currentSaturateRef.current);

          // Debug logging
          if (normalizedLevel > 0) {
            console.log(`Voice detected: level=${normalizedLevel.toFixed(2)}, scale=${currentScaleRef.current.toFixed(2)}`);
          }
        }

        if (!isTextMode) {
          animationRef.current = requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
    } catch (error) {
      console.error('Microphone access denied or unavailable:', error);
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  useEffect(() => {
    if (isTextMode) {
      // Capture current voice sphere state before transition
      const currentScale = currentScaleRef.current;
      const currentSize = 160 * currentScale; // Actual rendered size
      
      setTransitionStartSize(currentSize);
      setTransitionStage('expanding');
      stopListening();
      
      // Complete transition to text mode after animation
      const timer = setTimeout(() => {
        setTransitionStage('text');
        onTransitionComplete?.();
      }, 1800); // Animation duration
      
      return () => clearTimeout(timer);
    } else {
      setTransitionStage('voice');
      setTransitionStartSize(160);
      lastUpdateTimeRef.current = Date.now();
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [isTextMode]);

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
  };

  const sphereStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: imageUrl
      ? `linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.1)), url(${imageUrl})`
      : `linear-gradient(135deg, ${theme.colors.accent}, #8b5cf6)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    zIndex: 2,
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {transitionStage === 'voice' && (
          <motion.div
            key="voice-mode"
            style={{
              ...sphereStyle,
              width: '160px',
              height: '160px',
              transform: `scale(${voiceScale})`,
              filter: `brightness(${voiceBrightness}) saturate(${voiceSaturate})`,
            }}
          />
        )}

        {(transitionStage === 'expanding' || transitionStage === 'text') && (
          <motion.div
            key="transition-mode"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Expanding outline/border - dynamic starting size based on current voice scale */}
            <motion.div
              initial={{ 
                width: transitionStartSize + 20, 
                height: transitionStartSize + 20, 
                borderRadius: '50%',
              }}
              animate={{ 
                width: [transitionStartSize + 20, 91, 397], 
                height: [transitionStartSize + 20, 91, 96], 
                borderRadius: ['50%', '50%', '48px'],
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.4, 1],
                ease: [0.2, 0, 0.1, 1],
              }}
              style={{
                position: 'absolute',
                border: `2px solid ${theme.colors.accent}`,
                background: transitionStage === 'text' ? theme.colors.background : 'transparent',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: transitionStage === 'text' ? '0 29px' : '0',
              }}
            >
              {/* Text input area - appears smoothly */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: transitionStage === 'text' ? 1 : 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: transitionStage === 'text' ? 0 : 1.2,
                  ease: [0.2, 0, 0.1, 1]
                }}
                style={{
                  marginRight: '100px', // 77px + padding
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: theme.colors.text,
                    fontSize: '19px',
                    fontFamily: theme.typography.fontFamily.primary,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Shrinking and moving sphere - starts from current voice scale */}
            <motion.div
              initial={{ 
                width: transitionStartSize,
                height: transitionStartSize,
                x: 0,
                scale: 1, // Already factored into width/height
              }}
              animate={{ 
                width: [transitionStartSize, 77, 77], 
                height: [transitionStartSize, 77, 77],
                x: [0, 0, 151], // Adjusted for larger pill (397/2 - 77/2 - 15 padding)
                scale: 1, // Keep scale at 1 since we're animating width/height directly
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.4, 1],
                ease: [0.2, 0, 0.1, 1],
              }}
              style={{
                ...sphereStyle,
                zIndex: 2,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transition;