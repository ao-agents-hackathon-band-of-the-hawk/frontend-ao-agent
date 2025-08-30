// src/components/VoiceMode.tsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMicVAD } from '@ricky0123/vad-react';
import { useTheme } from '../hooks/useTheme';

interface VoiceModeProps {
  imageUrl?: string;
  onAudioReady?: (audioBlob: Blob) => void;
}

interface VoiceModeRef {
  getCurrentSize: () => number;
  startListening: () => void;
  stopListening: () => void;
}

type VoiceState = 'idle' | 'starting' | 'listening' | 'processing' | 'waiting_response';

const VoiceMode = forwardRef<VoiceModeRef, VoiceModeProps>(({ imageUrl, onAudioReady }, ref) => {
  const theme = useTheme();
  
  // State management
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const voiceStateRef = useRef<VoiceState>('idle');
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [, setDebugInfo] = useState('Voice mode ready');
  
  // Add a ref to track if processing is already happening
  const isProcessingRef = useRef(false);
  // Store chunks to process separately from state
  const chunksToProcessRef = useRef<Float32Array[]>([]);
  
  // Update ref when state changes
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);
  
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
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio processing
  const sampleRate = 16000; // VAD outputs at 16kHz
  
  // Convert Float32Array to WAV blob
  const createWavBlob = useCallback((audioData: Float32Array[]): Blob => {
    // Concatenate all audio chunks
    const totalLength = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
    const concatenated = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of audioData) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert to 16-bit PCM
    const buffer = new ArrayBuffer(44 + concatenated.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + concatenated.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, concatenated.length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset16 = 44;
    for (let i = 0; i < concatenated.length; i++) {
      const sample = Math.max(-1, Math.min(1, concatenated[i]));
      view.setInt16(offset16, sample * 0x7FFF, true);
      offset16 += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }, [sampleRate]);
  
  // Process completed audio recording
  const processAudioRecording = useCallback(() => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('Already processing audio, skipping...');
      return;
    }
    
    // Check if we have chunks to process
    if (chunksToProcessRef.current.length === 0) {
      console.log('No audio chunks to process');
      return;
    }
    
    isProcessingRef.current = true;
    
    // Set states for processing (VAD will be paused by caller)
    setIsRecording(false);
    setVoiceState('processing');
    setDebugInfo('Processing audio...');
    
    console.log(`Processing ${chunksToProcessRef.current.length} audio chunks...`);
    
    // Process the audio (separate from React state)
    const wavBlob = createWavBlob(chunksToProcessRef.current);
    setDebugInfo(`Audio ready: ${(wavBlob.size / 1024).toFixed(1)}KB`);
    
    // Clear the chunks immediately after processing
    chunksToProcessRef.current = [];
    setAudioChunks([]); // Also clear state
    
    // Callback for parent component first
    onAudioReady?.(wavBlob);
    
    // Then handle download after a brief delay to ensure processing is complete
    setTimeout(() => {
      // Trigger download for testing
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice_recording_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mock additional processing time
      setTimeout(() => {
        setVoiceState('idle');
        setDebugInfo('Voice mode ready - Click to start listening');
        isProcessingRef.current = false; // Reset flag when completely done
      }, 4000); // 4 more seconds
    }, 1000); // 1 second delay before download
    
  }, [createWavBlob, onAudioReady]);
  
  // VAD configuration
  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      console.log('Speech started');
      // Only transition to listening if we're in starting state
      if (voiceState === 'starting') {
        setDebugInfo('Listening... (speak now)');
        setIsRecording(true);
        setVoiceState('listening');
      }
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    },
    onSpeechEnd: (audio: Float32Array) => {
      console.log('Speech chunk received:', audio.length, 'samples');
      
      // Store chunk in both state and ref for processing
      setAudioChunks(prev => {
        const newChunks = [...prev, audio];
        console.log('Total chunks now:', newChunks.length);
        return newChunks;
      });
      
      // Also store in ref for immediate access during processing
      chunksToProcessRef.current = [...chunksToProcessRef.current, audio];
      
      // Set timeout for silence detection (3 seconds)
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = setTimeout(() => {
        console.log('Silence detected - processing recording');
        
        // Copy current chunks to processing ref before processing
        chunksToProcessRef.current = [...audioChunks, audio]; // Include the latest chunk
        
        // Pause VAD first, then process
        vad.pause();
        
        // Process the recording
        processAudioRecording();
      }, 2000); // 2 seconds of silence
    },
    onVADMisfire: () => {
      console.log('VAD misfire - speech segment too short');
      setDebugInfo('Speech too short - keep talking...');
    },
    // VAD sensitivity settings
    positiveSpeechThreshold: 0.6, // Higher = less sensitive to start
    negativeSpeechThreshold: 0.3, // Lower = more sensitive to end
    minSpeechFrames: 3, // Minimum frames for valid speech
    preSpeechPadFrames: 4, // Padding before speech
    redemptionFrames: 8, // Frames to wait before ending
  });
  
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
        if (vad.userSpeaking) {
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
  }, [voiceState, vad.userSpeaking]);
  
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
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle click to start/stop
  const handleSphereClick = useCallback(() => {
    switch (voiceState) {
      case 'idle':
        setDebugInfo('Ready - start speaking...');
        setAudioChunks([]); // Clear previous chunks
        chunksToProcessRef.current = []; // Clear processing chunks
        setVoiceState('listening'); // Go directly to listening state
        isProcessingRef.current = false; // Reset processing flag
        vad.start();
        break;
        
      case 'starting':
      case 'listening':
        setDebugInfo('Stopping...');
        
        // Copy current chunks for processing
        setAudioChunks(currentChunks => {
          chunksToProcessRef.current = [...currentChunks];
          return currentChunks;
        });
        
        if (chunksToProcessRef.current.length > 0) {
          // Pause VAD before processing
          vad.pause();
          processAudioRecording();
        } else {
          vad.pause();
          setVoiceState('idle');
          setDebugInfo('Voice mode ready - Click to start listening');
        }
        break;
        
      case 'processing':
        // Can't interrupt processing
        console.log('Cannot interrupt processing');
        break;
        
      case 'waiting_response':
        // Could add ability to cancel here
        break;
    }
  }, [voiceState, vad, processAudioRecording]);
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getCurrentSize: () => 160 * currentScaleRef.current,
    startListening: () => {
      if (voiceState === 'idle') {
        handleSphereClick();
      }
    },
    stopListening: () => {
      vad.pause();
      setVoiceState('idle');
      setIsRecording(false);
      isProcessingRef.current = false; // Reset processing flag
      chunksToProcessRef.current = []; // Clear processing chunks
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    },
  }));
  
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
    cursor: voiceState === 'processing' ? 'default' : 'pointer',
    userSelect: 'none',
  };
  
  // Debug info for current state
  const getStateDisplay = () => {
    switch (voiceState) {
      case 'idle': return 'Ready - Click to start';
      case 'starting': return 'Starting microphone...';
      case 'listening': return isRecording ? 'Recording...' : 'Listening for speech...';
      case 'processing': return 'Processing audio...';
      case 'waiting_response': return 'Waiting for AI response...';
      default: return 'Unknown state';
    }
  };
  
  return (
    <motion.div
      key="voice-mode"
      style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Sphere container that rotates */}
      <div
        ref={sphereRef}
        style={sphereStyle}
        onClick={handleSphereClick}
      />
      
      {/* Debug overlay - positioned absolutely so it doesn't rotate with sphere */}
      <div style={{
        position: 'absolute',
        top: '200px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}>
        <div>{getStateDisplay()}</div>
        <div>Chunks: {audioChunks.length}</div>
        <div>VAD: {vad.listening ? 'ON' : 'OFF'} | Speaking: {vad.userSpeaking ? 'YES' : 'NO'}</div>
        {vad.errored && <div style={{color: 'red'}}>Error: {typeof vad.errored === 'string' ? vad.errored : JSON.stringify(vad.errored)}</div>}
      </div>
    </motion.div>
  );
});

VoiceMode.displayName = 'VoiceMode';

export default VoiceMode;