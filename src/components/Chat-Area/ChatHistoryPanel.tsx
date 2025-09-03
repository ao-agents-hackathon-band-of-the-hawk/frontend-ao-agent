import React, { useState } from 'react';

// Interfaces remain the same
interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
}

interface ChatHistoryPanelProps {
  isVisible: boolean;
  conversations: Conversation[];
  onLoadConversation: (id:string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
}

// Helper components for icons and hover states
const DeleteIcon = ({ color }: { color: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: isItemHovered ? '#F7F7F7' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'background-color 0.2s, transform 0.2s',
        transform: isItemHovered ? 'translateY(-2px)' : 'none',
        border: '1px solid #E0E0E0',
    };
    
    const deleteButtonStyle: React.CSSProperties = {
        marginLeft: '12px',
        padding: '4px',
        background: isDeleteHovered ? '#fef2f2' : 'transparent',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s, background-color 0.2s',
    };

    return (
        <div 
          key={convo.id}
          style={itemStyle}
          onMouseEnter={() => setItemHovered(true)}
          onMouseLeave={() => setItemHovered(false)}
        >
          <div 
            onClick={() => onLoad(convo.id)}
            style={{ flex: 1, minWidth: 0 }}
          >
            <div style={styles.convoTitle}>
              {firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}...` : firstMessage}
            </div>
            <div style={styles.convoMeta}>
              <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
              <span>{new Date(convo.timestamp || 0).toLocaleDateString()}</span>
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
            <DeleteIcon color={isDeleteHovered ? '#e53e3e' : '#aaa'} />
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

  if (!isVisible) return null;

  const clearButtonStyle: React.CSSProperties = {
      ...styles.clearButton,
      backgroundColor: isClearHovered ? '#d71515ff' : '#b91919ff',
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h4 style={styles.title}>Chat History</h4>
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
            No past conversations
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
    </div>
  );
};

// All styles are now defined as JS objects
const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    position: 'absolute',
    top: '50px',
    left: '0',
    backgroundColor: '#b6c37f',
    padding: '1.5rem',
    borderRadius: '16px',
    minWidth: '300px',
    maxWidth: '300px',
    maxHeight: '450px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 30,
    fontFamily: "'Open Sans', sans-serif",
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '0 0.5rem',
  },
  title: {
    margin: 0,
    color: '#495038',
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  clearButton: {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  listContainer: {
    maxHeight: '100%',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  emptyMessage: {
    color: '#737373',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '3rem 1rem',
    fontSize: '0.9rem',
  },
  conversationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  convoInfo: {
    flex: 1,
    minWidth: 0,
  },
  convoTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#333',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  convoMeta: {
    fontSize: '0.75rem',
    color: '#737373',
    display: 'flex',
    justifyContent: 'space-between',
  },
};

export default ChatHistoryPanel;

