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
  const scrollbarRef = useRef<HTMLDivElement>(null);

  // CUSTOMIZABLE SPACING, LAYOUT AND STYLING PARAMETERS
  const CHAT_CONFIG = {
    // Layout and spacing
    containerPadding: 30,     // Internal padding around chat messages
    messageGap: 15,           // Gap between individual message bubbles
    topMargin: 40,            // Distance from viewport top
    topBlurHeight: 15,        // Height of top fade/blur effect
    bottomBlurHeight: 15,     // Height of bottom fade/blur effect
    bottomMargin: 10,         // Gap between chat area and textbox
    
    // Message bubble styling
    messagePadding: '10px 15px',  // Internal padding of message bubbles
    maxMessageWidth: '80%',       // Maximum width of message bubbles
    
    // Colors
    colors: {
      userBubble: '#ffffff',     // User message background
      assistantBubble: '#ffffff',         // Assistant message background (white like textbox)
      userText: '#11111199',                  // User message text color
      assistantText: '#11111199',             // Assistant message text color
      scrollbar: `#5b652a`,  // Scrollbar color (with transparency)
      scrollbarTrack: 'transparent',      // Scrollbar track color
    },
    
    // Typography
    typography: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: `${theme.typography.fontSize.base}px`,
      lineHeight: '1.5',
    }
  };

  // Dimensions for chat mode
  const baseWidth = 800; // 645 * 1.2
  const baseHeight = 100; // 125 * 0.9
  const sphereSize = 80;
  const sphereX = 349; // 259 * 1.2
  const paddingX = 56.4; // 47 * 1.2
  const textMarginRight = '74.4'; // 62 * 1.2

  // Calculate dynamic container height (expands upwards)
  const containerHeight = textareaHeight > 24 
    ? Math.max(baseHeight, textareaHeight + 45)
    : baseHeight;

  // Calculate extra height for dynamic top padding (prevents content from hugging top edge)
  const extraHeight = Math.max(0, containerHeight - baseHeight);
  const dynamicTopPadding = Math.min(20, extraHeight / 2); // Cap at 20px for usability

  // Calculate available height for chat messages
  useEffect(() => {
    const calculateChatHeight = () => {
      const viewportHeight = window.innerHeight;
      
      // Account for:
      // - Container height (textbox area)
      // - Bottom margin (fixed at 80px for textbox positioning)
      // - Top margin (customizable)
      // - Bottom margin (customizable - reduces chat area height)
      // - Additional padding/spacing (20px for safety)
      const textboxAreaHeight = containerHeight + 80 + CHAT_CONFIG.topMargin + CHAT_CONFIG.bottomMargin + 20;
      
      // Available height for chat messages - increased to extend closer to textbox
      const availableHeight = viewportHeight - textboxAreaHeight + 50; // Added 50px to increase height
      
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
      const chatContainer = chatContainerRef.current;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      // Also update the main scrollbar position
      if (scrollbarRef.current) {
        const scrollbar = scrollbarRef.current;
        scrollbar.scrollTop = scrollbar.scrollHeight;
      }
    }
  }, [messages]);

  // Sync scrollbar position when chat container scrolls
  const syncScrollbarPosition = () => {
    if (chatContainerRef.current && scrollbarRef.current) {
      const chatContainer = chatContainerRef.current;
      const scrollbar = scrollbarRef.current;
      
      const chatScrollTop = chatContainer.scrollTop;
      const chatScrollHeight = chatContainer.scrollHeight;
      const chatClientHeight = chatContainer.clientHeight;
      const maxChatScroll = chatScrollHeight - chatClientHeight;
      
      if (maxChatScroll > 0) {
        const scrollPercentage = chatScrollTop / maxChatScroll;
        const scrollbarScrollHeight = scrollbar.scrollHeight;
        const scrollbarClientHeight = scrollbar.clientHeight;
        const maxScrollbarScroll = scrollbarScrollHeight - scrollbarClientHeight;
        
        if (maxScrollbarScroll > 0) {
          scrollbar.scrollTop = scrollPercentage * maxScrollbarScroll;
        }
      }
    }
  };

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

  // Function to calculate border radius based on content
  const calculateBorderRadius = (content: string): string => {
    const lines = content.split('\n').length;
    
    // For very short content (like single words), use pill shape
    if (content.length <= 20 && lines === 1) {
      return '25px';
    }
    
    // For short single lines, use high border radius (pill-like)
    if (lines === 1 && content.length <= 50) {
      return '20px';
    }
    
    // For medium single lines, reduce border radius
    if (lines === 1 && content.length <= 100) {
      return '18px';
    }
    
    // For longer single lines, further reduce
    if (lines === 1) {
      return '16px';
    }
    
    // For 2-3 lines, moderate border radius
    if (lines <= 3) {
      return '14px';
    }
    
    // For 4-5 lines, less rounded
    if (lines <= 5) {
      return '12px';
    }
    
    // For many lines, minimal rounding (more rectangular)
    return '10px';
  };

  // Calculate scrollbar content height based on chat content
  const calculateScrollbarHeight = () => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      const chatScrollHeight = chatContainer.scrollHeight;
      const chatClientHeight = chatContainer.clientHeight;
      
      // Make scrollbar content proportional to chat content
      const ratio = Math.max(1.5, chatScrollHeight / chatClientHeight);
      return Math.max(chatMaxHeight * ratio, window.innerHeight);
    }
    return Math.max(window.innerHeight, 1000);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100vh',
        width: '100%',
        fontFamily: CHAT_CONFIG.typography.fontFamily,
        overflow: 'hidden',
      }}
    >
      {/* Chat messages area - simplified and visible */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: `${chatMaxHeight}px`,
          marginTop: `${CHAT_CONFIG.topMargin}px`,
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
            height: `${CHAT_CONFIG.topBlurHeight}px`,
            background: `linear-gradient(to bottom, ${theme.colors.background} 0%, rgba(246, 246, 246, 0.4) 50%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        
        {/* Scrollable chat messages container - controlled by viewport scrollbar */}
        <div
          ref={chatContainerRef}
          className="chat-container"
          style={{
            width: `${baseWidth}px`,
            height: '100%',
            overflowY: 'auto', // Enable scrolling but hide scrollbar
            overflowX: 'hidden',
            padding: `${CHAT_CONFIG.containerPadding}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${CHAT_CONFIG.messageGap}px`,
            // Hide the scrollbar but keep functionality
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // Internet Explorer and Edge
          }}
          onScroll={syncScrollbarPosition} // Sync scrollbar when chat scrolls
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? CHAT_CONFIG.colors.userBubble : CHAT_CONFIG.colors.assistantBubble,
                color: msg.role === 'user' ? CHAT_CONFIG.colors.userText : CHAT_CONFIG.colors.assistantText,
                padding: CHAT_CONFIG.messagePadding,
                borderRadius: calculateBorderRadius(msg.content),
                maxWidth: CHAT_CONFIG.maxMessageWidth,
                fontFamily: CHAT_CONFIG.typography.fontFamily,
                fontSize: CHAT_CONFIG.typography.fontSize,
                lineHeight: CHAT_CONFIG.typography.lineHeight,
                wordWrap: 'break-word',
                // Add shadow for both user and assistant messages to match textbox style
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
            height: `${CHAT_CONFIG.bottomBlurHeight}px`,
            background: `linear-gradient(to top, ${theme.colors.background} 0%, rgba(246, 246, 246, 0.4) 50%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>

      {/* CSS to hide scrollbar in WebKit browsers */}
      <style>
        {`
          .chat-container::-webkit-scrollbar {
            display: none;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${CHAT_CONFIG.colors.scrollbarTrack};
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${CHAT_CONFIG.colors.scrollbar};
            border-radius: 6px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.accent}80;
            background-clip: content-box;
          }
        `}
      </style>

      {/* Right-edge scrollbar - MAIN SCROLLBAR */}
      <div
        ref={scrollbarRef}
        className="custom-scrollbar"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '20px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 5,
          scrollbarWidth: 'thin',
          scrollbarColor: `${CHAT_CONFIG.colors.scrollbar} ${CHAT_CONFIG.colors.scrollbarTrack}`,
          backgroundColor: 'transparent',
        }}
        onScroll={(e) => {
          if (chatContainerRef.current) {
            // Get current scroll position as percentage
            const scrollTop = e.currentTarget.scrollTop;
            const scrollHeight = e.currentTarget.scrollHeight;
            const clientHeight = e.currentTarget.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            
            if (maxScroll > 0) {
              const scrollPercentage = scrollTop / maxScroll;
              
              // Apply to chat container
              const chatScrollHeight = chatContainerRef.current.scrollHeight;
              const chatClientHeight = chatContainerRef.current.clientHeight;
              const maxChatScroll = chatScrollHeight - chatClientHeight;
              
              if (maxChatScroll > 0) {
                chatContainerRef.current.scrollTop = scrollPercentage * maxChatScroll;
              }
            }
          }
        }}
      >
        {/* Dynamic content height based on chat content */}
        <div 
          style={{ 
            height: `${calculateScrollbarHeight()}px` 
          }} 
        />
      </div>

      {/* Fixed textbox area at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${baseWidth}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
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
            alignItems: 'flex-end',  // Changed to flex-end to pin content to bottom
            padding: `${dynamicTopPadding}px ${paddingX}px 0 ${paddingX}px`,  // Dynamic top padding, 0 bottom
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

        {/* Static sphere - no dynamic translateY */}
        <div
          onClick={onSend}
          style={{
            ...sphereStyle,
            width: `${sphereSize}px`,
            height: `${sphereSize}px`,
            transform: `translateX(${sphereX}px) translateY(0)`,  // Fixed at 0 (no downward movement)
          }}
        />
      </div>
    </div>
  );
};

export default ChatArea;