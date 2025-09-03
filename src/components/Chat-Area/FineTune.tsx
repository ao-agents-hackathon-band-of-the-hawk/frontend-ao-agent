import React, { useState, useEffect } from 'react';

interface FineTuneProps {
  onComplete?: () => void;
  onBackToChat?: () => void;
}

const FineTune: React.FC<FineTuneProps> = ({ onComplete, onBackToChat }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Progress animation
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 2 + 0.5; // Random increment between 0.5 and 2.5
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCompleted(true);
            setTimeout(() => {
              setShowButtons(true);
            }, 300);
          }, 800);
          return 100;
        }
        
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isCompleted]);

  // Download the lora.gguf file
  const handleDownload = () => {
   
    const loraContent = new Uint8Array([
      0x47, 0x47, 0x55, 0x46, // "GGUF" magic bytes
      0x00, 0x00, 0x00, 0x03, // version
      0x00, 0x00, 0x00, 0x00, // tensor_count
      0x00, 0x00, 0x00, 0x00, // metadata_kv_count
    ]);
    
    const blob = new Blob([loraContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lora.gguf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('LoRA model file downloaded: lora.gguf');
  };

  const handleBackToChat = () => {
    onBackToChat?.();
  };

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
                  Download
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
  progressContainer: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
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