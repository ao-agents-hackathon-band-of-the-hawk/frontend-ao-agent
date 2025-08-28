// src/components/TextMode.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import TextBox from './TextBox';

interface TextModeProps {
  transitionStage: 'expanding' | 'text';
  transitionStartSize: number;
  imageUrl?: string;
}

const TextMode: React.FC<TextModeProps> = ({ transitionStage, transitionStartSize, imageUrl }) => {
  const theme = useTheme();
  const [textareaHeight, setTextareaHeight] = useState(24); // Initial single line height
  const [isInitialTransition, setIsInitialTransition] = useState(true);

  const sphereStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: imageUrl
      ? `linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.1)), url(${imageUrl})`
      : `linear-gradient(135deg, ${theme.colors.accent}, #DBE0C3)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    zIndex: 2,
  };

  // Calculate dynamic container height based on textarea height
  const containerHeight = transitionStage === 'text' && textareaHeight > 24 
    ? Math.max(125, textareaHeight + 50) // Only expand if there's actual content
    : 125; // Original height when empty or not in text mode

  const handleTextareaHeightChange = (height: number) => {
    setTextareaHeight(height);
    // Mark that we're past the initial transition
    if (isInitialTransition && transitionStage === 'text') {
      setIsInitialTransition(false);
    }
  };

  // Reset initial transition flag when transition stage changes
  React.useEffect(() => {
    if (transitionStage === 'expanding') {
      setIsInitialTransition(true);
    }
  }, [transitionStage]);

  return (
    <motion.div
      key="transition-mode"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Expanding container - no border, just background and shadow */}
      <motion.div
        initial={{ 
          width: transitionStartSize, 
          height: transitionStartSize, 
          borderRadius: '50%',
        }}
        animate={{ 
          width: [transitionStartSize, 118, 516], 
          height: [transitionStartSize, 118, containerHeight], 
          borderRadius: ['50%', '50%', '62px'],
        }}
        transition={{
          duration: transitionStage === 'expanding' ? 1.8 : 
                   (transitionStage === 'text' && isInitialTransition ? 0.2 : 0), // Instant after initial transition
          times: [0, 0.4, 1],
          ease: [0.2, 0, 0.1, 1],
        }}
        style={{
          position: 'absolute',
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          padding: transitionStage === 'text' ? '0 38px' : '0',
          height: transitionStage === 'text' ? containerHeight : undefined,
        }}
      >
        {/* Animated background and shadow container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: transitionStage === 'expanding' ? [0, 0, 0.6, 1] : 
                     transitionStage === 'text' ? 1 : 0,
          }}
          transition={{
            duration: transitionStage === 'expanding' ? 1.8 : 
                     transitionStage === 'text' ? 0.2 : 0,
            times: transitionStage === 'expanding' ? [0, 0.3, 0.7, 1] : 
                   transitionStage === 'text' ? [0, 1] : [0, 1],
            ease: [0.2, 0, 0.1, 1],
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#ffffff',
            borderRadius: '62px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
            zIndex: -1,
          }}
        />
        {/* Text input area - appears smoothly */}
        <TextBox 
          isVisible={transitionStage === 'text'} 
          marginRight="50px" // Reduced to give more text area
          onHeightChange={handleTextareaHeightChange}
        />
      </motion.div>

      {/* Shrinking and moving sphere - starts from current voice scale and adjusts position based on textarea height */}
      <motion.div
        initial={{ 
          width: transitionStartSize,
          height: transitionStartSize,
          x: 0,
          y: 0,
          scale: 1, // Already factored into width/height
        }}
        animate={{ 
          width: [transitionStartSize, 100, 100], 
          height: [transitionStartSize, 100, 100],
          x: [0, 0, 196], // Adjusted for larger pill 
          y: [0, 0, transitionStage === 'text' && textareaHeight > 24 
            ? Math.max(0, (containerHeight - 125) / 2) 
            : 0], // Only move down if textarea has expanded
          scale: 1, // Keep scale at 1 since we're animating width/height directly
        }}
        transition={{
          duration: transitionStage === 'expanding' ? 1.8 : 
                   (transitionStage === 'text' && isInitialTransition ? 0 : 0), // Instant sphere movement after initial transition
          times: [0, 0.4, 1],
          ease: [0.2, 0, 0.1, 1],
        }}
        style={{
          ...sphereStyle,
          zIndex: 2,
        }}
      />
    </motion.div>
  );
};

export default TextMode;