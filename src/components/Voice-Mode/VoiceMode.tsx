// src/components/Voice-Mode/VoiceMode.tsx
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useVoiceLogic } from '../../hooks/useVoiceLogic';
import { useVoiceAnimation } from '../../hooks/useVoiceAnimation';
import ChatHistoryButton from '../Chat-Area/ChatHistoryButton';

interface VoiceModeProps {
  imageUrl?: string;
  onAudioReady?: (audioBlob: Blob) => void;
  sessionId: string; // Session ID for maintaining conversation continuity
  // Standard conversation props (same as text mode)
  conversations: Array<{ id: string; pairs: Array<{ "0": string; "1": string }>; timestamp?: number }>;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
  onConversationUpdate?: (conversations: Array<{
    id: string;
    pairs: Array<{ "0": string; "1": string }>;
    timestamp?: number;
  }>) => void; // Callback to update parent conversations
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

const VoiceMode = forwardRef<VoiceModeRef, VoiceModeProps>(({ 
  imageUrl, 
  onAudioReady,
  sessionId,
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory,
  onConversationUpdate
}, ref) => {
  const theme = useTheme();
  
  // Use the voice logic hook - now with session ID and conversation update callback
  const {
    voiceState,
    audioChunks,
    vad,
    handleSphereClick,
    getStateDisplay,
    startListening,
    stopListening,
  } = useVoiceLogic({ onAudioReady, sessionId, onConversationUpdate });
  
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
  }, [audioChunks.length, vad.listening, vad.userSpeaking, vad.errored, voiceState]);
  
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
      {/* Voice History Button - using same conversations as text mode */}
      <ChatHistoryButton
        conversations={conversations}
        isShowHistory={isShowHistory}
        onToggleHistory={() => setIsShowHistory(!isShowHistory)}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllConversations}
      />

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
    </>
  );
});

VoiceMode.displayName = 'VoiceMode';

export default VoiceMode;