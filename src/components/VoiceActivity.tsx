// src/components/VoiceActivity.tsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface VoiceActivityProps {
  imageUrl?: string;
}

interface VoiceActivityRef {
  getCurrentSize: () => number;
}

const VoiceActivity = forwardRef<VoiceActivityRef, VoiceActivityProps>(({ imageUrl }, ref) => {
  const theme = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  const breathePhaseRef = useRef<number>(0);
  
  const currentScaleRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);
  const currentBrightnessRef = useRef<number>(1);
  const targetBrightnessRef = useRef<number>(1);
  const currentSaturateRef = useRef<number>(1);
  const targetSaturateRef = useRef<number>(1);

  const sphereRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getCurrentSize: () => 160 * currentScaleRef.current,
  }));

  const startListening = async () => {
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
        if (analyserRef.current && sphereRef.current) {
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
            targetScaleRef.current = 1.1 + normalizedLevel * 0.2;
            targetBrightnessRef.current = 1 + normalizedLevel * 0.2;
            targetSaturateRef.current = 1 + normalizedLevel * 0.4;
            breathePhaseRef.current = 0;
          } else {
            breathePhaseRef.current += deltaTime * Math.PI * 2 / 8;
            const breatheAmplitude = 0.08 + Math.sin(breathePhaseRef.current * 0.3) * 0.03;
            targetScaleRef.current = 1 + Math.abs(Math.sin(breathePhaseRef.current)) * breatheAmplitude;
            targetBrightnessRef.current = 1 + Math.sin(breathePhaseRef.current) * 0.05;
            targetSaturateRef.current = 1;
          }

          currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * smoothingFactor;
          currentBrightnessRef.current += (targetBrightnessRef.current - currentBrightnessRef.current) * smoothingFactor;
          currentSaturateRef.current += (targetSaturateRef.current - currentSaturateRef.current) * smoothingFactor;

          sphereRef.current.style.transform = `scale(${currentScaleRef.current})`;
          sphereRef.current.style.filter = `brightness(${currentBrightnessRef.current}) saturate(${currentSaturateRef.current})`;
        }

        animationRef.current = requestAnimationFrame(checkAudioLevel);
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
    lastUpdateTimeRef.current = Date.now();
    startListening();

    return () => {
      stopListening();
    };
  }, []);

  const sphereStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: imageUrl
      ? `linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.1)), url(${imageUrl})`
      : `linear-gradient(135deg, ${theme.colors.accent}, #DBE0C3)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    zIndex: 2,
    width: '160px',
    height: '160px',
  };

  return (
    <motion.div
      key="voice-mode"
      ref={sphereRef}
      style={sphereStyle}
    />
  );
});

export default VoiceActivity;