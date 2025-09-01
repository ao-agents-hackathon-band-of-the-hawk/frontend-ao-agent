// src/components/TextAreaInput.tsx
import React, { useRef, useState, useEffect } from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onHeightChange?: (height: number) => void;
  theme: any;
  isVisible: boolean;
}

const TextAreaInput = React.forwardRef<HTMLTextAreaElement, TextAreaInputProps>(({ 
  value, 
  onChange, 
  onSend, 
  onHeightChange, 
  theme, 
  isVisible 
}, forwardedRef) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(24);

  // Use forwarded ref or internal ref
  const textareaRef = forwardedRef || internalRef;

  // Auto-focus when component becomes visible
  useEffect(() => {
    if (isVisible && textareaRef && 'current' in textareaRef && textareaRef.current) {
      // Small delay to ensure the textarea is rendered and visible
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, textareaRef]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef && 'current' in textareaRef ? textareaRef.current : null;
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
    const textarea = textareaRef && 'current' in textareaRef ? textareaRef.current : null;
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
  );
});

TextAreaInput.displayName = 'TextAreaInput';

export default TextAreaInput;

