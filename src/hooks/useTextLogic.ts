// src/hooks/useTextLogic.tsx
import { useState, useCallback } from 'react';
import { TextService } from '../services/textService';

export interface UseTextLogicProps {
  sessionId: string;
  onMessageUpdate: (userMessage: string, aiResponse: string) => void;
}

export const useTextLogic = ({ sessionId, onMessageUpdate }: UseTextLogicProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      return response.result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Text API error:', error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onMessageUpdate, sessionId]); // Add sessionId to dependency array

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