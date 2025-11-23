export interface AIConfig {
  provider: 'gpt' | 'claude' | 'gemini' | 'xai' | 'groq' | 'ollama' | 'mistral';
  gptKey: string;
  claudeKey: string;
  geminiKey: string;
  xaiKey: string;
  groqKey: string;
  ollamaUrl: string;
  mistralKey: string;
  selectedModel: string;
  language: string;
  superPrompt: boolean;
}
