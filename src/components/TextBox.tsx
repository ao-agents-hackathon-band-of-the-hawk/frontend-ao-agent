// src/components/TextBox.tsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import CustomScrollbar from './CustomScrollbar';
import TextAreaInput from './TextAreaInput';

export interface TextBoxProps {
  isVisible: boolean;
  marginRight: string;
  onHeightChange?: (height: number) => void;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isChatMode?: boolean;
}

const TextBox: React.FC<TextBoxProps> = ({ 
  isVisible, 
  marginRight, 
  onHeightChange, 
  value, 
  onChange, 
  onSend, 
  isChatMode 
}) => {
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click on container to focus textarea
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.6, delay: isVisible ? 0 : 1.2, ease: [0.2, 0, 0.1, 1] }}
      onClick={handleContainerClick}
      style={{
        marginRight,
        flex: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        cursor: 'text', // Show text cursor when hovering over container
      }}
    >
      <div style={{
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <TextAreaInput
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onSend={onSend}
          onHeightChange={onHeightChange}
          theme={theme}
          isVisible={isVisible}
        />
      </div>
      
      <CustomScrollbar 
        targetRef={textareaRef} 
        theme={theme} 
        isChatMode={isChatMode} 
      />
    </motion.div>
  );
};

export default TextBox;