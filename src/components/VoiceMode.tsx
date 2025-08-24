import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import LiquidChrome from './LiquidChrome';

interface VoiceModeProps {
  imageUrl?: string;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ imageUrl }) => {
  const theme = useTheme();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const sphereRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const breathePhaseRef = useRef<number>(0);
  
  // Add smoothing variables for gradual voice activity scaling
  const currentScaleRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);
  const currentBrightnessRef = useRef<number>(1);
  const targetBrightnessRef = useRef<number>(1);
  const currentSaturateRef = useRef<number>(1);
  const targetSaturateRef = useRef<number>(1);

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

          // Focus on voice frequency range (85Hz to 3000Hz)
          const sampleRate = audioContextRef.current!.sampleRate;
          const voiceStart = Math.floor((85 / (sampleRate / 2)) * bufferLength);
          const voiceEnd = Math.floor((3000 / (sampleRate / 2)) * bufferLength);

          let sum = 0;
          for (let i = voiceStart; i < voiceEnd; i++) {
            sum += dataArray[i];
          }
          const average = sum / (voiceEnd - voiceStart);

          // Dynamic threshold and normalized level (0-1)
          const threshold = 15;
          const maxLevel = 100;
          const normalizedLevel = Math.min(Math.max((average - threshold) / (maxLevel - threshold), 0), 1);

          const now = Date.now();
          const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
          lastUpdateTimeRef.current = now;

          // Smoothing factor for gradual transitions (0-1, higher = smoother but slower)
          const smoothingFactor = 0.1;

          if (normalizedLevel > 0) {
            // Voice active: set target values for smooth scaling
            targetScaleRef.current = 1.1 + normalizedLevel * 0.2; // Reduced by 25% for more subtle voice activity
            targetBrightnessRef.current = 1 + normalizedLevel * 0.2;
            targetSaturateRef.current = 1 + normalizedLevel * 0.4;
            // Reset breathe phase when voice starts
            breathePhaseRef.current = 0;
          } else {
            // Idle: enhanced breathing animation with larger scale changes
            breathePhaseRef.current += deltaTime * Math.PI * 2 / 8; // Slightly faster 8s period
            const breatheAmplitude = 0.08 + Math.sin(breathePhaseRef.current * 0.3) * 0.03; // Much larger amplitude: 0.05 to 0.11
            targetScaleRef.current = 1 + Math.abs(Math.sin(breathePhaseRef.current)) * breatheAmplitude;
            targetBrightnessRef.current = 1 + Math.sin(breathePhaseRef.current) * 0.05;
            targetSaturateRef.current = 1;
          }

          // Smoothly interpolate current values toward targets
          currentScaleRef.current += (targetScaleRef.current - currentScaleRef.current) * smoothingFactor;
          currentBrightnessRef.current += (targetBrightnessRef.current - currentBrightnessRef.current) * smoothingFactor;
          currentSaturateRef.current += (targetSaturateRef.current - currentSaturateRef.current) * smoothingFactor;

          // Apply smoothed styles directly for performance
          sphereRef.current.style.transform = `scale(${currentScaleRef.current})`;
          sphereRef.current.style.filter = `brightness(${currentBrightnessRef.current}) saturate(${currentSaturateRef.current})`;
          // Removed box-shadow completely (no more glow effect)
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
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    transform: 'scale(1)',
    filter: 'brightness(1) saturate(1)',
    // Removed box-shadow completely - no more glow
    transition: 'none', // Removed transitions to let the smooth interpolation handle it
    zIndex: 2,
    overflow: 'hidden',
  };

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

  return (
    <div style={containerStyle}>
      <div ref={sphereRef} style={sphereStyle}>
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={1}
          amplitude={0.3}
          interactive={false}
        />
      </div>
    </div>
  );
};

export default VoiceMode;