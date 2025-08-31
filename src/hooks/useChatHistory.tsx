// src/hooks/useChatHistory.ts
import { useState } from 'react';

interface UseChatHistoryProps {
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
}

export const useChatHistory = ({
  loadConversation,
  deleteConversation,
  clearAllConversations,
}: UseChatHistoryProps) => {
  const [isShowHistory, setIsShowHistory] = useState(false);

  const toggleHistory = () => {
    setIsShowHistory(!isShowHistory);
  };

  const handleLoadConversation = (id: string) => {
    loadConversation(id);
    setIsShowHistory(false);
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm('Delete this conversation?')) {
      deleteConversation(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      clearAllConversations();
    }
  };

  return {
    isShowHistory,
    setIsShowHistory,
    toggleHistory,
    handleLoadConversation,
    handleDeleteConversation,
    handleClearAll,
  };
};