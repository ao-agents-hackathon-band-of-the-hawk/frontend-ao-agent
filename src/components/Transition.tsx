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

// Back to Voice Mode Button Component
interface BackToVoiceModeButtonProps {
  onClick: () => void;
}

const BackToVoiceModeButton: React.FC<BackToVoiceModeButtonProps> = ({ onClick }) => {
  const theme = useTheme();

  return (
    <div style={{ position: 'fixed', top: '20px', left: '80px', zIndex: 30 }}>
      <button 
        onClick={onClick}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: theme.colors.accent,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        title="Back to Voice Mode"
      >
        {/* Microphone Icon SVG */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>
    </div>
  );
};

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
    // Trigger a refresh of conversations in the parent component
    // This is a bit of a workaround - we'll trigger the parent to reload from localStorage
    console.log('Voice conversation updated, triggering parent refresh...');
    
    // Force parent to reload conversations from localStorage
    const stored = localStorage.getItem('chat-conversations');
    if (stored) {
      try {
        const parsedConversations = JSON.parse(stored) as Conversation[];
        parsedConversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // We need a way to update the parent's conversations state
        // Since we don't have direct access, let's dispatch a custom event
        window.dispatchEvent(new CustomEvent('conversationsUpdated', { 
          detail: parsedConversations 
        }));
      } catch (error) {
        console.error('Error parsing conversations:', error);
      }
    }
  };

  // Voice conversation management functions - now using same conversations array
  const loadVoiceConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      // Convert pairs to messages format
      const messages = convo.pairs.flatMap(pair => [
        { role: 'user' as const, content: pair["0"] },
        pair["1"] ? { role: 'assistant' as const, content: pair["1"] } : null
      ]).filter((m): m is { role: 'user' | 'assistant'; content: string } => m !== null);
      
      setVoiceMessages(messages);
      setIsShowHistory(false); // Close the history panel
    }
  };

  const deleteVoiceConversation = (id: string) => {
    deleteConversation(id); // Use the existing deleteConversation function
  };

  const clearAllVoiceConversations = () => {
    clearAllConversations(); // Use the existing clearAllConversations function
  };

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
      }, 1800);
      
      return () => clearTimeout(timer);
    } else {
      setTransitionStage('voice');
      setTransitionStartSize(160);
      // Reset voice history when returning to voice mode
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

  // If showing voice history with messages, render ChatArea 
  if (transitionStage === 'voice' && voiceMessages.length > 0) {
    return (
      <div style={containerStyle}>
        {/* Back to Voice Mode Button */}
        <BackToVoiceModeButton 
          onClick={() => {
            setVoiceMessages([]);
            setIsShowHistory(false);
          }}
        />
        
        <ChatArea
          messages={voiceMessages}
          inputValue="" // Voice history is read-only
          setInputValue={() => {}} // No input in voice history
          onSend={() => {}} // No sending in voice history
          imageUrl={imageUrl}
          conversations={conversations}
          loadConversation={loadVoiceConversation}
          deleteConversation={deleteVoiceConversation}
          clearAllConversations={clearAllVoiceConversations}
          isShowHistory={isShowHistory}
          setIsShowHistory={setIsShowHistory}
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