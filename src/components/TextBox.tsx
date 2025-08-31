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

  const checkScrollbarVisibility = () => {
    const textarea = targetRef.current;
    if (!textarea) return;

    const { scrollHeight, clientHeight, offsetHeight } = textarea;
    
    // Use offsetHeight as it's more reliable than clientHeight
    const actualHeight = offsetHeight || clientHeight;
    const maxScroll = scrollHeight - actualHeight;
    
    // Show scrollbar only when:
    // 1. There's scrollable content (maxScroll > 0)
    // 2. The textarea has reached its maximum height (400px)
    // 3. Content actually overflows
    const hasReachedMaxHeight = actualHeight >= 400;
    const hasOverflow = scrollHeight > actualHeight;
    const shouldBeVisible = hasReachedMaxHeight && hasOverflow && maxScroll > 0;
    
    console.log('Scrollbar check:', {
      scrollHeight,
      clientHeight,
      offsetHeight: actualHeight,
      maxScroll,
      hasReachedMaxHeight,
      hasOverflow,
      shouldBeVisible,
      currentlyVisible: isVisible
    });
    
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
    }
    
    if (shouldBeVisible) {
      // Calculate scroll percentage
      const scrollTop = textarea.scrollTop;
      const percent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollPercent(percent);
      
      // Calculate dynamic thumb height based on visible content ratio
      const visibleRatio = actualHeight / scrollHeight;
      const newThumbHeight = Math.max(15, visibleRatio * 100); // Minimum 15% height
      setThumbHeight(newThumbHeight);
    }
  };

  useEffect(() => {
    const textarea = targetRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      checkScrollbarVisibility();
    };

    const handleInput = () => {
      // Use setTimeout to ensure DOM is updated after input
      setTimeout(() => {
        checkScrollbarVisibility();
      }, 0);
    };

    // Handle paste events specifically for immediate scrollbar updates
    const handlePaste = () => {
      // Multiple timeouts to catch different phases of paste operation
      setTimeout(() => checkScrollbarVisibility(), 0);
      setTimeout(() => checkScrollbarVisibility(), 10);
      setTimeout(() => checkScrollbarVisibility(), 50);
    };

    // Use ResizeObserver to detect height changes (including after paste)
    const resizeObserver = new ResizeObserver(() => {
      // Use multiple timeouts to ensure measurements are accurate after resize
      setTimeout(() => {
        checkScrollbarVisibility();
      }, 0);
      setTimeout(() => {
        checkScrollbarVisibility();
      }, 10);
    });

    // Use MutationObserver to catch style changes
    const mutationObserver = new MutationObserver((mutations) => {
      // Check if height or scrollHeight related changes occurred
      const hasRelevantChanges = mutations.some(mutation => 
        mutation.type === 'attributes' && 
        (mutation.attributeName === 'style' || mutation.attributeName === 'value')
      );
      
      if (hasRelevantChanges) {
        setTimeout(() => {
          checkScrollbarVisibility();
        }, 0);
        setTimeout(() => {
          checkScrollbarVisibility();
        }, 10);
      }
    });

    textarea.addEventListener('scroll', handleScroll);
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('paste', handlePaste);
    resizeObserver.observe(textarea);
    mutationObserver.observe(textarea, { 
      attributes: true, 
      attributeFilter: ['style', 'value'],
      childList: true,
      subtree: true
    });
    
    // Initial check with delay to ensure proper rendering
    setTimeout(() => {
      checkScrollbarVisibility();
    }, 100);

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('paste', handlePaste);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [targetRef, isVisible]);

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
    
    const maxScroll = textarea.scrollHeight - (textarea.offsetHeight || textarea.clientHeight);
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
    const maxScroll = textarea.scrollHeight - (textarea.offsetHeight || textarea.clientHeight);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24);

  // Auto-focus when component becomes visible
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      // Small delay to ensure the textarea is rendered and visible
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle click on container to focus textarea
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Skip adjustment if we're in the middle of a paste operation
    if (textarea.dataset.isPasting === 'true') return;

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

    // Mark textarea as being in paste operation to prevent adjustTextareaHeight interference
    textarea.dataset.isPasting = 'true';

    // Create a temporary element to calculate height instantly
    const tempTextarea = document.createElement('textarea');
    
    // Copy ALL the exact styles from the original textarea
    const computedStyle = getComputedStyle(textarea);
    tempTextarea.style.position = 'absolute';
    tempTextarea.style.visibility = 'hidden';
    tempTextarea.style.top = '-9999px';
    tempTextarea.style.left = '-9999px';
    tempTextarea.style.width = computedStyle.width;
    tempTextarea.style.minHeight = '24px';
    tempTextarea.style.maxHeight = 'none'; // Remove max height constraint for calculation
    tempTextarea.style.height = 'auto';
    tempTextarea.style.border = computedStyle.border;
    tempTextarea.style.padding = computedStyle.padding;
    tempTextarea.style.paddingRight = '40px'; // Match the original
    tempTextarea.style.boxSizing = computedStyle.boxSizing;
    tempTextarea.style.fontSize = computedStyle.fontSize;
    tempTextarea.style.fontFamily = computedStyle.fontFamily;
    tempTextarea.style.lineHeight = computedStyle.lineHeight;
    tempTextarea.style.whiteSpace = 'pre-wrap';
    tempTextarea.style.wordWrap = 'break-word';
    tempTextarea.style.overflow = 'hidden';
    tempTextarea.style.resize = 'none';
    
    tempTextarea.value = newValue;
    
    document.body.appendChild(tempTextarea);
    
    // Force a reflow to ensure accurate measurements
    tempTextarea.offsetHeight;
    
    // Get the natural height, then apply our max constraint
    const naturalHeight = Math.max(24, tempTextarea.scrollHeight);
    const calculatedHeight = Math.min(naturalHeight, 400);
    
    document.body.removeChild(tempTextarea);

    console.log('Paste calculation:', {
      newValue: newValue.substring(0, 100) + (newValue.length > 100 ? '...' : ''),
      naturalHeight,
      calculatedHeight,
      lineCount: (newValue.match(/\n/g) || []).length + 1
    });

    // Prevent the default paste first
    e.preventDefault();
    
    // Set the exact height we calculated
    textarea.style.height = `${calculatedHeight}px`;
    
    // Update the value directly without triggering adjustTextareaHeight
    textarea.value = newValue;
    
    // Update state and parent
    if (calculatedHeight !== textareaHeight) {
      setTextareaHeight(calculatedHeight);
      onHeightChange?.(calculatedHeight);
    }
    
    // Notify parent of value change
    onChange(newValue);
    
    // Position cursor at the end of pasted content
    const newCursorPosition = start + paste.length;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    
    // Clear the pasting flag and force scrollbar recalculation
    setTimeout(() => {
      delete textarea.dataset.isPasting;
      // Force scrollbar recalculation after paste
      const scrollbarCheckEvent = new Event('paste');
      textarea.dispatchEvent(scrollbarCheckEvent);
    }, 20);
  };

  // Handle input changes (for typing, not paste)
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onChange(target.value);
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