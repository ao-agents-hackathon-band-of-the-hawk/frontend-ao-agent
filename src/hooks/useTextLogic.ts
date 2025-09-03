// src/hooks/useTextLogic.tsx - Unified Storage Version
import { useState, useCallback } from 'react';
import { TextService } from '../services/textService';

export interface UseTextLogicProps {
  sessionId: string;
  onMessageUpdate: (userMessage: string, aiResponse: string) => void;
}

export const useTextLogic = ({ sessionId, onMessageUpdate }: UseTextLogicProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to save text interaction directly to unified localStorage
  const saveTextInteraction = useCallback((userMessage: string, aiResponse: string) => {
    if (!userMessage || !aiResponse) return;
    
    try {
      // Get current conversations from localStorage (unified storage)
      const stored = localStorage.getItem('chat-conversations');
      const currentConversations = stored ? JSON.parse(stored) : [];
      
      // Look for existing text conversation for this session
      const existingTextConvoIndex = currentConversations.findIndex((c: any) => c.id === `text_${sessionId}`);
      
      let updatedConversations;
      
      if (existingTextConvoIndex !== -1) {
        // Update existing text conversation
        updatedConversations = [...currentConversations];
        const existingConvo = updatedConversations[existingTextConvoIndex];
        updatedConversations[existingTextConvoIndex] = {
          ...existingConvo,
          pairs: [...existingConvo.pairs, { "0": userMessage, "1": aiResponse }],
          timestamp: Date.now()
        };
        // Move to top (newest first)
        const updatedConvo = updatedConversations.splice(existingTextConvoIndex, 1)[0];
        updatedConversations.unshift(updatedConvo);
      } else {
        // Create new text conversation for this session
        const newConversation = {
          id: `text_${sessionId}`,
          pairs: [{ "0": userMessage, "1": aiResponse }],
          timestamp: Date.now(),
          sessionId: sessionId
        };
        updatedConversations = [newConversation, ...currentConversations];
      }
      
      // Sort by timestamp (newest first)
      updatedConversations.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      
      // Save to localStorage
      localStorage.setItem('chat-conversations', JSON.stringify(updatedConversations));
      console.log('Text interaction saved to unified storage:', updatedConversations.length, 'total conversations');
      
      // Trigger custom event to notify other parts of the app
      window.dispatchEvent(new CustomEvent('conversationsUpdated', { 
        detail: updatedConversations 
      }));
      
    } catch (error) {
      console.error('Error saving text interaction to unified storage:', error);
      
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const stored = localStorage.getItem('chat-conversations');
          if (stored) {
            const conversations = JSON.parse(stored);
            const reducedConversations = conversations.slice(0, Math.floor(conversations.length * 0.8));
            localStorage.setItem('chat-conversations', JSON.stringify(reducedConversations));
            console.log('Storage quota exceeded. Reduced conversations to:', reducedConversations.length);
            
            // Retry saving the text interaction
            saveTextInteraction(userMessage, aiResponse);
          }
        } catch (retryError) {
          console.error('Failed to handle storage quota exceeded:', retryError);
        }
      }
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (message: string): Promise<string> => {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Sending message to Text API (Session: ${sessionId}):`, message);
      
      const response = await TextService.sendMessage(message.trim());
      
      console.log('Text API response:', response);
      
      // Call the callback with user message and AI response
      onMessageUpdate(message.trim(), response.result);
      
      // Save to unified storage
      saveTextInteraction(message.trim(), response.result);
      
      return response.result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Text API error:', error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onMessageUpdate, sessionId, saveTextInteraction]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    clearError,
  };
};