// src/components/TextMode.tsx
import React from 'react';
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

  const sphereStyle: React.CSSProperties = {
    borderRadius: '50%',
    background: imageUrl
      ? `linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.1)), url(${imageUrl})`
      : `linear-gradient(135deg, ${theme.colors.accent}, #8b5cf6)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    zIndex: 2,
  };

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
      {/* Expanding outline/border - dynamic starting size based on current voice scale */}
      <motion.div
        initial={{ 
          width: transitionStartSize, 
          height: transitionStartSize, 
          borderRadius: '50%',
          borderWidth: 0,
        }}
        animate={{ 
          width: [transitionStartSize, 118, 516], 
          height: [transitionStartSize, 118, 125], 
          borderRadius: ['50%', '50%', '62px'],
          borderWidth: [0, 2, 2],
        }}
        transition={{
          duration: 1.8,
          times: [0, 0.4, 1],
          ease: [0.2, 0, 0.1, 1],
        }}
        style={{
          position: 'absolute',
          borderStyle: 'solid',
          borderColor: theme.colors.accent,
          background: transitionStage === 'text' ? theme.colors.background : 'transparent',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: transitionStage === 'text' ? '0 38px' : '0',
        }}
      >
        {/* Text input area - appears smoothly */}
        <TextBox 
          isVisible={transitionStage === 'text'} 
          marginRight="130px" 
        />
      </motion.div>

      {/* Shrinking and moving sphere - starts from current voice scale */}
      <motion.div
        initial={{ 
          width: transitionStartSize,
          height: transitionStartSize,
          x: 0,
          scale: 1, // Already factored into width/height
        }}
        animate={{ 
          width: [transitionStartSize, 100, 100], 
          height: [transitionStartSize, 100, 100],
          x: [0, 0, 196], // Adjusted for larger pill 
          scale: 1, // Keep scale at 1 since we're animating width/height directly
        }}
        transition={{
          duration: 1.8,
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