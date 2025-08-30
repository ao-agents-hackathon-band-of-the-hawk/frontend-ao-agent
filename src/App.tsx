import { useState, useEffect, useCallback } from 'react';
import Transition from './components/Transition';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
}

function App() {
  const [isTextMode, setIsTextMode] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [debugInfo, setDebugInfo] = useState('Voice mode active');
  const [isShowHistory, setIsShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  // Conversion functions
  const messagesToPairs = (messages: Message[]): Array<{ "0": string; "1": string }> => {
    const pairs: Array<{ "0": string; "1": string }> = [];
    for (let i = 0; i < messages.length; i += 2) {
      const userMsg = messages[i].role === 'user' ? messages[i].content : '';
      const aiMsg = (i + 1 < messages.length && messages[i + 1].role === 'assistant') ? messages[i + 1].content : '';
      if (userMsg) {
        pairs.push({ "0": userMsg, "1": aiMsg });
      }
    }
    return pairs;
  };

  const pairsToMessages = (pairs: Array<{ "0": string; "1": string }>): Message[] => {
    return pairs.flatMap(pair => [
      { role: 'user' as const, content: pair["0"] },
      pair["1"] ? { role: 'assistant' as const, content: pair["1"] } : null
    ]).filter((m): m is Message => m !== null);
  };

  // Load a conversation
  const loadConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      setCurrentMessages(pairsToMessages(convo.pairs));
      setIsChatMode(true);
      setIsShowHistory(false);
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' || event.key.toLowerCase() === 't') {
      event.preventDefault();
      setIsTextMode(prevIsTextMode => {
        const newMode = !prevIsTextMode;
        if (!newMode) {
          // Toggling to voice mode: Save current chat if it has messages and not saving
          setIsSaving(true);
          setCurrentMessages(prevMessages => {
            if (prevMessages.length > 0 && !isSaving) {
              const pairs = messagesToPairs(prevMessages);
              if (pairs.length > 0) {
                const newPairsStr = JSON.stringify(pairs);
                setConversations(prevConvos => {
                  if (!prevConvos.some(c => JSON.stringify(c.pairs) === newPairsStr)) {
                    return [...prevConvos, { id: Date.now().toString(), pairs }];
                  }
                  return prevConvos;
                });
              }
              setIsChatMode(false);
              setInputValue('');
              return [];
            }
            return prevMessages;
          });
          setDebugInfo('Voice mode active');
          setIsSaving(false);
        } else {
          // Toggling to text mode: Start fresh
          setDebugInfo('Transitioning to text mode...');
          setCurrentMessages([]);
          setIsChatMode(false);
          setInputValue('');
        }
        return newMode;
      });
    }
  }, [isSaving]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleTransitionComplete = () => {
    setDebugInfo('Text mode active');
    console.log('Transition to text mode completed');
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessages = [...currentMessages, { role: 'user' as const, content: inputValue }];
      setCurrentMessages(newMessages);
      setInputValue('');
      if (!isChatMode) {
        setIsChatMode(true);
      }
      // Simulate AI response (optional, can be removed if not needed)
      setTimeout(() => {
        setCurrentMessages(prev => [...prev, { role: 'assistant' as const, content: 'This is a simulated response.' }]);
      }, 1000);
    }
  };

  const viewRawData = () => {
    console.log(JSON.stringify(conversations, null, 2));
    setShowDataModal(true);
  };

  return (
    <div className="app">
      <Transition 
        isTextMode={isTextMode}
        isChatMode={isChatMode}
        onTransitionComplete={handleTransitionComplete}
        inputValue={inputValue}
        setInputValue={setInputValue}
        messages={currentMessages}
        onSend={handleSend}
        // imageUrl="/path/to/your/image.jpg" // Optional: add your custom image
        conversations={conversations}
        loadConversation={loadConversation}
        isShowHistory={isShowHistory}
        setIsShowHistory={setIsShowHistory}
      />
      
      {/* Debug controls - enhanced for voice activity troubleshooting */}
      <div className="fixed top-5 right-5 z-[1000] bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-[300px]">
        <div>Press SPACE or T to toggle modes</div>
        <div>Status: {debugInfo}</div>
        <div>Mode: {isTextMode ? 'Text' : 'Voice'}</div>
        {!isTextMode && (
          <div className="mt-2 text-[11px] opacity-80">
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
          className="mt-2 px-2 py-1 bg-accent text-white border-none rounded cursor-pointer text-xs"
        >
          Toggle Mode
        </button>
        <button 
          onClick={viewRawData}
          className="mt-2 px-2 py-1 bg-accent text-white border-none rounded cursor-pointer text-xs"
        >
          View Raw Data
        </button>
      </div>

      {/* Raw Data Modal */}
      {showDataModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowDataModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '80%',
              maxHeight: '80%',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowDataModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'normal',
              textAlign: 'left',
              overflowWrap: 'break-word',
            }}>
              {JSON.stringify(conversations, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;