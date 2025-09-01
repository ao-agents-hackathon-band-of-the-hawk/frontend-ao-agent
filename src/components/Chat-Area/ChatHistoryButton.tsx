// src/components/ChatHistoryButton.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import ChatHistoryPanel from './ChatHistoryPanel';

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface ChatHistoryButtonProps {
  conversations: Conversation[];
  isShowHistory: boolean;
  onToggleHistory: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
}

const ChatHistoryButton: React.FC<ChatHistoryButtonProps> = ({
  conversations,
  isShowHistory,
  onToggleHistory,
  onLoadConversation,
  onDeleteConversation,
  onClearAll,
}) => {
  const theme = useTheme();

  return (
    <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 20 }}>
      <button 
        onClick={onToggleHistory}
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
      <ChatHistoryPanel
        isVisible={isShowHistory}
        conversations={conversations}
        onLoadConversation={onLoadConversation}
        onDeleteConversation={onDeleteConversation}
        onClearAll={onClearAll}
      />
    </div>
  );
};

export default ChatHistoryButton;