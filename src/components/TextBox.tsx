// src/components/TextBox.tsx
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface TextBoxProps {
  isVisible: boolean;
  marginRight: string;
}

const TextBox: React.FC<TextBoxProps> = ({ isVisible, marginRight }) => {
  const theme = useTheme();

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
      }}
    >
      <input
        type="text"
        placeholder="Type your message..."
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: theme.colors.text,
          fontSize: '20px',
          fontFamily: theme.typography.fontFamily.primary,
        }}
      />
    </motion.div>
  );
};

export default TextBox;