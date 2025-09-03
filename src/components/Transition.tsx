// src/components/Transition.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import VoiceMode from './Voice-Mode/VoiceMode';
import TextMode from './Text-Mode/TextMode';
import ChatArea from './Chat-Area/ChatArea';

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
  onAudioReady?: (audioBlob: Blob) => void;
  conversations: Conversation[];
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
  sessionId: string;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onBackToVoiceMode: () => void;
}

const Transition: React.FC<TransitionProps> = ({ 
  isTextMode, 
  isChatMode,
  onTransitionComplete,
  imageUrl,
  inputValue,
  setInputValue,
  messages,
  onAudioReady,
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory,
  sessionId,
  addMessage,
  onBackToVoiceMode
}) => {
  const theme = useTheme();
  const [transitionStage, setTransitionStage] = useState<'voice' | 'expanding' | 'text'>('voice');

  const voiceRef = useRef<{ getCurrentSize: () => number; startListening: () => void; stopListening: () => void }>(null);

  // Voice messages for chat area display
  const [voiceMessages, setVoiceMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Dynamic transition starting values
  const [transitionStartSize, setTransitionStartSize] = useState(160);

  // Handle conversation updates from voice interactions
  const handleVoiceConversationUpdate = () => {
    console.log('Voice conversation updated, triggering parent refresh...');
    
    const stored = localStorage.getItem('chat-conversations');
    if (stored) {
      try {
        const parsedConversations = JSON.parse(stored) as Conversation[];
        parsedConversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        window.dispatchEvent(new CustomEvent('conversationsUpdated', { 
          detail: parsedConversations 
        }));
      } catch (error) {
        console.error('Error parsing conversations:', error);
      }
    }
  };

  // Voice conversation management functions
  const loadVoiceConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      const messages = convo.pairs.flatMap(pair => [
        { role: 'user' as const, content: pair["0"] },
        pair["1"] ? { role: 'assistant' as const, content: pair["1"] } : null
      ]).filter((m): m is { role: 'user' | 'assistant'; content: string } => m !== null);
      
      setVoiceMessages(messages);
      setIsShowHistory(false);
    }
  };

  const deleteVoiceConversation = (id: string) => {
    deleteConversation(id);
  };

  const clearAllVoiceConversations = () => {
    clearAllConversations();
  };

  useEffect(() => {
    if (isTextMode) {
      let currentSize = 160;
      if (voiceRef.current) {
        currentSize = voiceRef.current.getCurrentSize();
      }
      
      setTransitionStartSize(currentSize);
      setTransitionStage('expanding');
      
      const timer = setTimeout(() => {
        setTransitionStage('text');
        onTransitionComplete?.();
      }, 1800);
      
      return () => clearTimeout(timer);
    } else {
      setTransitionStage('voice');
      setTransitionStartSize(160);
      setVoiceMessages([]);
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

  if (transitionStage === 'voice' && voiceMessages.length > 0) {
    return (
      <div style={containerStyle}>
        <ChatArea
          messages={voiceMessages}
          inputValue=""
          setInputValue={() => {}}
          onSend={() => {}}
          imageUrl={imageUrl}
          conversations={conversations}
          loadConversation={loadVoiceConversation}
          deleteConversation={deleteVoiceConversation}
          clearAllConversations={clearAllVoiceConversations}
          isShowHistory={isShowHistory}
          setIsShowHistory={setIsShowHistory}
          onBackToVoiceMode={onBackToVoiceMode} // Pass onBackToVoiceMode to ChatArea
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {transitionStage === 'voice' && (
          <VoiceMode 
            ref={voiceRef} 
            imageUrl={imageUrl} 
            onAudioReady={onAudioReady}
            sessionId={sessionId}
            conversations={conversations}
            loadConversation={loadVoiceConversation}
            deleteConversation={deleteVoiceConversation}
            clearAllConversations={clearAllVoiceConversations}
            isShowHistory={isShowHistory}
            setIsShowHistory={setIsShowHistory}
            onConversationUpdate={handleVoiceConversationUpdate}
          />
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
            conversations={conversations}
            loadConversation={loadConversation}
            deleteConversation={deleteConversation}
            clearAllConversations={clearAllConversations}
            isShowHistory={isShowHistory}
            setIsShowHistory={setIsShowHistory}
            sessionId={sessionId}
            addMessage={addMessage}
            onBackToVoiceMode={onBackToVoiceMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transition;