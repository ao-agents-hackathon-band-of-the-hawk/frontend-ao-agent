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
  timestamp: number; // Add timestamp for better organization
}

const STORAGE_KEY = 'chat-conversations';

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

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const loadConversationsFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedConversations = JSON.parse(stored) as Conversation[];
          // Sort by timestamp (newest first)
          parsedConversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setConversations(parsedConversations);
          console.log('Loaded conversations from localStorage:', parsedConversations.length);
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
        // If there's an error, clear the corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadConversationsFromStorage();
  }, []);

  // Save conversations to localStorage whenever conversations array changes
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        console.log('Saved conversations to localStorage:', conversations.length);
      } catch (error) {
        console.error('Error saving conversations to localStorage:', error);
        // Handle storage quota exceeded or other errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          // Remove oldest conversations to make space
          const reducedConversations = conversations.slice(0, Math.floor(conversations.length * 0.8));
          setConversations(reducedConversations);
          console.log('Storage quota exceeded. Reduced conversations to:', reducedConversations.length);
        }
      }
    }
  }, [conversations]);

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

  // Enhanced save conversation function
  const saveCurrentConversation = useCallback(() => {
    if (currentMessages.length > 0 && !isSaving) {
      const pairs = messagesToPairs(currentMessages);
      if (pairs.length > 0) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          pairs,
          timestamp: Date.now()
        };
        
        const newPairsStr = JSON.stringify(pairs);
        setConversations(prevConvos => {
          // Check if this exact conversation already exists
          const existingIndex = prevConvos.findIndex(c => JSON.stringify(c.pairs) === newPairsStr);
          if (existingIndex !== -1) {
            // Update timestamp of existing conversation
            const updatedConvos = [...prevConvos];
            updatedConvos[existingIndex] = { ...updatedConvos[existingIndex], timestamp: Date.now() };
            return updatedConvos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          } else {
            // Add new conversation
            const updated = [newConversation, ...prevConvos];
            return updated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          }
        });
      }
    }
  }, [currentMessages, isSaving]);

  // Load a conversation
  const loadConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      setCurrentMessages(pairsToMessages(convo.pairs));
      setIsChatMode(true);
      setIsShowHistory(false);
    }
  };

  // Delete a conversation
  const deleteConversation = (id: string) => {
    setConversations(prevConvos => {
      const updated = prevConvos.filter(c => c.id !== id);
      if (updated.length === 0) {
        // If no conversations left, clear localStorage
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });
  };

  // Clear all conversations
  const clearAllConversations = () => {
    setConversations([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared all conversations from localStorage');
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' || event.key.toLowerCase() === 't') {
      event.preventDefault();
      setIsTextMode(prevIsTextMode => {
        const newMode = !prevIsTextMode;
        if (!newMode) {
          // Toggling to voice mode: Save current chat if it has messages
          setIsSaving(true);
          saveCurrentConversation();
          setIsChatMode(false);
          setInputValue('');
          setCurrentMessages([]);
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
  }, [saveCurrentConversation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Save conversation before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentConversation();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCurrentConversation]);

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

  // Get storage usage info
  const getStorageInfo = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const sizeInBytes = stored ? new Blob([stored]).size : 0;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      return { conversations: conversations.length, sizeKB: sizeInKB };
    } catch {
      return { conversations: 0, sizeKB: '0' };
    }
  };

  const storageInfo = getStorageInfo();

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
        deleteConversation={deleteConversation}
        clearAllConversations={clearAllConversations}
      />
      
      {/* Enhanced debug controls */}
      <div className="fixed top-5 right-5 z-[1000] bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-[320px]">
        <div>Press SPACE or T to toggle modes</div>
        <div>Status: {debugInfo}</div>
        <div>Mode: {isTextMode ? 'Text' : 'Voice'}</div>
        <div>Conversations: {storageInfo.conversations} ({storageInfo.sizeKB} KB)</div>
        {!isTextMode && (
          <div className="mt-2 text-[11px] opacity-80">
            Voice activity should scale the sphere.<br/>
            Check browser console for scale values!<br/>
            Try speaking loudly into your microphone.
          </div>
        )}
        <div className="flex gap-1 mt-2">
          <button 
            onClick={() => {
              setIsTextMode(prev => {
                const newMode = !prev;
                setDebugInfo(newMode ? 'Transitioning to text mode...' : 'Voice mode active');
                return newMode;
              });
            }}
            className="px-2 py-1 bg-accent text-white border-none rounded cursor-pointer text-xs"
          >
            Toggle Mode
          </button>
          <button 
            onClick={viewRawData}
            className="px-2 py-1 bg-accent text-white border-none rounded cursor-pointer text-xs"
          >
            View Data
          </button>
          <button 
            onClick={clearAllConversations}
            className="px-2 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs"
            title="Clear all stored conversations"
          >
            Clear All
          </button>
        </div>
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
            <h3 style={{ marginBottom: '10px', color: 'black' }}>
              Chat History Data ({storageInfo.conversations} conversations, {storageInfo.sizeKB} KB)
            </h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'normal',
              textAlign: 'left',
              overflowWrap: 'break-word',
              color: 'black',
              fontSize: '12px',
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