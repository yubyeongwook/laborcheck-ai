import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Unified AI Client for Zero Data Leakage Enterprise SaaS
 * Supports switching between Local Ollama (qwen2.5:14b / deepseek-r1:14b)
 * and Google Gemini API in Privacy Mode.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIClientOptions {
  provider?: 'OLLAMA' | 'GEMINI';
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  temperature?: number;
}

export class UnifiedAIClient {
  private provider: 'OLLAMA' | 'GEMINI';
  private ollamaBaseUrl: string;
  private ollamaModel: string;
  private geminiApiKey: string;
  private geminiModel: string;
  private temperature: number;

  constructor(options: AIClientOptions = {}) {
    this.provider = options.provider || (process.env.AI_PROVIDER as 'OLLAMA' | 'GEMINI') || 'OLLAMA';
    this.ollamaBaseUrl = options.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = options.ollamaModel || process.env.OLLAMA_MODEL || 'qwen2.5:14b';
    this.geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.geminiModel = options.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    this.temperature = options.temperature ?? 0.1; // Low temperature for deterministic legal/labor responses
  }

  /**
   * Main chat generation endpoint supporting flexible backend switching
   */
  async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (this.provider === 'OLLAMA') {
      return this.callOllama(messages);
    } else {
      return this.callGemini(messages);
    }
  }

  /**
   * Call Local Ollama API (Zero external data transmission)
   */
  private async callOllama(messages: ChatMessage[]): Promise<string> {
    const url = new URL(`${this.ollamaBaseUrl}/api/chat`);
    const payload = JSON.stringify({
      model: this.ollamaModel,
      messages: messages,
      stream: false,
      options: {
        temperature: this.temperature,
      },
    });

    return new Promise((resolve, reject) => {
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.message?.content || '');
              } catch (e) {
                reject(new Error(`[OllamaError] Failed to parse JSON response: ${e}`));
              }
            } else {
              reject(new Error(`[OllamaError] HTTP ${res.statusCode}: ${data}`));
            }
          });
        }
      );

      req.on('error', (err) => {
        reject(new Error(`[OllamaConnectionError] ${err.message}. Make sure Ollama server is running at ${this.ollamaBaseUrl}`));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Call Google Gemini API (Enterprise Privacy API Endpoint)
   */
  private async callGemini(messages: ChatMessage[]): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('[GeminiError] GEMINI_API_KEY is not configured in environment variables.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
    
    // Separate system message if exists
    const systemMsg = messages.find((m) => m.role === 'system');
    const conversation = messages.filter((m) => m.role !== 'system');

    const contents = conversation.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: this.temperature,
      },
    };

    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const payload = JSON.stringify(body);
    const url = new URL(endpoint);

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                resolve(text);
              } catch (e) {
                reject(new Error(`[GeminiError] Failed to parse JSON response: ${e}`));
              }
            } else {
              reject(new Error(`[GeminiError] HTTP ${res.statusCode}: ${data}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(new Error(`[GeminiConnectionError] ${err.message}`)));
      req.write(payload);
      req.end();
    });
  }
}
