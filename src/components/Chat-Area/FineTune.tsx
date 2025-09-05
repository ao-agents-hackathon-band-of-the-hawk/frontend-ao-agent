import React, { useState, useEffect, useRef } from 'react';
import { TrainingService } from '../../services/trainingService';

interface Conversation {
  id: string;
  pairs: Array<{ "0": string; "1": string }>;
  timestamp?: number;
  sessionId?: string;
}

interface FineTuneProps {
  conversations: Conversation[];
  onComplete?: () => void;
  onBackToChat?: () => void;
}

// Function to generate session ID (reused from App.tsx)
function generateSessionId() {
  return `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const FineTune: React.FC<FineTuneProps> = ({ conversations, onComplete, onBackToChat }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingSessionId] = useState(() => generateSessionId());
  const hasTrainedRef = useRef(false); // Prevent double API calls
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track interval

  useEffect(() => {
    // Start progress animation immediately on mount
    console.log('Starting progress animation on mount');
    startProgressAnimation();

    if (hasTrainedRef.current) return; // Skip API if already run
    hasTrainedRef.current = true;

    runTraining();

    return () => {
      // Only clear interval on true unmount if training is complete or errored
      if (progressIntervalRef.current && (isCompleted || error)) {
        console.log('Cleaning up interval on unmount');
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []); // Empty deps: run once on mount

  const startProgressAnimation = () => {
    if (progressIntervalRef.current) return; // Avoid double intervals

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return prev; // Stop at 90% until real completion
        }
        const increment = Math.random() * 3 + 1; // Random increment between 1 and 4
        const newProgress = Math.min(prev + increment, 90);
        console.log('Progress updated to:', newProgress); // Debug log - remove after testing
        return newProgress;
      });
    }, 300);
  };

  const runTraining = async () => {
    if (conversations.length === 0) {
      setError('No conversations available for training');
      stopProgressAnimation();
      return;
    }

    setIsTraining(true);
    setError(null);

    try {
      // Set session ID for training service
      TrainingService.setSessionId(trainingSessionId);
      console.log('🎯 Starting training with session ID:', trainingSessionId);
      console.log('🎯 Training with', conversations.length, 'conversations');

      // Run full pipeline (train + convert)
      const response = await TrainingService.trainAndConvertModel(conversations);
      console.log('🎯 Training and conversion completed:', response);

      // Stop animation and set to 100%
      stopProgressAnimation();
      setProgress(100);

      setTimeout(() => {
        setIsCompleted(true);
        setIsTraining(false);
        setTimeout(() => {
          setShowButtons(true);
          onComplete?.(); // Call onComplete if provided
        }, 300);
      }, 800);

    } catch (error) {
      console.error('Training failed:', error);
      setError(error instanceof Error ? error.message : 'Training failed');
      setIsTraining(false);
      stopProgressAnimation();
    }
  };

  const stopProgressAnimation = () => {
    if (progressIntervalRef.current) {
      console.log('Stopping progress animation');
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleDownload = async () => {
    try {
      await TrainingService.downloadLoRA();
      console.log('LoRA model downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  };

  const handleBackToChat = () => {
    stopProgressAnimation(); // Cleanup on manual exit
    onBackToChat?.();
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.errorTitle}>Training Failed</h1>
          <div style={styles.errorMessage}>{error}</div>
          <div style={styles.buttonContainer}>
            <button 
              onClick={handleBackToChat}
              style={styles.backButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.05)';
              }}
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {!isCompleted ? (
          <>
            <h1 style={styles.title}>Fine Tuning</h1>
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(progress, 100)}%`
                  }}
                />
              </div>
              <div style={styles.progressText}>
                {Math.round(Math.min(progress, 100))}%
              </div>
            </div>
            <div style={styles.statusText}>
              {progress < 50 ? 
                `Training model with ${conversations.length} conversations...` :
                `Converting model to GGUF format...`}
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.completedTitle}>Fine Tuning Complete</h1>
            {showButtons && (
              <div style={styles.buttonContainer}>
                <button 
                  onClick={handleDownload}
                  style={styles.downloadButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b6c37f';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(195, 203, 156, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#c3cb9c';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(195, 203, 156, 0.2)';
                  }}
                >
                  Download LoRA
                </button>
                <button 
                  onClick={handleBackToChat}
                  style={styles.backButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  Back to Chat
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f6f6f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Open Sans', sans-serif",
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%',
    padding: '40px',
  },
  title: {
    color: '#2c2c2c',
    fontSize: '3rem',
    fontWeight: 700,
    margin: '0 0 60px 0',
    letterSpacing: '-0.02em',
  },
  completedTitle: {
    color: '#2c2c2c',
    fontSize: '3rem',
    fontWeight: 700,
    margin: '0 0 60px 0',
    letterSpacing: '-0.02em',
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: '3rem',
    fontWeight: 700,
    margin: '0 0 30px 0',
    letterSpacing: '-0.02em',
  },
  errorMessage: {
    color: '#6b7280',
    fontSize: '1.125rem',
    margin: '0 0 40px 0',
    lineHeight: '1.6',
  },
  progressContainer: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto 20px auto',
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '20px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c3cb9c',
    borderRadius: '6px',
    transition: 'width 0.3s ease-out',
    boxShadow: '0 2px 4px rgba(195, 203, 156, 0.3)',
  },
  progressText: {
    color: '#6b7280',
    fontSize: '1.125rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  statusText: {
    color: '#6b7280',
    fontSize: '1rem',
    marginTop: '20px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  downloadButton: {
    padding: '16px 32px',
    backgroundColor: '#c3cb9c',
    color: '#2c2c2c',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: 600,
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 10px rgba(195, 203, 156, 0.2)',
    minWidth: '140px',
  },
  backButton: {
    padding: '16px 32px',
    backgroundColor: '#f3f4f6',
    color: '#2c2c2c',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: 600,
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    minWidth: '140px',
  },
};

export default FineTune;