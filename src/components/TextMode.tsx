// src/components/TextMode.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import TextBox from './TextBox';
import ChatArea from './ChatArea';

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
  onSend: () => void;
  conversations: Conversation[];
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
}

const TextMode: React.FC<TextModeProps> = ({ 
  transitionStage, 
  transitionStartSize, 
  imageUrl,
  isChatMode,
  messages,
  inputValue,
  setInputValue,
  onSend,
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory
}) => {
  const theme = useTheme();
  const [textareaHeight, setTextareaHeight] = useState(24);
  const [isInitialTransition, setIsInitialTransition] = useState(true);

  const isExpanding = transitionStage === 'expanding';

  if (isChatMode) {
    return (
      <ChatArea
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={onSend}
        imageUrl={imageUrl}
        conversations={conversations}
        loadConversation={loadConversation}
        deleteConversation={deleteConversation}
        clearAllConversations={clearAllConversations}
        isShowHistory={isShowHistory}
        setIsShowHistory={setIsShowHistory}
      />
    );
  }

  // Dimensions for initial text mode (non-chat)
  const baseWidth = 645;
  const baseHeight = 125;
  const sphereSize = 100;
  const sphereX = 259;
  const paddingX = 47;
  const textMarginRight = '62px';

  // Calculate dynamic container height
  const containerHeight = textareaHeight > 24 
    ? Math.max(baseHeight, textareaHeight + 50)
    : baseHeight;

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
    cursor: 'pointer',
  };

  const handleHeightChange = (height: number) => {
    setTextareaHeight(height);
    if (isInitialTransition && transitionStage === 'text') {
      setIsInitialTransition(false);
    }
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
      {/* Enhanced Chat History Button and Panel */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 20 }}>
        <button 
          onClick={() => setIsShowHistory(!isShowHistory)}
          style={{
            padding: '8px 16px',
            background: theme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Chat History ({conversations.length})
        </button>
        {isShowHistory && (
          <div 
            style={{
              position: 'absolute',
              top: '40px',
              left: '0',
              background: 'white',
              padding: '16px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              maxHeight: '400px',
              minWidth: '350px',
              overflowY: 'auto',
              zIndex: 30,
              border: '1px solid #e0e0e0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, color: 'black', fontSize: '14px' }}>Chat History</h4>
              {conversations.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all chat history?')) {
                      clearAllConversations();
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ 
                  color: '#666', 
                  fontStyle: 'italic', 
                  textAlign: 'center', 
                  padding: '20px',
                  fontSize: '13px' 
                }}>
                  No past conversations
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {                conversations.map((convo) => {
                    const firstMessage = convo.pairs[0]?.["0"] || 'Empty conversation';
                    const messageCount = convo.pairs.length;
                    
                    return (
                      <div 
                        key={convo.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          border: '1px solid #eee',
                          borderRadius: '6px',
                          backgroundColor: '#f9f9f9',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9f9f9';
                        }}
                      >
                        <div 
                          onClick={() => loadConversation(convo.id)}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '500', 
                            color: 'black',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}...` : firstMessage}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#666',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                            <span>{new Date(convo.timestamp || 0).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this conversation?')) {
                              deleteConversation(convo.id);
                            }
                          }}
                          style={{
                            marginLeft: '8px',
                            padding: '4px 6px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            flexShrink: 0,
                          }}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input container for initial text mode */}
      <div style={{
        width: `${baseWidth}px`,
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
            width: [transitionStartSize, 118, baseWidth],
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
            padding: transitionStage === 'text' ? `0 ${paddingX}px` : '0',
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
            marginRight={textMarginRight}
            onHeightChange={handleHeightChange}
            value={inputValue}
            onChange={setInputValue}
            onSend={onSend}
          />
        </motion.div>

        {/* Shrinking and moving sphere */}
        <motion.div
          onClick={onSend}
          initial={{ 
            width: transitionStartSize,
            height: transitionStartSize,
            x: 0,
            y: 0,
            scale: 1,
          }}
          animate={{ 
            width: [transitionStartSize, sphereSize, sphereSize], 
            height: [transitionStartSize, sphereSize, sphereSize],
            x: [0, 0, sphereX],
            y: [0, 0, transitionStage === 'text' && textareaHeight > 24 
              ? Math.max(0, (containerHeight - baseHeight) / 2) 
              : 0],
            scale: 1,
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
        />
      </div>
    </motion.div>
  );
};

export default TextMode;