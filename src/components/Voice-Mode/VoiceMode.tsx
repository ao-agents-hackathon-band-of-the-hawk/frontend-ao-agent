// src/components/VoiceMode.tsx
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useVoiceLogic } from '../../hooks/useVoiceLogic';
import { useVoiceAnimation } from '../../hooks/useVoiceAnimation';
import SpeechResponseModal from './SpeechResponseModal';

interface VoiceModeProps {
  imageUrl?: string;
  onAudioReady?: (audioBlob: Blob) => void;
}

interface VoiceModeRef {
  getCurrentSize: () => number;
  startListening: () => void;
  stopListening: () => void;
}

// Global variable to store the debug callback
declare global {
  interface Window {
    voiceDebugCallback?: (debugData: {
      state: string;
      chunks: number;
      vadStatus: string;
      speaking: string;
      error?: string | null;
    }) => void;
  }
}

const VoiceMode = forwardRef<VoiceModeRef, VoiceModeProps>(({ imageUrl, onAudioReady }, ref) => {
  const theme = useTheme();
  
  // Use the voice logic hook
  const {
    voiceState,
    audioChunks,
    isModalOpen,
    speechResponse,
    isProcessingAPI,
    vad,
    handleSphereClick,
    handleModalClose,
    getStateDisplay,
    startListening,
    stopListening,
  } = useVoiceLogic({ onAudioReady });
  
  // Use the animation hook
  const { sphereRef, getCurrentSize } = useVoiceAnimation({
    voiceState,
    userSpeaking: vad.userSpeaking,
  });
  
  // Update parent with debug info using global callback
  useEffect(() => {
    if (window.voiceDebugCallback) {
      window.voiceDebugCallback({
        state: getStateDisplay(),
        chunks: audioChunks.length,
        vadStatus: vad.listening ? 'ON' : 'OFF',
        speaking: vad.userSpeaking ? 'YES' : 'NO',
        error: vad.errored ? (typeof vad.errored === 'string' ? vad.errored : JSON.stringify(vad.errored)) : null
      });
    }
  }, [audioChunks.length, vad.listening, vad.userSpeaking, vad.errored, voiceState]); // Add voiceState and remove getStateDisplay
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getCurrentSize,
    startListening,
    stopListening,
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
  
  return (
    <>
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
      </motion.div>

      {/* Speech Response Modal */}
      <SpeechResponseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        response={speechResponse}
        isLoading={isProcessingAPI}
      />
    </>
  );
});

VoiceMode.displayName = 'VoiceMode';

export default VoiceMode;