import { useState, useEffect } from 'react';
import Transition from './components/Transition';
import './App.css';

function App() {
  const [isTextMode, setIsTextMode] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [debugInfo, setDebugInfo] = useState('Voice mode active');

  // Listen for keyboard shortcut to toggle modes (spacebar or 't')
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key.toLowerCase() === 't') {
        event.preventDefault();
        setIsTextMode(prev => {
          const newMode = !prev;
          setDebugInfo(newMode ? 'Transitioning to text mode...' : 'Voice mode active');
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleTransitionComplete = () => {
    setDebugInfo('Text mode active');
    console.log('Transition to text mode completed');
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
      setInputValue('');
      if (!isChatMode) {
        setIsChatMode(true);
      }
      // Simulate AI response (optional, can be removed if not needed)
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'This is a simulated response.' }]);
      }, 1000);
    }
  };

  return (
    <div className="app">
      <Transition 
        isTextMode={isTextMode}
        isChatMode={isChatMode}
        onTransitionComplete={handleTransitionComplete}
        inputValue={inputValue}
        setInputValue={setInputValue}
        messages={messages}
        onSend={handleSend}
        // imageUrl="/path/to/your/image.jpg" // Optional: add your custom image
      />
      
      {/* Debug controls - enhanced for voice activity troubleshooting */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px'
      }}>
        <div>Press SPACE or T to toggle modes</div>
        <div>Status: {debugInfo}</div>
        <div>Mode: {isTextMode ? 'Text' : 'Voice'}</div>
        {!isTextMode && (
          <div style={{ marginTop: '8px', fontSize: '11px', opacity: '0.8' }}>
            Voice activity should scale the sphere.<br/>
            Check browser console for scale values!<br/>
            Try speaking loudly into your microphone.
          </div>
        )}
        <button 
          onClick={() => {
            setIsTextMode(prev => {
              const newMode = !prev;
              setDebugInfo(newMode ? 'Transitioning to text mode...' : 'Voice mode active');
              return newMode;
            });
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: '#DBE0C3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Toggle Mode
        </button>
      </div>
    </div>
  );
}

export default App;