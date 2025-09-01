// src/services/speechService.ts

export interface SpeechResponse {
  transcription: string;
  result: string;
}

export class SpeechService {
  private static readonly API_URL = "http://216.81.248.133:8734/~speech-to-text@1.0/transcribe/infer~wasi-nn@1.0?model-id=gemma";

  /**
   * Send audio to speech-to-text API and get transcription + AI response
   */
  static async transcribeAudio(audioBlob: Blob): Promise<SpeechResponse> {
    try {
      const response = await fetch(this.API_URL, {
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
      
      // Assuming the API returns { transcription: string, result: string }
      // Adjust this based on actual API response structure
      return {
        transcription: data.transcription || 'No transcription available',
        result: data.result || 'No AI response available'
      };
    } catch (error) {
      console.error('Speech API error:', error);
      throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read text aloud using Web Speech API
   */
  static speakText(text: string): void {
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
      console.warn('Speech synthesis not supported in this browser');
    }
  }
}