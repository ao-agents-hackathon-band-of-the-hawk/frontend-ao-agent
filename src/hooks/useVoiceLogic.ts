// src/hooks/useVoiceLogic.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { SpeechService } from '../services/speechService';
import type { SpeechResponse } from '../services/speechService';

export type VoiceState = 'idle' | 'starting' | 'listening' | 'processing' | 'waiting_response' | 'awakening';

interface UseVoiceLogicProps {
  onAudioReady?: (audioBlob: Blob) => void;
}

export const useVoiceLogic = ({ onAudioReady }: UseVoiceLogicProps) => {
  // State management
  const [voiceState, setVoiceState] = useState<VoiceState>('awakening'); // Start with awakening
  const voiceStateRef = useRef<VoiceState>('awakening');
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [, setDebugInfo] = useState('Voice mode ready');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speechResponse, setSpeechResponse] = useState<SpeechResponse | undefined>();
  const [isProcessingAPI, setIsProcessingAPI] = useState(false);
  
  // Add a ref to track if processing is already happening
  const isProcessingRef = useRef(false);
  // Store chunks to process separately from state
  const chunksToProcessRef = useRef<Float32Array[]>([]);
  
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio processing
  const sampleRate = 16000; // VAD outputs at 16kHz
  
  // Update ref when state changes
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);
  
  // Awakening animation after entering voice mode
  useEffect(() => {
    // Start in idle, then trigger a single awakening flash
    setVoiceState('idle');
    setDebugInfo('Voice mode ready - Click to start listening');
    
    // Small delay then trigger the awakening flash
    const flashTimer = setTimeout(() => {
      setVoiceState('awakening');
      const returnTimer = setTimeout(() => {
        setVoiceState('idle');
      }, 200); // 0.2 seconds total animation duration
      return () => clearTimeout(returnTimer);
    }, 100); // Brief delay after entering voice mode

    return () => clearTimeout(flashTimer);
  }, []); // Empty dependency array means it runs once on mount
  
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
  const processAudioRecording = useCallback(async () => {
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
    
    // Download the audio file (keep existing functionality)
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_recording_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // **NEW**: Send to speech API
    try {
      setVoiceState('waiting_response');
      setIsProcessingAPI(true);
      setIsModalOpen(true); // Show modal with loading state
      setSpeechResponse(undefined);
      
      console.log('Sending audio to speech API...');
      const response = await SpeechService.transcribeAudio(wavBlob);
      
      console.log('Speech API response:', response);
      setSpeechResponse(response);
      
      // Read out the AI response
      if (response.result) {
        // Keep the waiting_response state during TTS processing
        await SpeechService.speakText(response.result);
      }
      
    } catch (error) {
      console.error('Speech API error:', error);
      setSpeechResponse({
        transcription: 'Error processing speech',
        result: `Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      // Only reset to idle after everything is complete (including TTS)
      setIsProcessingAPI(false);
      setVoiceState('idle');
      setDebugInfo('Voice mode ready - Click to start listening');
      isProcessingRef.current = false; // Reset flag when completely done
    }
    
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
      }, 3000); // 3 seconds of silence
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
    redemptionFrames: 10, // Frames to wait before ending
  });
  
  // Handle click to start/stop
  const handleSphereClick = useCallback(() => {
    switch (voiceState) {
      case 'awakening':
        // Don't allow interaction during awakening
        return;
        
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
  
  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSpeechResponse(undefined);
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);
  
  // Debug info for current state
  const getStateDisplay = () => {
    switch (voiceState) {
      case 'awakening': return 'Awakening...';
      case 'idle': return 'Ready - Click to start';
      case 'starting': return 'Starting microphone...';
      case 'listening': return isRecording ? 'Recording...' : 'Listening for speech...';
      case 'processing': return 'Processing audio...';
      case 'waiting_response': return 'Getting AI response...';
      default: return 'Unknown state';
    }
  };
  
  // Imperative handle methods
  const startListening = useCallback(() => {
    if (voiceState === 'idle') {
      handleSphereClick();
    }
  }, [voiceState, handleSphereClick]);
  
  const stopListening = useCallback(() => {
    vad.pause();
    setVoiceState('idle');
    setIsRecording(false);
    isProcessingRef.current = false; // Reset processing flag
    chunksToProcessRef.current = []; // Clear processing chunks
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, [vad]);
  
  return {
    voiceState,
    audioChunks,
    isRecording,
    isModalOpen,
    speechResponse,
    isProcessingAPI,
    vad,
    handleSphereClick,
    handleModalClose,
    getStateDisplay,
    startListening,
    stopListening,
  };
};