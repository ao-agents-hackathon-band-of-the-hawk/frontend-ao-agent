import React, { useState } from 'react';
import FineTune from './FineTune'; // Adjust path to FineTune.tsx as needed

// Interfaces remain the same
interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface ChatHistoryPanelProps {
  isVisible: boolean;
  conversations: Conversation[];
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
}

// Enhanced icons with better styling
const DeleteIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ConversationItem: React.FC<{
    convo: Conversation;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ convo, onLoad, onDelete }) => {
    const [isItemHovered, setItemHovered] = useState(false);
    const [isDeleteHovered, setDeleteHovered] = useState(false);

    const firstMessage = convo.pairs[0]?.["0"] || 'Empty conversation';
    const messageCount = convo.pairs.length;

    const itemStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: isItemHovered ? '#ffffff' : '#f8fafc',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        transform: isItemHovered ? 'translateY(-1px)' : 'none',
        border: '1px solid #e2e8f0',
        boxShadow: isItemHovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        gap: '12px',
    };
    
    const deleteButtonStyle: React.CSSProperties = {
        padding: '6px',
        background: isDeleteHovered ? '#fef2f2' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        opacity: isItemHovered ? 1 : 0.6,
    };

    return (
        <div 
          style={itemStyle}
          onMouseEnter={() => setItemHovered(true)}
          onMouseLeave={() => setItemHovered(false)}
        >
          <div 
            onClick={() => onLoad(convo.id)}
            style={{ flex: 1, minWidth: 0 }}
          >
            <div style={styles.convoTitle}>
              {firstMessage.length > 45 ? `${firstMessage.slice(0, 45)}...` : firstMessage}
            </div>
            <div style={styles.convoMeta}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChatIcon />
                <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarIcon />
                <span>{new Date(convo.timestamp || 0).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(convo.id);
            }}
            style={deleteButtonStyle}
            onMouseEnter={() => setDeleteHovered(true)}
            onMouseLeave={() => setDeleteHovered(false)}
            title="Delete conversation"
          >
            <DeleteIcon color={isDeleteHovered ? '#ef4444' : '#94a3b8'} />
          </button>
        </div>
    );
};

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isVisible,
  conversations,
  onLoadConversation,
  onDeleteConversation,
  onClearAll,
}) => {
  const [isClearHovered, setClearHovered] = useState(false);
  const [isFineTuneHovered, setFineTuneHovered] = useState(false);
  const [showFineTune, setShowFineTune] = useState(false); // State to toggle FineTune component

  if (!isVisible) return null;

  // Handle Fine Tune button click
  const handleFineTune = () => {
    setShowFineTune(true); // Show FineTune component
  };

  // Handle Back to Chat from FineTune
  const handleBackToChat = () => {
    setShowFineTune(false); // Show ChatHistoryPanel again
  };

  // Render FineTune if showFineTune is true, otherwise render ChatHistoryPanel
  if (showFineTune) {
    return <FineTune onBackToChat={handleBackToChat} />;
  }

  const clearButtonStyle: React.CSSProperties = {
      ...styles.clearButton,
      backgroundColor: isClearHovered ? '#aeaeaeff' : '#dadadaff',
      transform: isClearHovered ? 'translateY(-1px)' : 'none',
      boxShadow: isClearHovered ? '0 4px 12px rgba(246, 246, 246, 0.3)' : '0 2px 4px rgba(194, 194, 194, 0.2)',
  };

  const fineTuneButtonStyle: React.CSSProperties = {
      ...styles.fineTuneButton,
      backgroundColor: isFineTuneHovered ? '#b6c37f' : '#c3cb9c',
      transform: isFineTuneHovered ? 'translateY(-1px)' : 'none',
      boxShadow: isFineTuneHovered ? '0 4px 12px rgba(195, 203, 156, 0.4)' : '0 2px 4px rgba(195, 203, 156, 0.2)',
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <h4 style={styles.title}>Chat History</h4>
          <div style={styles.titleUnderline}></div>
        </div>
        {conversations.length > 0 && (
          <button
            onClick={onClearAll}
            style={clearButtonStyle}
            onMouseEnter={() => setClearHovered(true)}
            onMouseLeave={() => setClearHovered(false)}
          >
            Clear All
          </button>
        )}
      </div>
      <div style={styles.listContainer}>
        {conversations.length === 0 ? (
          <div style={styles.emptyMessage}>
            <div>No conversations yet</div>
            <div style={styles.emptySubtext}>Your chat history will appear here</div>
          </div>
        ) : (
          <div style={styles.conversationList}>
            {conversations.map((convo) => (
              <ConversationItem 
                key={convo.id}
                convo={convo}
                onLoad={onLoadConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Fine Tune Button - always shown */}
      <div style={styles.fineTuneContainer}>
        <button
          onClick={handleFineTune}
          style={fineTuneButtonStyle}
          onMouseEnter={() => setFineTuneHovered(true)}
          onMouseLeave={() => setFineTuneHovered(false)}
          title="Fine-tune model with conversation history"
        >
          <span>Fine Tune</span>
        </button>
      </div>
    </div>
  );
};

// Enhanced styles with modern design
const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'absolute',
    top: '60px',
    right: '40',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    minWidth: '320px',
    maxWidth: '320px',
    maxHeight: '500px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 30,
    fontFamily: "'Open Sans', sans-serif",
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: '1.375rem',
    fontWeight: 700,
    textAlign: 'right',
    marginTop: '4px',
  },
  clearButton: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'all 0.2s ease-in-out',
    flexShrink: 0,
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
    marginRight: '-8px',
  },
  emptyMessage: {
    color: '#6b7280',
    textAlign: 'center',
    padding: '48px 24px',
    fontSize: '0.875rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptySubtext: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  conversationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  convoTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
    textAlign: 'left',
  },
  convoMeta: {
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 500,
  },
  fineTuneContainer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
    marginTop: '16px',
  },
  fineTuneButton: {
    width: '100%',
    padding: '12px 16px',
    color: '#2c2c2c',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default ChatHistoryPanel;