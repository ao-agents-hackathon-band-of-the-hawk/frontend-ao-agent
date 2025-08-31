// src/components/ChatHistoryPanel.tsx
import React from 'react';

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

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isVisible,
  conversations,
  onLoadConversation,
  onDeleteConversation,
  onClearAll,
}) => {
  if (!isVisible) return null;

  return (
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
            onClick={onClearAll}
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
            {conversations.map((convo) => {
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
                    onClick={() => onLoadConversation(convo.id)}
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
                      onDeleteConversation(convo.id);
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
  );
};

export default ChatHistoryPanel;