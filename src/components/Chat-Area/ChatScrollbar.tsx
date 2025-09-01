// src/components/ChatScrollbar.tsx
import React from 'react';

interface ChatScrollbarProps {
  scrollbarRef: React.RefObject<HTMLDivElement | null>;
  scrollbarHeight: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollbarColor: string;
  scrollbarTrackColor: string;
}

const ChatScrollbar: React.FC<ChatScrollbarProps> = ({
  scrollbarRef,
  scrollbarHeight,
  onScroll,
  scrollbarColor,
  scrollbarTrackColor,
}) => {
  return (
    <>
      {/* CSS for custom scrollbar */}
      <style>
        {`
          .chat-container::-webkit-scrollbar {
            display: none;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${scrollbarTrackColor};
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${scrollbarColor};
            border-radius: 6px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${scrollbarColor}80;
            background-clip: content-box;
          }
        `}
      </style>

      {/* Right-edge scrollbar - MAIN SCROLLBAR */}
      <div
        ref={scrollbarRef}
        className="custom-scrollbar"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '20px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 5,
          scrollbarWidth: 'thin',
          scrollbarColor: `${scrollbarColor} ${scrollbarTrackColor}`,
          backgroundColor: 'transparent',
        }}
        onScroll={onScroll}
      >
        {/* Dynamic content height based on chat content */}
        <div 
          style={{ 
            height: `${scrollbarHeight}px` 
          }} 
        />
      </div>
    </>
  );
};

export default ChatScrollbar;