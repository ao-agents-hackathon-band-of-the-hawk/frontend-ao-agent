import { useState, useEffect, useCallback, useRef } from 'react';
import Transition from './components/Transition';
import LandingHello from './Pages/LandingHello';
import { SpeechService } from './services/speechService';
import { TextService } from './services/textService';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp: number;
  sessionId?: string; // Unique session ID per conversation
}

const STORAGE_KEY = 'chat-conversations';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isTextMode, setIsTextMode] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [debugInfo, setDebugInfo] = useState('Voice mode active');
  const [isShowHistory, setIsShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Generate session ID dynamically
  const [sessionId, setSessionId] = useState(() => {
    const id = generateSessionId();
    console.log('🔑 Generated Session ID:', id);
    return id;
  });
  
  const [voiceDebugInfo, setVoiceDebugInfo] = useState({
    state: 'Ready - Click to start',
    chunks: 0,
    vadStatus: 'OFF',
    speaking: 'NO',
    error: null as string | null,
  });

  // Use ref to track if we're currently updating conversations to prevent loops
  const isUpdatingConversations = useRef(false);
  const lastConversationsHash = useRef<string>('');

  // Update session ID in services whenever it changes
  useEffect(() => {
    console.log('🔑 Setting Session ID in services:', sessionId);
    SpeechService.setSessionId(sessionId);
    TextService.setSessionId(sessionId);
    
    // Verify the session ID was set
    console.log('🔑 Session ID verification - Services initialized with:', sessionId);
  }, [sessionId]);

  useEffect(() => {
    const loadConversationsFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedConversations = JSON.parse(stored) as Conversation[];
          parsedConversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          lastConversationsHash.current = JSON.stringify(parsedConversations);
          setConversations(parsedConversations);
          console.log('Loaded conversations from localStorage:', parsedConversations.length);
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    loadConversationsFromStorage();
  }, []);

  useEffect(() => {
    if (isUpdatingConversations.current || conversations.length === 0) {
      return;
    }

    const currentHash = JSON.stringify(conversations);
    if (currentHash !== lastConversationsHash.current) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        lastConversationsHash.current = currentHash;
        console.log('Saved conversations to localStorage:', conversations.length);
      } catch (error) {
        console.error('Error saving conversations to localStorage:', error);
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          const reducedConversations = conversations.slice(0, Math.floor(conversations.length * 0.8));
          setConversations(reducedConversations);
          console.log('Storage quota exceeded. Reduced conversations to:', reducedConversations.length);
        }
      }
    }
  }, [conversations]);

  useEffect(() => {
    const handleConversationsUpdated = (event: CustomEvent) => {
      const updatedConversations = event.detail as Conversation[];
      const newHash = JSON.stringify(updatedConversations);
      if (newHash !== lastConversationsHash.current) {
        isUpdatingConversations.current = true;
        setConversations(prevConversations => {
          const prevHash = JSON.stringify(prevConversations);
          if (prevHash !== newHash) {
            console.log('Parent conversations updated from voice interaction:', updatedConversations.length);
            return updatedConversations;
          }
          return prevConversations;
        });
        setTimeout(() => {
          isUpdatingConversations.current = false;
        }, 0);
      }
    };

    window.addEventListener('conversationsUpdated', handleConversationsUpdated as EventListener);
    return () => {
      window.removeEventListener('conversationsUpdated', handleConversationsUpdated as EventListener);
    };
  }, []);

  const addMessage = useCallback(
    (message: { role: 'user' | 'assistant'; content: string }) => {
      setCurrentMessages(prev => [...prev, message]);
      if (!isChatMode) {
        setIsChatMode(true);
      }
    },
    [isChatMode],
  );

  const messagesToPairs = (messages: Message[]): Array<{ "0": string; "1": string }> => {
    const pairs: Array<{ "0": string; "1": string }> = [];
    for (let i = 0; i < messages.length; i += 2) {
      const userMsg = messages[i].role === 'user' ? messages[i].content : '';
      const aiMsg = i + 1 < messages.length && messages[i + 1].role === 'assistant' ? messages[i + 1].content : '';
      if (userMsg) {
        pairs.push({ "0": userMsg, "1": aiMsg });
      }
    }
    return pairs;
  };

  const pairsToMessages = (pairs: Array<{ "0": string; "1": string }>): Message[] => {
    return pairs
      .flatMap(pair => [
        { role: 'user' as const, content: pair["0"] },
        pair["1"] ? { role: 'assistant' as const, content: pair["1"] } : null,
      ])
      .filter((m): m is Message => m !== null);
  };

  const exportConversationsAsJSON = useCallback(() => {
    const systemPrompt =
      "You are a helpful assistant. Remember the user's personal information from previous interactions and reference it appropriately.";
    const exportedConversations = [...conversations].reverse().map(conversation => {
      const messages = [{ role: "system", content: systemPrompt }];
      conversation.pairs.forEach(pair => {
        messages.push({ role: "user", content: pair["0"] });
        if (pair["1"]) {
          messages.push({ role: "assistant", content: pair["1"] });
        }
      });
      return { messages, sessionId: conversation.sessionId };
    });

    const jsonData = JSON.stringify(exportedConversations, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_history_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`Exported ${exportedConversations.length} conversations to JSON`);
  }, [conversations]);

  const saveCurrentConversation = useCallback(() => {
    if (currentMessages.length > 0 && !isSaving) {
      const pairs = messagesToPairs(currentMessages);
      if (pairs.length > 0) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          pairs,
          timestamp: Date.now(),
          sessionId: sessionId, // Store sessionId
        };
        const newPairsStr = JSON.stringify(pairs);
        isUpdatingConversations.current = true;
        setConversations(prevConvos => {
          const existingIndex = prevConvos.findIndex(c => JSON.stringify(c.pairs) === newPairsStr);
          if (existingIndex !== -1) {
            const updatedConvos = [...prevConvos];
            updatedConvos[existingIndex] = { 
              ...updatedConvos[existingIndex], 
              timestamp: Date.now(),
              sessionId: updatedConvos[existingIndex].sessionId || sessionId // Preserve or set
            };
            return updatedConvos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          } else {
            const updated = [newConversation, ...prevConvos];
            return updated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          }
        });
        setTimeout(() => {
          isUpdatingConversations.current = false;
        }, 0);
      }
    }
  }, [currentMessages, isSaving, sessionId]);

  const loadConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      setCurrentMessages(pairsToMessages(convo.pairs));
      setIsChatMode(true);
      setIsShowHistory(false);
      const convoSessionId = convo.sessionId || generateSessionId();
      setSessionId(convoSessionId);
      // Update convo with sessionId if missing for persistence
      if (!convo.sessionId) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, sessionId: convoSessionId } : c));
      }
    }
  };

  const deleteConversation = (id: string) => {
    isUpdatingConversations.current = true;
    setConversations(prevConvos => {
      const updated = prevConvos.filter(c => c.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        lastConversationsHash.current = '';
      }
      return updated;
    });
    setTimeout(() => {
      isUpdatingConversations.current = false;
    }, 0);
  };

  const clearAllConversations = () => {
    isUpdatingConversations.current = true;
    setConversations([]);
    localStorage.removeItem(STORAGE_KEY);
    lastConversationsHash.current = '';
    console.log('Cleared all conversations from localStorage');
    setTimeout(() => {
      isUpdatingConversations.current = false;
    }, 0);
  };

  const handleLandingComplete = () => {
    setShowLanding(false);
    setSessionId(generateSessionId()); // New session when leaving landing page
  };

  useEffect(() => {
    const lastSwitchTime = { current: 0 };
    const touchStartY = { current: 0 };
    let scrollAccumulator = 0;
    const BASE_SCROLL_THRESHOLD = 200;
    const SCROLL_THRESHOLD = BASE_SCROLL_THRESHOLD * 1.3;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Element;
      if (
        target.closest('.chat-messages') ||
        target.closest('.chat-history-panel') ||
        target.closest('.chat-area') ||
        target.closest('.text-mode-container')
      ) {
        return;
      }

      if (showLanding || Date.now() - lastSwitchTime.current < 300) {
        return;
      }

      e.preventDefault();
      const delta = e.deltaY;
      scrollAccumulator += delta;

      if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
        lastSwitchTime.current = Date.now();
        const direction = scrollAccumulator > 0 ? 'down' : 'up';
        if (direction === 'down') {
          if (!isTextMode) {
            setIsTextMode(true);
            setIsChatMode(false);
            setInputValue('');
            setCurrentMessages([]);
            setDebugInfo('Transitioning to text mode...');
            setSessionId(generateSessionId()); // New session for text chat
          }
        } else {
          if (isTextMode) {
            setIsSaving(true);
            saveCurrentConversation();
            setIsTextMode(false);
            setIsChatMode(false);
            setInputValue('');
            setCurrentMessages([]);
            setDebugInfo('Voice mode active');
            setIsSaving(false);
            setSessionId(generateSessionId()); // New session for voice mode
          } else {
            setShowLanding(true);
          }
        }
        scrollAccumulator = 0;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as Element;
      if (
        target.closest('.chat-messages') ||
        target.closest('.chat-history-panel') ||
        target.closest('.chat-area') ||
        target.closest('.text-mode-container')
      ) {
        return;
      }

      if (showLanding || e.touches.length !== 1) {
        return;
      }

      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const delta = touchStartY.current - touchY;
      scrollAccumulator += delta;

      if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
        if (Date.now() - lastSwitchTime.current < 300) return;
        lastSwitchTime.current = Date.now();
        const direction = scrollAccumulator > 0 ? 'down' : 'up';
        if (direction === 'down') {
          if (!isTextMode) {
            setIsTextMode(true);
            setIsChatMode(false);
            setInputValue('');
            setCurrentMessages([]);
            setDebugInfo('Transitioning to text mode...');
            setSessionId(generateSessionId()); // New session for text chat
          }
        } else {
          if (isTextMode) {
            setIsSaving(true);
            saveCurrentConversation();
            setIsTextMode(false);
            setIsChatMode(false);
            setInputValue('');
            setCurrentMessages([]);
            setDebugInfo('Voice mode active');
            setIsSaving(false);
            setSessionId(generateSessionId()); // New session for voice mode
          } else {
            setShowLanding(true);
          }
        }
        scrollAccumulator = 0;
        touchStartY.current = touchY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [showLanding, isTextMode, saveCurrentConversation]);

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

  const handleAudioReady = (audioBlob: Blob) => {
    console.log('Audio ready for processing:', audioBlob.size, 'bytes');
    setDebugInfo(`Audio captured: ${(audioBlob.size / 1024).toFixed(1)}KB`);
    setTimeout(() => {
      setDebugInfo('Voice mode active - ready for next recording');
    }, 2000);
  };

  const updateVoiceDebug = useCallback(
    (debugData: { state: string; chunks: number; vadStatus: string; speaking: string; error?: string | null }) => {
      setVoiceDebugInfo(prev => {
        const newData = { ...debugData, error: debugData.error ?? null };
        if (JSON.stringify(prev) !== JSON.stringify(newData)) {
          return newData;
        }
        return prev;
      });
    },
    [],
  );

  useEffect(() => {
    window.voiceDebugCallback = updateVoiceDebug;
    (window as any).showDebug = () => {
      setShowDebugPanel(true);
      console.log('Debug panel shown');
    };
    (window as any).hideDebug = () => {
      setShowDebugPanel(false);
      console.log('Debug panel hidden');
    };
    console.log('Debug panel commands available:');
    console.log('- showDebug() - Show the debug panel');
    console.log('- hideDebug() - Hide the debug panel');
    return () => {
      delete window.voiceDebugCallback;
      delete (window as any).showDebug;
      delete (window as any).hideDebug;
    };
  }, [updateVoiceDebug]);

  const viewRawData = () => {
    console.log(JSON.stringify(conversations, null, 2));
    setShowDataModal(true);
  };

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

  if (showLanding) {
    return <LandingHello onComplete={handleLandingComplete} />;
  }

  return (
    <div className="app">
      <Transition
        isTextMode={isTextMode}
        isChatMode={isChatMode}
        onTransitionComplete={handleTransitionComplete}
        inputValue={inputValue}
        setInputValue={setInputValue}
        messages={currentMessages}
        onAudioReady={handleAudioReady}
        sessionId={sessionId}
        conversations={conversations}
        loadConversation={loadConversation}
        isShowHistory={isShowHistory}
        setIsShowHistory={setIsShowHistory}
        deleteConversation={deleteConversation}
        clearAllConversations={clearAllConversations}
        addMessage={addMessage}
      />
      {showDebugPanel && (
        <div className="fixed top-5 right-5 z-[1000] bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-[350px]">
          <div
            onClick={() => setShowDebugPanel(false)}
            className="absolute top-2 right-2 text-white cursor-pointer text-sm"
            title="Close debug panel (use showDebug() in console to reopen)"
          >
            ×
          </div>
          <div className="mb-2 text-yellow-300 font-semibold">Voice Mode Debug Panel</div>
          <div>Status: {debugInfo}</div>
          <div>Mode: {isTextMode ? 'Text' : 'Voice'}</div>
          <div>Session ID: <span className="text-green-300">{sessionId}</span></div>
          <div>Conversations: {storageInfo.conversations} ({storageInfo.sizeKB} KB)</div>
          {!isTextMode && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="text-green-300 font-semibold mb-1">Voice Activity Detection:</div>
              <div>{voiceDebugInfo.state}</div>
              <div>Chunks: {voiceDebugInfo.chunks}</div>
              <div>VAD: {voiceDebugInfo.vadStatus} | Speaking: {voiceDebugInfo.speaking}</div>
              {voiceDebugInfo.error && <div style={{ color: 'red' }}>Error: {voiceDebugInfo.error}</div>}
            </div>
          )}
          {!isTextMode && (
            <div className="mt-2 text-[11px] opacity-80 border-t border-white/20 pt-2">
              <div className="text-blue-300 font-semibold mb-1">Voice Controls:</div>
              <div>• Click sphere to start/stop </div>
              <div>• 3-second silence auto-stops </div>
              <div>• Audio auto-downloads </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/20">
            <button
              onClick={viewRawData}
              className="px-2 py-1 bg-accent text-white border-none rounded cursor-pointer text-xs"
            >
              View Data
            </button>
            <button
              onClick={exportConversationsAsJSON}
              className="px-2 py-1 bg-green-600 text-white border-none rounded cursor-pointer text-xs"
              title="Export conversations as JSON file"
            >
              Export JSON
            </button>
            <button
              onClick={clearAllConversations}
              className="px-2 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs"
              title="Clear all stored conversations"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 pt-2 border-t border-white/20 text-[10px] opacity-70">
            Console: showDebug() | hideDebug()
          </div>
        </div>
      )}
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
            <h6 style={{ marginBottom: '10px', color: 'black' }}>
              Chat History Data ({storageInfo.conversations} conversations, {storageInfo.sizeKB} KB)
            </h6>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                textAlign: 'left',
                overflowWrap: 'break-word',
                color: 'black',
                fontSize: '12px',
              }}
            >
              {JSON.stringify(conversations, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

