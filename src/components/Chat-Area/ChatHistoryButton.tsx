// src/components/Chat-Area/ChatHistoryButton.tsx
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
        title={`Chat History (${conversations.length})`}
      >
        {/* History Icon SVG */}
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
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
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