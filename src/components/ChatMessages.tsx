// src/components/ChatMessages.tsx
import React from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  chatMaxHeight: number;
  containerPadding: number;
  messageGap: number;
  topBlurHeight: number;
  bottomBlurHeight: number;
  colors: {
    userBubble: string;
    assistantBubble: string;
    userText: string;
    assistantText: string;
    background: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  messagePadding: string;
  maxMessageWidth: string;
  baseWidth: number;
  onScroll?: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  chatMaxHeight,
  containerPadding,
  messageGap,
  topBlurHeight,
  bottomBlurHeight,
  colors,
  typography,
  messagePadding,
  maxMessageWidth,
  baseWidth,
  onScroll,
  chatContainerRef,
}) => {
  // Function to calculate border radius based on content
  const calculateBorderRadius = (content: string): string => {
    const lines = content.split('\n').length;
    
    if (content.length <= 20 && lines === 1) {
      return '25px';
    }
    
    if (lines === 1 && content.length <= 50) {
      return '20px';
    }
    
    if (lines === 1 && content.length <= 100) {
      return '18px';
    }
    
    if (lines === 1) {
      return '16px';
    }
    
    if (lines <= 3) {
      return '14px';
    }
    
    if (lines <= 5) {
      return '12px';
    }
    
    return '10px';
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: `${chatMaxHeight}px`,
        marginTop: '35px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Top fade overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${topBlurHeight}px`,
          background: `linear-gradient(to bottom, ${colors.background} 0%, rgba(246, 246, 246, 0.4) 50%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      
      {/* Scrollable chat messages container */}
      <div
        ref={chatContainerRef}
        className="chat-container"
        style={{
          width: `${baseWidth}px`,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${containerPadding}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${messageGap}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onScroll={onScroll}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? colors.userBubble : colors.assistantBubble,
              color: msg.role === 'user' ? colors.userText : colors.assistantText,
              padding: messagePadding,
              borderRadius: calculateBorderRadius(msg.content),
              maxWidth: maxMessageWidth,
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize,
              lineHeight: typography.lineHeight,
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            {msg.content}
          </div>
        ))}
      </div>
      
      {/* Bottom fade overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${bottomBlurHeight}px`,
          background: `linear-gradient(to top, ${colors.background} 0%, rgba(246, 246, 246, 0.4) 50%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default ChatMessages;