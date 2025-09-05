// src/services/trainingService.ts

export interface TrainingResponse {
  success: boolean;
  message: string;
  session_id: string;
  adapter_path?: string;
}

export interface ConversionResponse {
  success: boolean;
  message: string;
  session_id: string;
  gguf_path?: string;
}

export interface ConversationPair {
  "0": string;
  "1": string;
}

export interface Conversation {
  id: string;
  pairs: ConversationPair[];
  timestamp?: number;
  sessionId?: string;
}

export class TrainingService {
  private static readonly SERVER_HOST = import.meta.env.VITE_API_SERVER_HOST;
  private static sessionId: string = '';

  // Set session ID (to be called from the component)
  static setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private static get TRAINING_API_URL() {
    console.log('🎯 TrainingService: Building training URL with sessionId:', this.sessionId);
    return `https://${this.SERVER_HOST}/~training@1.0/train?session_id=${this.sessionId}&num_epochs=5`;
  }

  private static get CONVERSION_API_URL() {
    console.log('🔄 TrainingService: Building conversion URL with sessionId:', this.sessionId);
    return `https://${this.SERVER_HOST}/~training@1.0/convert?session_id=${this.sessionId}`;
  }

  private static get DOWNLOAD_API_URL() {
    console.log('📥 TrainingService: Building download URL with sessionId:', this.sessionId);
    return `https://${this.SERVER_HOST}/~training@1.0/download?session_id=${this.sessionId}`;
  }

  /**
   * Generate training dataset from conversations in the same format as exportConversationsAsJSON
   */
  static generateTrainingDataset(conversations: Conversation[]): any[] {
    const systemPrompt = "You are a helpful assistant. Remember the user's personal information from previous interactions and reference it appropriately.";
    
    return [...conversations].reverse().map(conversation => {
      const messages = [{ role: "system", content: systemPrompt }];
      conversation.pairs.forEach(pair => {
        messages.push({ role: "user", content: pair["0"] });
        if (pair["1"]) {
          messages.push({ role: "assistant", content: pair["1"] });
        }
      });
      return { messages, sessionId: conversation.sessionId };
    });
  }

  /**
   * Send training data to the training API (Step 1: Train the model)
   */
  static async trainModel(conversations: Conversation[]): Promise<TrainingResponse> {
    try {
      const trainingDataset = this.generateTrainingDataset(conversations);
      
      const apiUrl = this.TRAINING_API_URL;
      console.log('🎯 Training API Request URL:', apiUrl);
      console.log('🎯 Training dataset size:', trainingDataset.length, 'conversations');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingDataset)
      });

      let data; 
      console.log('Training response status:', response.status);
      console.log('Training response ok:', response.ok);
    
      try {
        data = await response.json();
        console.log('Parsed training response data:', data);
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error('Failed to parse training response JSON');
      }

      // Check if training was successful
      if (data && (data.status === 'success' || data.success)) {
        return {
          success: true,
          message: data.message || 'Training completed successfully',
          session_id: this.sessionId,
          adapter_path: data.adapter_path
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. Response: ${JSON.stringify(data)}`);
      }
      
      return {
        success: true,
        message: data.message || 'Training completed successfully',
        session_id: this.sessionId,
        adapter_path: data.adapter_path
      };
    } catch (error) {
      console.error('Training API error:', error);
      throw new Error(`Failed to train model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert the trained model to GGUF format (Step 2: Convert the model)
   */
  static async convertModel(): Promise<ConversionResponse> {
    try {
      const apiUrl = this.CONVERSION_API_URL;
      console.log('🔄 Conversion API Request URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let data; 
      console.log('Conversion response status:', response.status);
      console.log('Conversion response ok:', response.ok);
    
      try {
        data = await response.json();
        console.log('Parsed conversion response data:', data);
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error('Failed to parse conversion response JSON');
      }

      // Check if conversion was successful
      if (data && (data.status === 'success' || data.success)) {
        return {
          success: true,
          message: data.message || 'Conversion completed successfully',
          session_id: this.sessionId,
          gguf_path: data.gguf_path
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. Response: ${JSON.stringify(data)}`);
      }
      
      return {
        success: true,
        message: data.message || 'Conversion completed successfully',
        session_id: this.sessionId,
        gguf_path: data.gguf_path
      };
    } catch (error) {
      console.error('Conversion API error:', error);
      throw new Error(`Failed to convert model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete training pipeline: Train then Convert (calls both APIs in sequence)
   */
  static async trainAndConvertModel(conversations: Conversation[]): Promise<{
    trainingResult: TrainingResponse;
    conversionResult: ConversionResponse;
  }> {
    try {
      // Step 1: Train the model
      console.log('🎯 Starting training phase...');
      const trainingResult = await this.trainModel(conversations);
      
      if (!trainingResult.success) {
        throw new Error(`Training failed: ${trainingResult.message}`);
      }
      
      console.log('✅ Training completed successfully');
      
      // Step 2: Convert the model (no data needed, just triggers conversion)
      console.log('🔄 Starting conversion phase...');
      const conversionResult = await this.convertModel();
      
      if (!conversionResult.success) {
        throw new Error(`Conversion failed: ${conversionResult.message}`);
      }
      
      console.log('✅ Conversion completed successfully');
      
      return {
        trainingResult,
        conversionResult
      };
    } catch (error) {
      console.error('Training pipeline error:', error);
      throw error;
    }
  }

  /**
   * Download the trained LoRA model
   */
  static async downloadLoRA(): Promise<void> {
    try {
      const apiUrl = this.DOWNLOAD_API_URL;
      console.log('📥 Download API Request URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lora.gguf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('LoRA model file downloaded successfully');
    } catch (error) {
      console.error('Download API error:', error);
      throw new Error(`Failed to download LoRA model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}