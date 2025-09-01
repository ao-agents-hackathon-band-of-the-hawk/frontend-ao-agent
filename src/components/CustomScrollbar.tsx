// src/components/TextBox/CustomScrollbar.tsx
import React, { useState, useRef, useEffect } from 'react';

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

export default CustomScrollbar;

