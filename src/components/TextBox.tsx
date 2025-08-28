// src/components/TextBox.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

export interface TextBoxProps {
  isVisible: boolean;
  marginRight: string;
  onHeightChange?: (height: number) => void;
}

interface CustomScrollbarProps {
  targetRef: React.RefObject<HTMLTextAreaElement | null>;
  theme: any;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ targetRef, theme }) => {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // SCROLLBAR CUSTOMIZATION PARAMETERS - CHANGE THESE
  const scrollbarConfig = {
    // Position (relative to textarea)
    right: '-30px',        // Distance from right edge
    top: '25px',         // Distance from top
    bottom: '130px',      // Distance from bottom
    
    // Dimensions
    width: '8px',        // Scrollbar width
    thumbMinHeight: '20px', // Minimum thumb height
    
    // Styling
    trackRadius: '4px',  // Track border radius
    thumbRadius: '4px',  // Thumb border radius
    trackBg: 'transparent', // Track background
    thumbBg: `${theme.colors.accent}60`, // Thumb background
    thumbBorder: `1px solid ${theme.colors.accent}80`, // Thumb border
    thumbHoverBg: `${theme.colors.accent}80`, // Thumb hover color
  };

  useEffect(() => {
    const textarea = targetRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = textarea;
      const maxScroll = scrollHeight - clientHeight;
      
      if (maxScroll <= 0) {
        setIsVisible(false);
        return;
      }
      
      setIsVisible(true);
      const percent = scrollTop / maxScroll;
      setScrollPercent(percent);
    };

    textarea.addEventListener('scroll', handleScroll);
    textarea.addEventListener('input', handleScroll);
    
    handleScroll();

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
      textarea.removeEventListener('input', handleScroll);
    };
  }, [targetRef]);

  const handleScrollbarClick = (e: React.MouseEvent) => {
    const textarea = targetRef.current;
    const scrollbar = scrollbarRef.current;
    if (!textarea || !scrollbar) return;

    const rect = scrollbar.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollbarHeight = rect.height;
    const clickPercent = clickY / scrollbarHeight;
    
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;
    textarea.scrollTop = clickPercent * maxScroll;
  };

  const handleThumbDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const textarea = targetRef.current;
    const scrollbar = scrollbarRef.current;
    if (!textarea || !scrollbar) return;

    const startY = e.clientY;
    const startScrollTop = textarea.scrollTop;
    const scrollbarHeight = scrollbar.getBoundingClientRect().height;
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = deltaY / scrollbarHeight;
      const newScrollTop = startScrollTop + (deltaPercent * maxScroll);
      
      textarea.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Simplified mouse down handler (no cursor changes)
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    handleThumbDrag(e);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={scrollbarRef}
      onClick={handleScrollbarClick}
      style={{
        position: 'absolute',
        right: scrollbarConfig.right,
        top: scrollbarConfig.top,
        bottom: scrollbarConfig.bottom,
        width: scrollbarConfig.width,
        background: scrollbarConfig.trackBg,
        borderRadius: scrollbarConfig.trackRadius,
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      <div
        ref={thumbRef}
        onMouseDown={handleThumbMouseDown}
        style={{
          position: 'absolute',
          top: `${scrollPercent * 70}%`,
          width: '100%',
          minHeight: scrollbarConfig.thumbMinHeight,
          height: '30%',
          background: scrollbarConfig.thumbBg,
          border: scrollbarConfig.thumbBorder,
          borderRadius: scrollbarConfig.thumbRadius,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = scrollbarConfig.thumbHoverBg;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = scrollbarConfig.thumbBg;
        }}
      />
    </div>
  );
};

const TextBox: React.FC<TextBoxProps> = ({ isVisible, marginRight, onHeightChange }) => {
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (textarea.value.trim() === '') {
      const originalHeight = 24;
      textarea.style.height = `${originalHeight}px`;
      if (textareaHeight !== originalHeight) {
        setTextareaHeight(originalHeight);
        onHeightChange?.(originalHeight);
      }
      return;
    }

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = `${newHeight}px`;
    
    if (newHeight !== textareaHeight) {
      setTextareaHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  };

  const handleInput = () => {
    adjustTextareaHeight();
  };

  const handlePaste = () => {
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  };

  const textareaStyles: React.CSSProperties = {
  width: '100%',
  height: '24px',
  minHeight: '24px',
  maxHeight: '400px',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: theme.colors.text,
  fontSize: '20px',
  fontFamily: theme.typography.fontFamily.primary,
  resize: 'none',
  overflow: 'auto',
  lineHeight: '1.2',
  transition: 'none',
  paddingRight: '45px',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
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
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        onInput={handleInput}
        onPaste={handlePaste}
        style={textareaStyles}
      />
      
      <CustomScrollbar targetRef={textareaRef} theme={theme} />
    </motion.div>
  );
};

export default TextBox;