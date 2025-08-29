// src/components/ChatArea.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import TextBox from './TextBox';

interface ChatAreaProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  imageUrl?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  inputValue,
  setInputValue,
  onSend,
  imageUrl,
}) => {
  const theme = useTheme();
  const [textareaHeight, setTextareaHeight] = useState(24);
  const [chatMaxHeight, setChatMaxHeight] = useState(600); // Default fallback
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dimensions for chat mode
  const baseWidth = 800; // 645 * 1.2
  const baseHeight = 100; // 125 * 0.9
  const sphereSize = 80;
  const sphereX = 349; // 259 * 1.2
  const paddingX = 56.4; // 47 * 1.2
  const textMarginRight = '74.4'; // 62 * 1.2

  // Calculate dynamic container height
  const containerHeight = textareaHeight > 24 
    ? Math.max(baseHeight, textareaHeight + 45)
    : baseHeight;

  // Calculate available height for chat messages
  useEffect(() => {
    const calculateChatHeight = () => {
      const viewportHeight = window.innerHeight;
      
      // Account for:
      // - Container height (textbox area)
      // - Bottom margin (80px)
      // - Additional padding/spacing (40px for safety)
      const textboxAreaHeight = containerHeight + 80 + 40;
      
      // Available height for chat messages
      const availableHeight = viewportHeight - textboxAreaHeight;
      
      // Set minimum height of 200px, maximum of calculated available height
      const newMaxHeight = Math.max(200, availableHeight);
      
      setChatMaxHeight(newMaxHeight);
    };

    // Calculate on mount and window resize
    calculateChatHeight();
    window.addEventListener('resize', calculateChatHeight);
    
    return () => {
      window.removeEventListener('resize', calculateChatHeight);
    };
  }, [containerHeight]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sphereStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: imageUrl
      ? `linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.1)), url(${imageUrl})`
      : `linear-gradient(135deg, ${theme.colors.accent}, #DBE0C3)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'absolute',
    zIndex: 2,
    cursor: 'pointer',
  };

  const handleHeightChange = (height: number) => {
    setTextareaHeight(height);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // Changed from flex-end
        height: '100vh', // Full viewport height
        width: '100%',
        fontFamily: theme.typography.fontFamily.primary,
        overflow: 'hidden', // Prevent overall container from scrolling
      }}
    >
      {/* Chat messages container with constrained height */}
      <div
        ref={chatContainerRef}
        style={{
          width: `${baseWidth}px`,
          maxHeight: `${chatMaxHeight}px`,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.accent}60 transparent`,
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? theme.colors.accent : '#e0e0e0',
              color: msg.role === 'user' ? 'white' : 'black',
              padding: '10px 15px',
              borderRadius: '15px',
              maxWidth: '80%',
              fontFamily: theme.typography.fontFamily.primary,
              fontSize: `${theme.typography.fontSize.base}px`,
              lineHeight: '1.5',
              wordWrap: 'break-word', // Ensure long messages wrap properly
            }}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Fixed textbox area at bottom */}
      <div
        style={{
          position: 'fixed', // Fixed positioning to stay at bottom
          bottom: '80px', // Distance from bottom of viewport
          left: '50%',
          transform: 'translateX(-50%)', // Center horizontally
          width: `${baseWidth}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10, // Ensure it stays above chat messages
        }}
      >
        {/* Static background container */}
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${containerHeight}px`,
            borderRadius: '62px',
            background: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'flex-start',
            padding: `0 ${paddingX}px`,
            position: 'absolute',
            zIndex: 1,
          }}
        >
          <TextBox
            isVisible={true}
            marginRight={textMarginRight}
            onHeightChange={handleHeightChange}
            value={inputValue}
            onChange={setInputValue}
            onSend={onSend}
          />
        </div>

        {/* Static sphere */}
        <div
          onClick={onSend}
          style={{
            ...sphereStyle,
            width: `${sphereSize}px`,
            height: `${sphereSize}px`,
            transform: `translateX(${sphereX}px) translateY(${
              textareaHeight > 24 ? Math.max(0, (containerHeight - baseHeight) / 2) : 0
            }px)`,
          }}
        />
      </div>
    </div>
  );
};

export default ChatArea;