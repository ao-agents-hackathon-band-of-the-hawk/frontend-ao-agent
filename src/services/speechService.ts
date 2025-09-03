// src/services/speechService.ts

import { MicVAD } from '@ricky0123/vad-web';

export interface SpeechResponse {
  transcription: string;
  result: string;
}

export class SpeechService {
  private static readonly SERVER_HOST = import.meta.env.VITE_API_SERVER_HOST;
  private static sessionId: string = '';
  private static currentAudio: HTMLAudioElement | null = null;
  private static isPlayingTTS: boolean = false;
  private static interruptedText: string = '';

  // Set session ID (to be called from App.tsx)
  static setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private static get SPEECH_TO_TEXT_API_URL() {
    console.log('🎤 SpeechService: Building URL with sessionId:', this.sessionId);
    const baseUrl = `https://${this.SERVER_HOST}/~speech-to-text@1.0/transcribe/infer~wasi-nn@1.0?model-id=gemma&session_id=${this.sessionId}`;
    return this.interruptedText ? `${baseUrl}&prompt=${encodeURIComponent(this.interruptedText)}` : baseUrl;
  }

  private static get TEXT_TO_SPEECH_API_URL() {
    console.log('🔊 SpeechService: Building TTS URL with sessionId:', this.sessionId);
    return `https://${this.SERVER_HOST}/~text-to-speech@1.0/generate?session_id=${this.sessionId}`;
  }

  /**
   * Send audio to speech-to-text API and get transcription + AI response
   */
  static async transcribeAudio(audioBlob: Blob): Promise<SpeechResponse> {
    try {
      const apiUrl = this.SPEECH_TO_TEXT_API_URL;
      console.log('🎙️ Speech-to-Text API Request URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: audioBlob,
        headers: {
          'Content-Type': 'audio/wav',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Clear interrupted text after use
      this.interruptedText = '';
      
      // Clean both transcription and result text
      const cleanTranscription = this.cleanMarkdownText(data.transcription || 'No transcription available');
      const cleanResult = this.cleanMarkdownText(data.result || 'No AI response available');
      
      return {
        transcription: cleanTranscription,
        result: cleanResult
      };
    } catch (error) {
      console.error('Speech API error:', error);
      throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean markdown formatting from text
   */
  private static cleanMarkdownText(text: string): string {
    return text
      .trim()
      // Remove thinking tokens
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
      .replace(/__(.*?)__/g, '$1') // Remove bold __text__
      .replace(/_(.*?)_/g, '$1') // Remove italic _text_
      .replace(/`{3}[\s\S]*?`{3}/g, '') // Remove code blocks ```code```
      .replace(/`(.*?)`/g, '$1') // Remove inline code `code`
      .replace(/#{1,6}\s/g, '') // Remove headers # ## ### etc.
      .replace(/>\s/g, '') // Remove blockquotes >
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links [text](url) - keep text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images ![alt](url)
      .replace(/^\s*[-*+]\s/gm, '') // Remove list bullets - * +
      .replace(/^\s*\d+\.\s/gm, '') // Remove numbered lists 1. 2. etc.
      .replace(/\|/g, ' ') // Remove table separators |
      .replace(/[-=]{3,}/g, '') // Remove horizontal rules ---
      .replace(/~{2}(.*?)~{2}/g, '$1') // Remove strikethrough ~~text~~
      .replace(/\n/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }

  /**
   * Calculate character position based on audio playback time
   */
  private static calculateCharacterPosition(currentTime: number, totalTime: number, text: string): number {
    const progress = currentTime / totalTime;
    const charPosition = Math.floor(progress * text.length);
    return Math.min(charPosition, text.length - 1);
  }

  /**
   * Find the last whitespace character before the given position
   */
  private static findLastWhitespace(text: string, position: number): number {
    for (let i = position; i >= 0; i--) {
      if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
        return i;
      }
    }
    return position;
  }

  /**
   * Create interrupted text with marker
   */
  private static createInterruptedText(text: string, interruptPosition: number): string {
    const whitespacePos = this.findLastWhitespace(text, interruptPosition);
    const beforeInterrupt = text.substring(0, whitespacePos).trim();
    return `${beforeInterrupt} {The AI response was interrupted by the question that follows}`;
  }

  /**
   * Check if user is speaking using VAD from @ricky0123/vad-web
   */
  private static async startVADMonitoring(): Promise<{ stop: () => void; onSpeechDetected: (callback: () => void) => void }> {
    try {
      const myVad = await MicVAD.new({
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.3,
        minSpeechFrames: 3,
        preSpeechPadFrames: 4,
        redemptionFrames: 10,
        onSpeechStart: () => {
          console.log('Speech started during TTS');
        },
        onSpeechEnd: (audio: Float32Array) => {
          console.log('Speech ended during TTS, audio length:', audio.length);
        },
        onVADMisfire: () => {
          console.log('VAD misfire during TTS');
        },
      });

      let speechCallback: (() => void) | null = null;
      let isSpeechDetected = false;
      let detectionTimeout: NodeJS.Timeout | null = null;

      myVad.options.onSpeechStart = () => {
        isSpeechDetected = true;
        console.log('Speech start detected');

        if (detectionTimeout) {
          clearTimeout(detectionTimeout);
        }

        detectionTimeout = setTimeout(() => {
          if (isSpeechDetected) {
            console.log('Continuous speech detected for 1s - interrupting');
            speechCallback?.();
          }
        }, 1000); // Interrupt after 1 second of continuous speech
      };

      myVad.options.onSpeechEnd = () => {
        isSpeechDetected = false;
        console.log('Speech end detected');
        if (detectionTimeout) {
          clearTimeout(detectionTimeout);
          detectionTimeout = null;
        }
      };

      myVad.start();

      return {
        stop: () => {
          myVad.pause();
          if ('destroy' in myVad) {
            (myVad as any).destroy();
          }
          if (detectionTimeout) {
            clearTimeout(detectionTimeout);
          }
        },
        onSpeechDetected: (callback: () => void) => {
          speechCallback = callback;
        }
      };
    } catch (error) {
      console.error('Failed to start VAD monitoring:', error);
      // Return dummy implementation if VAD setup fails
      return {
        stop: () => {},
        onSpeechDetected: () => {}
      };
    }
  }

  /**
   * Convert text to speech using the TTS API and play the audio with interruption support
   */
  static async speakText(text: string, onInterruptionCallback?: () => void): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Clean the text using the same method
        const cleanText = this.cleanMarkdownText(text);
        
        // Create JSON payload
        const payload = {
          result: cleanText
        };

        const apiUrl = this.TEXT_TO_SPEECH_API_URL;
        console.log('🔊 Text-to-Speech API Request URL:', apiUrl);
        console.log('🔊 Text-to-Speech API Request Payload:', payload);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/wav, audio/*, */*',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`TTS API error! status: ${response.status}`);
        }

        // Get the audio data as an ArrayBuffer
        const audioArrayBuffer = await response.arrayBuffer();
        
        if (audioArrayBuffer.byteLength === 0) {
          throw new Error('Received empty audio response from TTS API');
        }

        console.log(`Received audio data: ${audioArrayBuffer.byteLength} bytes`);

        // Create a Blob from the audio data
        const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/wav' });
        
        // Optional: Download the received audio file (comment out if not needed for production)
        // const downloadUrl = URL.createObjectURL(audioBlob);
        // const downloadLink = document.createElement('a');
        // downloadLink.href = downloadUrl;
        // downloadLink.download = `tts_response_${Date.now()}.wav`;
        // document.body.appendChild(downloadLink);
        // downloadLink.click();
        // document.body.removeChild(downloadLink);
        // URL.revokeObjectURL(downloadUrl);
        
        // Create an audio element and play it with VAD monitoring
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        
        let vadMonitor: { stop: () => void; onSpeechDetected: (callback: () => void) => void } | null = null;
        let wasInterrupted = false;
        
        // Set up event handlers
        audio.oncanplaythrough = async () => {
          console.log('Audio ready to play');
          
          // Start VAD monitoring when audio starts playing
          vadMonitor = await this.startVADMonitoring();
          vadMonitor.onSpeechDetected(() => {
            console.log('Speech detected during TTS playback - stopping audio and starting new recording');
            
            // Calculate interruption position
            const currentTime = audio.currentTime;
            const totalTime = audio.duration;
            const charPosition = this.calculateCharacterPosition(currentTime, totalTime, cleanText);
            
            // Create interrupted text
            this.interruptedText = this.createInterruptedText(cleanText, charPosition);
            console.log('Interrupted text:', this.interruptedText);
            
            // Stop the audio
            audio.pause();
            wasInterrupted = true;
            
            // Clean up
            vadMonitor?.stop();
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            this.isPlayingTTS = false;
            
            // Trigger new recording via callback
            if (onInterruptionCallback) {
              onInterruptionCallback();
            }
            
            resolve();
          });
          
          this.isPlayingTTS = true;
          
          audio.play().catch(error => {
            console.error('Error playing audio:', error);
            vadMonitor?.stop();
            reject(error);
          });
        };
        
        audio.onended = () => {
          console.log('Audio playback completed');
          vadMonitor?.stop();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.isPlayingTTS = false;
          if (!wasInterrupted) {
            resolve();
          }
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          vadMonitor?.stop();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.isPlayingTTS = false;
          reject(error);
        };

        // Load the audio
        audio.load();
        
      } catch (error) {
        console.error('TTS API error:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop any ongoing audio playback
   */
  static stopSpeaking(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.currentAudio = null;
    this.isPlayingTTS = false;
  }

  /**
   * Check if TTS is currently playing
   */
  static isCurrentlyPlaying(): boolean {
    return this.isPlayingTTS;
  }
}