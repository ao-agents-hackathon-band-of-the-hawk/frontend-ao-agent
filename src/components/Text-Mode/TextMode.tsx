// src/components/Text-Mode/TextMode.tsx
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useTextMode } from '../../hooks/useTextMode';
import { useChatHistory } from '../../hooks/useChatHistory';
import { useTextLogic } from '../../hooks/useTextLogic';
import TextBox from './TextBox';
import ChatArea from '../Chat-Area/ChatArea';
import ChatHistoryButton from '../Chat-Area/ChatHistoryButton';

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface TextModeProps {
  transitionStage: 'expanding' | 'text';
  transitionStartSize: number;
  imageUrl?: string;
  isChatMode: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
  inputValue: string;
  setInputValue: (value: string) => void;
  conversations: Conversation[];
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
  sessionId: string;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onBackToVoiceMode?: () => void; // Add this prop
}


const TextMode: React.FC<TextModeProps> = ({ 
  transitionStage, 
  transitionStartSize, 
  imageUrl,
  isChatMode,
  messages,
  inputValue,
  setInputValue,
  // onSend, // Remove this unused parameter
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory,
  sessionId,
  addMessage
}) => {
  const theme = useTheme();
  const {
    textareaHeight,
    isInitialTransition,
    containerHeight,
    dimensions,
    handleHeightChange,
  } = useTextMode();

  const {
    handleLoadConversation,
    handleDeleteConversation,
    handleClearAll,
  } = useChatHistory({
    loadConversation,
    deleteConversation,
    clearAllConversations,
  });

  // Text conversation save callback
  const handleTextMessageUpdate = useCallback((userMessage: string, aiResponse: string) => {
    // This will be called when we get a response from the text API
    // The actual saving will be handled by the parent component's conversation management
    console.log('Text message updated:', { userMessage, aiResponse });
  }, []);

  // Use text logic hook
  const { sendMessage, isLoading, error, clearError } = useTextLogic({
    sessionId,
    onMessageUpdate: handleTextMessageUpdate
  });

  // Enhanced send handler that uses the text service
  const handleEnhancedSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    
    // Add user message immediately
    addMessage({ role: 'user', content: userMessage });
    setInputValue('');
    
    // Clear any previous errors
    clearError();

    try {
      // Send to text API and get AI response
      const aiResponse = await sendMessage(userMessage);
      
      // Add AI response
      addMessage({ role: 'assistant', content: aiResponse });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message as AI response
      addMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your message. Please try again.' 
      });
    }
  }, [inputValue, isLoading, addMessage, setInputValue, clearError, sendMessage]);

  const isExpanding = transitionStage === 'expanding';

  if (isChatMode) {
  return (
    <ChatArea
      messages={messages}
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSend={handleEnhancedSend}
      imageUrl={imageUrl}
      conversations={conversations}
      loadConversation={loadConversation}
      deleteConversation={deleteConversation}
      clearAllConversations={clearAllConversations}
      isShowHistory={isShowHistory}
      setIsShowHistory={setIsShowHistory}
      isLoading={isLoading} // Add this line
    />
  );
}

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
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
  };

  const wrappedHandleHeightChange = (height: number) => {
    handleHeightChange(height, transitionStage);
  };

  return (
    <motion.div
      key="transition-mode"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Chat History Button and Panel */}
      <ChatHistoryButton
        conversations={conversations}
        isShowHistory={isShowHistory}
        onToggleHistory={() => setIsShowHistory(!isShowHistory)}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAll}
      />

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          zIndex: 100,
          fontSize: '14px'
        }}>
          {error}
          <button 
            onClick={clearError}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Input container for initial text mode */}
      <div style={{
        width: `${dimensions.baseWidth}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Expanding container - no border, just background and shadow */}
        <motion.div
          initial={{ 
            width: transitionStartSize, 
            height: transitionStartSize, 
            borderRadius: '50%',
          }}
          animate={{ 
            width: [transitionStartSize, 118, dimensions.baseWidth],
            height: [transitionStartSize, 118, containerHeight], 
            borderRadius: ['50%', '50%', '62px'],
          }}
          transition={{
            duration: isExpanding ? 1.8 : 
                     (transitionStage === 'text' && isInitialTransition ? 0.2 : 0),
            times: [0, 0.4, 1],
            ease: [0.2, 0, 0.1, 1],
          }}
          style={{
            position: 'absolute',
            zIndex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            padding: transitionStage === 'text' ? `0 ${dimensions.paddingX}px` : '0',
            height: transitionStage === 'text' ? containerHeight : undefined,
          }}
        >
          {/* Animated background and shadow container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isExpanding ? [0, 0, 0.6, 1] : 
                       transitionStage === 'text' ? 1 : 0,
            }}
            transition={{
              duration: isExpanding ? 1.8 : 
                       transitionStage === 'text' ? 0.2 : 0,
              times: isExpanding ? [0, 0.3, 0.7, 1] : 
                     transitionStage === 'text' ? [0, 1] : [0, 1],
              ease: [0.2, 0, 0.1, 1],
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#ffffff',
              borderRadius: '62px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
              zIndex: -1,
            }}
          />
          {/* Text input area - appears smoothly */}
          <TextBox 
            isVisible={transitionStage === 'text'} 
            marginRight={dimensions.textMarginRight}
            onHeightChange={wrappedHandleHeightChange}
            value={inputValue}
            onChange={setInputValue}
            onSend={handleEnhancedSend} // Use enhanced send handler
          />
        </motion.div>

        {/* Shrinking and moving sphere */}
        <motion.div
          onClick={!isLoading ? handleEnhancedSend : undefined} // Disable click when loading
          initial={{ 
            width: transitionStartSize,
            height: transitionStartSize,
            x: 0,
            y: 0,
            scale: 1,
          }}
          animate={{ 
            width: [transitionStartSize, dimensions.sphereSize, dimensions.sphereSize], 
            height: [transitionStartSize, dimensions.sphereSize, dimensions.sphereSize],
            x: [0, 0, dimensions.sphereX],
            y: [0, 0, transitionStage === 'text' && textareaHeight > 24 
              ? Math.max(0, (containerHeight - dimensions.baseHeight) / 2) 
              : 0],
            scale: isLoading ? 0.95 : 1, // Slightly smaller when loading
          }}
          transition={{
            duration: isExpanding ? 1.8 : 
                     (transitionStage === 'text' && isInitialTransition ? 0 : 0),
            times: [0, 0.4, 1],
            ease: [0.2, 0, 0.1, 1],
          }}
          style={{
            ...sphereStyle,
            zIndex: 2,
          }}
        >
          {/* Loading indicator */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </motion.div>
      </div>
      
      {/* CSS for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default TextMode;