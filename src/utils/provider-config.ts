import { AIConfig } from "@/types/ai";
import { GPT_MODELS } from "./openai-models";
import { CLAUDE_MODELS } from "./claude-models";
import { GEMINI_MODELS } from "./gemini-models";
import { XAI_MODELS } from "./xai-models";
import { GROQ_MODELS } from "./groq-models";
import { OLLAMA_MODELS } from "./ollama-models";

export const PROVIDERS = {
  gpt: {
    name: "OpenAI GPT",
    models: GPT_MODELS,
    keyName: "OpenAI API Key",
    keyPlaceholder: "Enter your OpenAI API key",
    getKeyLink: "https://platform.openai.com/api-keys",
    getKeyText: "Get one from OpenAI Platform",
    defaultModel: GPT_MODELS[0].id,
  },
  claude: {
    name: "Anthropic Claude",
    models: CLAUDE_MODELS,
    keyName: "Claude API Key",
    keyPlaceholder: "Enter your Claude API key",
    getKeyLink: "https://console.anthropic.com/account/keys",
    getKeyText: "Get one from Anthropic Console",
    defaultModel: CLAUDE_MODELS[0].id,
  },
  gemini: {
    name: "Google Gemini",
    models: GEMINI_MODELS,
    keyName: "Gemini API Key",
    keyPlaceholder: "Enter your Gemini API key",
    getKeyLink: "https://ai.google.dev/gemini-api/docs/api-key",
    getKeyText: "Get one from Gemini Console",
    defaultModel: GEMINI_MODELS[0].id,
  },
  xai: {
    name: "xAI Grok",
    models: XAI_MODELS,
    keyName: "xAI API Key",
    keyPlaceholder: "Enter your xAI API key",
    getKeyLink: "https://x.ai",
    getKeyText: "Get one from xAI Platform",
    defaultModel: XAI_MODELS[0].id,
  },
  groq: {
    name: "Groq",
    models: GROQ_MODELS,
    keyName: "Groq API Key",
    keyPlaceholder: "Enter your Groq API key",
    getKeyLink: "https://console.groq.com/keys",
    getKeyText: "Get one from Groq Console",
    defaultModel: GROQ_MODELS[0].id,
  },
  ollama: {
    name: "Ollama (Local)",
    models: OLLAMA_MODELS,
    keyName: "Ollama URL",
    keyPlaceholder: "Enter your Ollama URL (e.g., http://localhost:11434)",
    getKeyLink: "https://ollama.ai",
    getKeyText: "Install Ollama locally",
    defaultModel: OLLAMA_MODELS[0].id,
  },
} as const;

export const getProviderInfo = (provider: AIConfig['provider']) => PROVIDERS[provider];

export const getApiKey = (config: AIConfig) => {
  const keys = {
    gpt: config.gptKey,
    claude: config.claudeKey,
    gemini: config.geminiKey,
    xai: config.xaiKey,
    groq: config.groqKey,
    ollama: config.ollamaUrl,
  };
  return keys[config.provider] || "";
}; 