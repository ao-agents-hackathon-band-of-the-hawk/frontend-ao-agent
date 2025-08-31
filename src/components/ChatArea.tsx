// src/components/ChatArea.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useChatHistory } from '../hooks/useChatHistory';
import { useChatScrolling } from '../hooks/useChatScrolling';
import TextBox from './TextBox';
import ChatHistoryButton from './ChatHistoryButton';
import ChatMessages from './ChatMessages';
import ChatScrollbar from './ChatScrollbar';

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface ChatAreaProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  imageUrl?: string;
  conversations: Conversation[];
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  isShowHistory: boolean;
  setIsShowHistory: (show: boolean) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  inputValue,
  setInputValue,
  onSend,
  imageUrl,
  conversations,
  loadConversation,
  deleteConversation,
  clearAllConversations,
  isShowHistory,
  setIsShowHistory
}) => {
  const theme = useTheme();
  const [textareaHeight, setTextareaHeight] = useState(24);
  const [chatMaxHeight, setChatMaxHeight] = useState(600);

  // CUSTOMIZABLE SPACING, LAYOUT AND STYLING PARAMETERS
  const CHAT_CONFIG = {
    containerPadding: 30,
    messageGap: 15,
    topMargin: 35,
    topBlurHeight: 15,
    bottomBlurHeight: 15,
    bottomMargin: 10,
    messagePadding: '10px 15px',
    maxMessageWidth: '90%',
    colors: {
      userBubble: '#ffffffff',
      assistantBubble: '#ffffff',
      userText: '#11111199',
      assistantText: '#11111199',
      scrollbar: `#5b652a`,
      scrollbarTrack: 'transparent',
      background: theme.colors.background,
    },
    typography: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: `${theme.typography.fontSize.base}px`,
      lineHeight: '1.5',
    }
  };

  // Dimensions for chat mode
  const baseWidth = 800;
  const baseHeight = 100;
  const sphereSize = 80;
  const sphereX = 349;
  const paddingX = 56.4;
  const textMarginRight = '74.4';

  // Calculate dynamic container height
  const containerHeight = textareaHeight > 24 
    ? Math.max(baseHeight, textareaHeight + 45)
    : baseHeight;

  // Use custom hooks
  const {
    handleLoadConversation,
    handleDeleteConversation,
    handleClearAll,
  } = useChatHistory({
    loadConversation,
    deleteConversation,
    clearAllConversations,
  });

  const {
    chatContainerRef,
    scrollbarRef,
    scrollbarHeight,
    syncScrollbarPosition,
    handleScrollbarScroll,
  } = useChatScrolling(messages, chatMaxHeight);

  // Calculate available height for chat messages
  useEffect(() => {
    const calculateChatHeight = () => {
      const viewportHeight = window.innerHeight;
      const textboxAreaHeight = containerHeight + 30 + CHAT_CONFIG.topMargin + CHAT_CONFIG.bottomMargin + 20;
      const availableHeight = viewportHeight - textboxAreaHeight + 50;
      const newMaxHeight = Math.max(200, availableHeight);
      setChatMaxHeight(newMaxHeight);
    };

    calculateChatHeight();
    window.addEventListener('resize', calculateChatHeight);
    
    return () => {
      window.removeEventListener('resize', calculateChatHeight);
    };
  }, [containerHeight]);

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
        justifyContent: 'flex-start',
        height: '100vh',
        width: '100%',
        fontFamily: CHAT_CONFIG.typography.fontFamily,
        overflow: 'hidden',
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

      {/* Chat Messages */}
      <ChatMessages
        messages={messages}
        chatMaxHeight={chatMaxHeight}
        containerPadding={CHAT_CONFIG.containerPadding}
        messageGap={CHAT_CONFIG.messageGap}
        topBlurHeight={CHAT_CONFIG.topBlurHeight}
        bottomBlurHeight={CHAT_CONFIG.bottomBlurHeight}
        colors={CHAT_CONFIG.colors}
        typography={CHAT_CONFIG.typography}
        messagePadding={CHAT_CONFIG.messagePadding}
        maxMessageWidth={CHAT_CONFIG.maxMessageWidth}
        baseWidth={baseWidth}
        onScroll={syncScrollbarPosition}
        chatContainerRef={chatContainerRef}
      />

      {/* Chat Scrollbar */}
      <ChatScrollbar
        scrollbarRef={scrollbarRef}
        scrollbarHeight={scrollbarHeight}
        onScroll={handleScrollbarScroll}
        scrollbarColor={CHAT_CONFIG.colors.scrollbar}
        scrollbarTrackColor={CHAT_CONFIG.colors.scrollbarTrack}
      />

      {/* Fixed textbox area at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: '30px',
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
            alignItems: 'flex-end',
            padding: `0 ${paddingX}px`,
            position: 'absolute',
            left: 0,
            bottom: 0,
          }}
        >
          <TextBox
            isVisible={true}
            marginRight={textMarginRight}
            onHeightChange={handleHeightChange}
            value={inputValue}
            onChange={setInputValue}
            onSend={onSend}
            isChatMode={true}
          />
        </div>

        {/* Static sphere */}
        <div
          onClick={onSend}
          style={{
            ...sphereStyle,
            width: `${sphereSize}px`,
            height: `${sphereSize}px`,
            transform: `translateX(${sphereX}px)`,
            position: 'absolute',
            bottom: `${(baseHeight - sphereSize) / 2}px`,
          }}
        />
      </div>
    </div>
  );
};

export default ChatArea;