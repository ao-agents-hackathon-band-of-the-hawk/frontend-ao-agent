// src/services/speechService.ts

export interface SpeechResponse {
  transcription: string;
  result: string;
}

export class SpeechService {
  private static readonly SERVER_HOST = import.meta.env.VITE_API_SERVER_HOST;
  private static readonly SPEECH_TO_TEXT_API_URL = `http://${this.SERVER_HOST}/~speech-to-text@1.0/transcribe/infer~wasi-nn@1.0?model-id=gemma`;
  private static readonly TEXT_TO_SPEECH_API_URL = `http://${this.SERVER_HOST}/~text-to-speech@1.0/generate`;

  /**
   * Send audio to speech-to-text API and get transcription + AI response
   */
  static async transcribeAudio(audioBlob: Blob): Promise<SpeechResponse> {
    try {
      const response = await fetch(this.SPEECH_TO_TEXT_API_URL, {
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
      
      // Clean both transcription and result text
      const cleanTranscription = this.cleanMarkdownText(data.transcription || 'No transcription available');
      const cleanResult = this.cleanMarkdownText(data.result || 'No AI response available');
      
      // Assuming the API returns { transcription: string, result: string }
      // Adjust this based on actual API response structure
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
   * Convert text to speech using the TTS API and play the audio
   */
  static async speakText(text: string): Promise<void> {
    try {
      // Clean the text using the same method
      const cleanText = this.cleanMarkdownText(text);
      
      // Create JSON payload
      const payload = {
        result: cleanText
      };

      console.log('Sending JSON to TTS API:', payload);
      
      const response = await fetch(this.TEXT_TO_SPEECH_API_URL, {
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
      
      // Download the received audio file
      const downloadUrl = URL.createObjectURL(audioBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `tts_response_${Date.now()}.wav`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      
      // Create an audio element and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Set up event handlers
      audio.oncanplaythrough = () => {
        console.log('Audio ready to play');
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
      };

      // Load the audio
      audio.load();
      
    } catch (error) {
      console.error('TTS API error:', error);
      
      // Fallback to Web Speech API if TTS API fails
      console.log('Falling back to Web Speech API');
      this.fallbackToWebSpeech(text);
    }
  }

  /**
   * Fallback to Web Speech API if TTS API fails
   */
  private static fallbackToWebSpeech(text: string): void {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Optional: Set a specific voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Both TTS API and Speech synthesis failed/not supported');
    }
  }

  /**
   * Stop any ongoing audio playback or speech synthesis
   */
  static stopSpeaking(): void {
    // Stop Web Speech API if it's running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop all audio elements (this is a basic approach)
    // In a more sophisticated implementation, you'd track the audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
}