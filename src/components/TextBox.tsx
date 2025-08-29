// src/components/TextBox.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

export interface TextBoxProps {
  isVisible: boolean;
  marginRight: string;
  onHeightChange?: (height: number) => void;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isChatMode?: boolean;
}

interface CustomScrollbarProps {
  targetRef: React.RefObject<HTMLTextAreaElement | null>;
  theme: any;
  isChatMode?: boolean;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ targetRef, theme, isChatMode }) => {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(30); // Dynamic thumb height percentage
  const [isVisible, setIsVisible] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // SCROLLBAR CUSTOMIZATION PARAMETERS - DEFAULT (CENTERED MODE)
  const defaultScrollbarConfig = {
    right: '-48px',        // Distance from right edge
    top: '25px',         // Distance from top
    bottom: '130px',      // Distance from bottom
    width: '8px',        // Scrollbar width
    thumbMinHeight: '20px', // Minimum thumb height
    trackRadius: '4px',  // Track border radius
    thumbRadius: '4px',  // Thumb border radius
    trackBg: 'transparent', // Track background
    thumbBg: `${theme.colors.accent}60`, // Thumb background
    thumbHoverBg: `${theme.colors.accent}80`, // Thumb hover color
  };

  // SCROLLBAR CUSTOMIZATION PARAMETERS - CHAT MODE (CHANGE POSITION HERE)
  const chatScrollbarConfig = {
    right: '-7px',        // Distance from right edge - ADJUST THIS
    top: '25px',         // Distance from top - ADJUST THIS  
    bottom: '115px',      // Distance from bottom - ADJUST THIS
    width: '8px',        // Scrollbar width
    thumbMinHeight: '20px', // Minimum thumb height
    trackRadius: '4px',  // Track border radius
    thumbRadius: '4px',  // Thumb border radius
    trackBg: 'transparent', // Track background
    thumbBg: `#5b652a60`, // Thumb background (matches chat scrollbar)
    thumbHoverBg: `#5b652a80`, // Thumb hover color
  };

  const scrollbarConfig = isChatMode ? chatScrollbarConfig : defaultScrollbarConfig;

  useEffect(() => {
    const textarea = targetRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = textarea;
      const maxScroll = scrollHeight - clientHeight;
      
      // Only show scrollbar when content exceeds container AND textarea is at max height (400px)
      if (maxScroll <= 0 || clientHeight < 400) {
        setIsVisible(false);
        return;
      }
      
      setIsVisible(true);
      
      // Calculate scroll percentage
      const percent = scrollTop / maxScroll;
      setScrollPercent(percent);
      
      // Calculate dynamic thumb height based on visible content ratio
      const visibleRatio = clientHeight / scrollHeight;
      const newThumbHeight = Math.max(15, visibleRatio * 100); // Minimum 15% height
      setThumbHeight(newThumbHeight);
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
    const thumb = thumbRef.current;
    if (!textarea || !scrollbar || !thumb) return;

    const rect = scrollbar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Check if click is on the thumb itself
    if (clickY >= (thumbRect.top - rect.top) && clickY <= (thumbRect.bottom - rect.top)) {
      return; // Don't scroll if clicking on thumb
    }
    
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
    const scrollbarRect = scrollbar.getBoundingClientRect();
    const availableSpace = scrollbarRect.height * (100 - thumbHeight) / 100; // Available space for thumb movement
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = deltaY / availableSpace; // Use available space instead of full height
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
          top: `${scrollPercent * (100 - thumbHeight)}%`,
          width: '100%',
          minHeight: scrollbarConfig.thumbMinHeight,
          height: `${thumbHeight}%`,
          background: scrollbarConfig.thumbBg,
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

const TextBox: React.FC<TextBoxProps> = ({ isVisible, marginRight, onHeightChange, value, onChange, onSend, isChatMode }) => {
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get proper scrollHeight
    textarea.style.height = '24px'; // Always reset to single line height first
    
    if (value.trim() === '') {
      // Keep at single line height when empty
      if (textareaHeight !== 24) {
        setTextareaHeight(24);
        onHeightChange?.(24);
      }
      return;
    }

    // Calculate new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = `${newHeight}px`;
    
    if (newHeight !== textareaHeight) {
      setTextareaHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Optimized paste handler - instant height calculation
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Get the pasted content
    const paste = e.clipboardData.getData('text');
    if (!paste) return;

    // Pre-calculate what the new value will be
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const currentValue = target.value;
    const newValue = currentValue.substring(0, start) + paste + currentValue.substring(end);

    // Create a temporary element to calculate height instantly
    const tempTextarea = document.createElement('textarea');
    tempTextarea.style.cssText = getComputedStyle(textarea).cssText;
    tempTextarea.style.height = '24px';
    tempTextarea.style.position = 'absolute';
    tempTextarea.style.visibility = 'hidden';
    tempTextarea.style.whiteSpace = 'pre-wrap';
    tempTextarea.value = newValue;
    
    document.body.appendChild(tempTextarea);
    const calculatedHeight = Math.min(tempTextarea.scrollHeight, 400);
    document.body.removeChild(tempTextarea);

    // Pre-set the height before the paste happens
    textarea.style.height = `${calculatedHeight}px`;
    
    // Update state synchronously
    if (calculatedHeight !== textareaHeight) {
      setTextareaHeight(calculatedHeight);
      onHeightChange?.(calculatedHeight);
    }

    // Update the value (this will trigger the paste)
    onChange(newValue);
    
    // Prevent the default paste to avoid double-pasting
    e.preventDefault();
  };

  // Handle input changes (for typing, not paste)
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onChange(target.value);
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
      <div style={{
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{
            width: '100%',
            minHeight: '24px',
            maxHeight: '400px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: theme.colors.text,
            fontSize: '18px',
            fontFamily: theme.typography.fontFamily.primary,
            lineHeight: '24px', // Match height exactly
            resize: 'none',
            overflow: 'auto',
            paddingRight: '40px',
            boxSizing: 'border-box',
            verticalAlign: 'baseline',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            textAlign: 'left',
            display: 'block',
            transition: 'none', // No transitions for smooth expansion
          }}
        />
      </div>
      
      <CustomScrollbar targetRef={textareaRef} theme={theme} isChatMode={isChatMode} />
    </motion.div>
  );
};

export default TextBox;