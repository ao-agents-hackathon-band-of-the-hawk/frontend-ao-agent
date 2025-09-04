// src/services/textService.ts

export interface TextResponse {
  transcription: string;
  result: string;
}

export class TextService {
  private static readonly SERVER_HOST = import.meta.env.VITE_API_SERVER_HOST;
  private static sessionId: string = '';

  // Set session ID (to be called from App.tsx)
  static setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private static get TEXT_API_URL() {
    console.log('💬 TextService: Building URL with sessionId:', this.sessionId);
    return `https://${this.SERVER_HOST}/~wasi-nn@1.0/infer?&session_id=${this.sessionId}`;
  }

  /**
   * Send text message to API and get AI response
   */
  static async sendMessage(message: string): Promise<TextResponse> {
    try {
      const payload = {
        transcription: message
      };

      const apiUrl = this.TEXT_API_URL;
      console.log('💬 Text API Request URL:', apiUrl);
      console.log('💬 Text API Request Payload:', payload);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Clean both transcription and result text
      const cleanTranscription = this.cleanMarkdownText(data.transcription || message); // Fallback to original message
      const cleanResult = this.cleanMarkdownText(data.result || 'No AI response available');
      
      return {
        transcription: cleanTranscription,
        result: cleanResult
      };
    } catch (error) {
      console.error('Text API error:', error);
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean markdown formatting from text (same as SpeechService)
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
}