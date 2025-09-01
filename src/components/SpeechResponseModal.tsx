// src/components/SpeechResponseModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpeechResponse } from '../services/speechService';

interface SpeechResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  response?: SpeechResponse;
  isLoading?: boolean;
}

const SpeechResponseModal: React.FC<SpeechResponseModalProps> = ({
  isOpen,
  onClose,
  response,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ backgroundColor: '#C3CB9C' }} className="text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Voice Conversation</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C3CB9C' }}></div>
                <span className="ml-3 text-gray-600">Processing your speech...</span>
              </div>
            ) : response ? (
              <div className="space-y-4">
                {/* User Message (Transcription) */}
                <div className="flex justify-end">
                  <div style={{ backgroundColor: '#C3CB9C' }} className="text-white rounded-lg px-4 py-2 max-w-xs">
                    <div className="text-xs opacity-75 mb-1">You said:</div>
                    <div>{response.transcription}</div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-xs">
                    <div className="text-xs text-gray-500 mb-1">AI Response:</div>
                    <div>{response.result}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No response available
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && response && (
            <div className="bg-gray-50 px-4 py-3 border-t">
              <button
                onClick={onClose}
                style={{ backgroundColor: '#C3CB9C' }}
                className="w-full hover:opacity-90 text-white py-2 px-4 rounded-md transition-opacity"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpeechResponseModal;