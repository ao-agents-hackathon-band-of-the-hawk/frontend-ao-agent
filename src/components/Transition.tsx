// src/components/Transition.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import VoiceActivity from './VoiceActivity';
import TextMode from './TextMode';

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface TransitionProps {
  isTextMode: boolean;
  isChatMode: boolean;
  onTransitionComplete?: () => void;
  imageUrl?: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onSend: () => void;
  conversations: Conversation[];
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
}

const Transition: React.FC<TransitionProps> = ({ 
  isTextMode, 
  isChatMode,
  onTransitionComplete,
  imageUrl,
  inputValue,
  setInputValue,
  messages,
  onSend,
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory
}) => {
  const theme = useTheme();
  const [transitionStage, setTransitionStage] = useState<'voice' | 'expanding' | 'text'>('voice');

  const voiceRef = useRef<{ getCurrentSize: () => number }>(null);

  // Dynamic transition starting values
  const [transitionStartSize, setTransitionStartSize] = useState(160);

  useEffect(() => {
    if (isTextMode) {
      // Capture current voice sphere state before transition
      let currentSize = 160;
      if (voiceRef.current) {
        currentSize = voiceRef.current.getCurrentSize();
      }
      
      setTransitionStartSize(currentSize);
      setTransitionStage('expanding');
      
      // Complete transition to text mode after animation
      const timer = setTimeout(() => {
        setTransitionStage('text');
        onTransitionComplete?.();
      }, 1800); // Animation duration
      
      return () => clearTimeout(timer);
    } else {
      setTransitionStage('voice');
      setTransitionStartSize(160);
    }
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

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {transitionStage === 'voice' && (
          <VoiceActivity ref={voiceRef} imageUrl={imageUrl} />
        )}

        {(transitionStage === 'expanding' || transitionStage === 'text') && (
          <TextMode
            transitionStage={transitionStage}
            transitionStartSize={transitionStartSize}
            imageUrl={imageUrl}
            isChatMode={isChatMode}
            messages={messages}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSend={onSend}
            conversations={conversations}
            loadConversation={loadConversation}
            deleteConversation={deleteConversation}
            clearAllConversations={clearAllConversations}
            isShowHistory={isShowHistory}
            setIsShowHistory={setIsShowHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transition;