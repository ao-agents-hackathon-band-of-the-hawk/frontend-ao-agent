// src/hooks/useTextMode.ts
import { useState, useCallback } from 'react';

export const useTextMode = () => {
  const [textareaHeight, setTextareaHeight] = useState(24);
  const [isInitialTransition, setIsInitialTransition] = useState(true);

  const handleHeightChange = useCallback((height: number, transitionStage: string) => {
    setTextareaHeight(height);
    if (isInitialTransition && transitionStage === 'text') {
      setIsInitialTransition(false);
    }
  }, [isInitialTransition]);

  // Dimensions for initial text mode (non-chat)
  const dimensions = {
    baseWidth: 645,
    baseHeight: 125,
    sphereSize: 100,
    sphereX: 259,
    paddingX: 47,
    textMarginRight: '62px',
  };

  // Calculate dynamic container height
  const containerHeight = textareaHeight > 24 
    ? Math.max(dimensions.baseHeight, textareaHeight + 50)
    : dimensions.baseHeight;

  return {
    textareaHeight,
    isInitialTransition,
    containerHeight,
    dimensions,
    handleHeightChange,
  };
};