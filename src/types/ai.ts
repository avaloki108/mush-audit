export interface AIConfig {
  provider: 'gpt' | 'claude' | 'gemini' | 'xai' | 'groq' | 'ollama';
  gptKey: string;
  claudeKey: string;
  geminiKey: string;
  xaiKey: string;
  groqKey: string;
  ollamaUrl: string;
  selectedModel: string;
  language: string;
  superPrompt: boolean;
}
