// src/hooks/useChatScrolling.ts
import { useRef, useEffect, useState } from 'react';

export const useChatScrolling = (messages: any[], chatMaxHeight: number) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollbarRef = useRef<HTMLDivElement | null>(null);
  const [scrollbarHeight, setScrollbarHeight] = useState(0);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      if (scrollbarRef.current) {
        const scrollbar = scrollbarRef.current;
        scrollbar.scrollTop = scrollbar.scrollHeight;
      }
    }
  }, [messages]);

  // Calculate scrollbar content height based on chat content
  const calculateScrollbarHeight = () => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      const chatScrollHeight = chatContainer.scrollHeight;
      const chatClientHeight = chatContainer.clientHeight;
      
      const ratio = Math.max(1.5, chatScrollHeight / chatClientHeight);
      return Math.max(chatMaxHeight * ratio, window.innerHeight);
    }
    return Math.max(window.innerHeight, 1000);
  };

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

  const handleScrollbarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (chatContainerRef.current) {
      const scrollTop = e.currentTarget.scrollTop;
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      
      if (maxScroll > 0) {
        const scrollPercentage = scrollTop / maxScroll;
        
        const chatScrollHeight = chatContainerRef.current.scrollHeight;
        const chatClientHeight = chatContainerRef.current.clientHeight;
        const maxChatScroll = chatScrollHeight - chatClientHeight;
        
        if (maxChatScroll > 0) {
          chatContainerRef.current.scrollTop = scrollPercentage * maxChatScroll;
        }
      }
    }
  };

  // Update scrollbar height when component mounts or chat content changes
  useEffect(() => {
    const height = calculateScrollbarHeight();
    setScrollbarHeight(height);
  }, [messages, chatMaxHeight]);

  return {
    chatContainerRef,
    scrollbarRef,
    scrollbarHeight,
    syncScrollbarPosition,
    handleScrollbarScroll,
  };
};