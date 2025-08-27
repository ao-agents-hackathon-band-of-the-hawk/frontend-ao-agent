// src/components/TextBox.tsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface TextBoxProps {
  isVisible: boolean;
  marginRight: string;
  onHeightChange?: (height: number) => void;
}

const TextBox: React.FC<TextBoxProps> = ({ isVisible, marginRight, onHeightChange }) => {
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24); // Initial single line height

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // If textarea is empty, reset to original single line height
    if (textarea.value.trim() === '') {
      const originalHeight = 24;
      textarea.style.height = `${originalHeight}px`;
      if (textareaHeight !== originalHeight) {
        setTextareaHeight(originalHeight);
        onHeightChange?.(originalHeight);
      }
      return;
    }

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height based on content, constrained to max 270px
    const newHeight = Math.min(textarea.scrollHeight, 270);
    
    // Set the new height
    textarea.style.height = `${newHeight}px`;
    
    // Update state and notify parent instantly (no animation delay)
    if (newHeight !== textareaHeight) {
      setTextareaHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  };

  const handleInput = () => {
    adjustTextareaHeight();
  };

  const handlePaste = () => {
    // Let the paste happen first, then adjust height
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.6, delay: isVisible ? 0 : 1.2, ease: [0.2, 0, 0.1, 1] }}
      style={{
        marginRight,
        flex: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'center', // Back to center alignment like original
      }}
    >
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        onInput={handleInput}
        onPaste={handlePaste}
        style={{
          width: '100%',
          height: '24px', // Fixed initial height
          minHeight: '24px',
          maxHeight: '270px',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: theme.colors.text,
          fontSize: '20px',
          fontFamily: theme.typography.fontFamily.primary,
          resize: 'none',
          overflow: 'auto', // Always scrollable when content exceeds height
          lineHeight: '1.2',
          transition: 'none', // Remove any CSS transitions
        }}
      />
    </motion.div>
  );
};

export default TextBox;