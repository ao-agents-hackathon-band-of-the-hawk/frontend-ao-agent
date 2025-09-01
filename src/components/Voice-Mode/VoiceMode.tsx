// src/components/VoiceMode.tsx
import React, { forwardRef, useImperativeHandle } from 'react';
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