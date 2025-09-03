// src/hooks/useVoiceLogic.ts - Unified Storage Version
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { SpeechService } from '../services/speechService';

export type VoiceState = 'idle' | 'starting' | 'listening' | 'processing' | 'waiting_response' | 'awakening';

interface UseVoiceLogicProps {
  onAudioReady?: (audioBlob: Blob) => void;
  sessionId: string; // Session ID for maintaining continuous conversation
  onConversationUpdate?: (conversations: Array<{
    id: string;
    pairs: Array<{ "0": string; "1": string }>;
    timestamp?: number;
  }>) => void; // Callback to update parent conversations
}

export const useVoiceLogic = ({ onAudioReady, sessionId, onConversationUpdate }: UseVoiceLogicProps) => {
  // State management
  const [voiceState, setVoiceState] = useState<VoiceState>('awakening');
  const voiceStateRef = useRef<VoiceState>('awakening');
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [, setDebugInfo] = useState('Voice mode ready');
  
  // Add a ref to track if processing is already happening
  const isProcessingRef = useRef(false);
  // Store chunks to process separately from state
  const chunksToProcessRef = useRef<Float32Array[]>([]);
  
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio processing
  const sampleRate = 16000; // VAD outputs at 16kHz
  
  // Function to save voice interaction directly to localStorage and notify parent
  const saveVoiceInteraction = useCallback((userMessage: string, aiResponse: string) => {
    if (!userMessage || !aiResponse) return;
    
    try {
      // Get current conversations from localStorage (unified storage)
      const stored = localStorage.getItem('chat-conversations');
      const currentConversations = stored ? JSON.parse(stored) : [];
      
      // Look for existing voice conversation for this session
      const existingVoiceConvoIndex = currentConversations.findIndex((c: any) => c.id === `voice_${sessionId}`);
      
      let updatedConversations;
      
      if (existingVoiceConvoIndex !== -1) {
        // Update existing voice conversation
        updatedConversations = [...currentConversations];
        const existingConvo = updatedConversations[existingVoiceConvoIndex];
        updatedConversations[existingVoiceConvoIndex] = {
          ...existingConvo,
          pairs: [...existingConvo.pairs, { "0": userMessage, "1": aiResponse }],
          timestamp: Date.now()
        };
        // Move to top (newest first)
        const updatedConvo = updatedConversations.splice(existingVoiceConvoIndex, 1)[0];
        updatedConversations.unshift(updatedConvo);
      } else {
        // Create new voice conversation for this session
        const newConversation = {
          id: `voice_${sessionId}`,
          pairs: [{ "0": userMessage, "1": aiResponse }],
          timestamp: Date.now(),
          sessionId: sessionId
        };
        updatedConversations = [newConversation, ...currentConversations];
      }
      
      // Sort by timestamp (newest first)
      updatedConversations.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      
      // Save to localStorage
      localStorage.setItem('chat-conversations', JSON.stringify(updatedConversations));
      console.log('Voice interaction saved to unified storage:', updatedConversations.length, 'total conversations');
      
      // Notify parent component of the update
      if (onConversationUpdate) {
        onConversationUpdate(updatedConversations);
      }
      
    } catch (error) {
      console.error('Error saving voice interaction to unified storage:', error);
      
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const stored = localStorage.getItem('chat-conversations');
          if (stored) {
            const conversations = JSON.parse(stored);
            const reducedConversations = conversations.slice(0, Math.floor(conversations.length * 0.8));
            localStorage.setItem('chat-conversations', JSON.stringify(reducedConversations));
            console.log('Storage quota exceeded. Reduced conversations to:', reducedConversations.length);
            
            // Retry saving the voice interaction
            saveVoiceInteraction(userMessage, aiResponse);
          }
        } catch (retryError) {
          console.error('Failed to handle storage quota exceeded:', retryError);
        }
      }
    }
  }, [sessionId, onConversationUpdate]);
  
  // Update ref when state changes
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);
  
  // Awakening animation after entering voice mode
  useEffect(() => {
    setVoiceState('idle');
    setDebugInfo('Voice mode ready - Click to start listening');
    
    const flashTimer = setTimeout(() => {
      setVoiceState('awakening');
      const returnTimer = setTimeout(() => {
        setVoiceState('idle');
      }, 200);
      return () => clearTimeout(returnTimer);
    }, 100);

    return () => clearTimeout(flashTimer);
  }, []);
  
  // Convert Float32Array to WAV blob
  const createWavBlob = useCallback((audioData: Float32Array[]): Blob => {
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
    
    let offset16 = 44;
    for (let i = 0; i < concatenated.length; i++) {
      const sample = Math.max(-1, Math.min(1, concatenated[i]));
      view.setInt16(offset16, sample * 0x7FFF, true);
      offset16 += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }, [sampleRate]);
  
  // VAD configuration
  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      console.log('Speech started');
      if (voiceState === 'starting') {
        setDebugInfo('Listening... (speak now)');
        setIsRecording(true);
        setVoiceState('listening');
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    },
    onSpeechEnd: (audio: Float32Array) => {
      console.log('Speech chunk received:', audio.length, 'samples');
      
      setAudioChunks(prev => {
        const newChunks = [...prev, audio];
        console.log('Total chunks now:', newChunks.length);
        return newChunks;
      });
      
      chunksToProcessRef.current = [...chunksToProcessRef.current, audio];
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = setTimeout(() => {
        console.log('Silence detected - processing recording');
        
        chunksToProcessRef.current = [...audioChunks, audio];
        
        vad.pause();
        processAudioRecording();
      }, 3000);
    },
    onVADMisfire: () => {
      console.log('VAD misfire - speech segment too short');
      setDebugInfo('Speech too short - keep talking...');
    },
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.3,
    minSpeechFrames: 3,
    preSpeechPadFrames: 4,
    redemptionFrames: 10,
  });

  // Process completed audio recording
  const processAudioRecording = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log('Already processing audio, skipping...');
      return;
    }
    
    if (chunksToProcessRef.current.length === 0) {
      console.log('No audio chunks to process');
      return;
    }
    
    isProcessingRef.current = true;
    
    setIsRecording(false);
    setVoiceState('processing');
    setDebugInfo('Processing audio...');
    
    console.log(`Processing ${chunksToProcessRef.current.length} audio chunks...`);
    
    const wavBlob = createWavBlob(chunksToProcessRef.current);
    setDebugInfo(`Audio ready: ${(wavBlob.size / 1024).toFixed(1)}KB`);
    
    chunksToProcessRef.current = [];
    setAudioChunks([]);
    
    onAudioReady?.(wavBlob);
    
    // Send to speech API
    try {
      setVoiceState('waiting_response');
      
      console.log('Sending audio to speech API...');
      const response = await SpeechService.transcribeAudio(wavBlob);
      
      console.log('Speech API response:', response);
      
      // Save voice interaction immediately after getting response (before TTS)
      if (response.transcription && response.result) {
        console.log('Saving voice interaction to unified storage...');
        saveVoiceInteraction(response.transcription, response.result);
      }
      
      // Read out the AI response with interruption callback (after saving)
      if (response.result) {
        await SpeechService.speakText(response.result, () => {
          // Interruption callback - start new recording immediately
          console.log('TTS was interrupted, starting new recording session...');
          setDebugInfo('Interrupted - starting new recording...');
          setAudioChunks([]);
          chunksToProcessRef.current = [];
          setVoiceState('listening');
          isProcessingRef.current = false;
          vad.start(); // Start VAD for new recording
        });
      }
      
    } catch (error) {
      console.error('Speech API error:', error);
    } finally {
      // Only set to idle if we're not in an interrupted state (listening)
      if (voiceStateRef.current !== 'listening') {
        setVoiceState('idle');
        setDebugInfo('Voice mode ready - Click to start listening');
      }
      isProcessingRef.current = false;
    }
    
  }, [createWavBlob, onAudioReady, saveVoiceInteraction, vad]);
  
  // Handle click to start/stop
  const handleSphereClick = useCallback(() => {
    switch (voiceState) {
      case 'awakening':
        return;
        
      case 'idle':
        setDebugInfo('Ready - start speaking...');
        setAudioChunks([]);
        chunksToProcessRef.current = [];
        setVoiceState('listening');
        isProcessingRef.current = false;
        vad.start();
        break;
        
      case 'starting':
      case 'listening':
        setDebugInfo('Stopping...');
        
        setAudioChunks(currentChunks => {
          chunksToProcessRef.current = [...currentChunks];
          return currentChunks;
        });
        
        if (chunksToProcessRef.current.length > 0) {
          vad.pause();
          processAudioRecording();
        } else {
          vad.pause();
          setVoiceState('idle');
          setDebugInfo('Voice mode ready - Click to start listening');
        }
        break;
        
      case 'processing':
        console.log('Cannot interrupt processing');
        break;
        
      case 'waiting_response':
        break;
    }
  }, [voiceState, vad, processAudioRecording]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);
  
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
  
  const startListening = useCallback(() => {
    if (voiceState === 'idle') {
      handleSphereClick();
    }
  }, [voiceState, handleSphereClick]);
  
  const stopListening = useCallback(() => {
    vad.pause();
    setVoiceState('idle');
    setIsRecording(false);
    isProcessingRef.current = false;
    chunksToProcessRef.current = [];
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, [vad]);
  
  return {
    voiceState,
    audioChunks,
    isRecording,
    vad,
    handleSphereClick,
    getStateDisplay,
    startListening,
    stopListening,
  };
};