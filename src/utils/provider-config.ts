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
  // Prefer user-specified config values; fall back to environment variables.
  // NOTE: Only NEXT_PUBLIC_* variables are available client-side. Non-public ones will be undefined here.
  const envFallbacks: Record<AIConfig['provider'], string | undefined> = {
    gpt: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
    claude: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    gemini: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
    xai: process.env.NEXT_PUBLIC_XAI_API_KEY || process.env.XAI_API_KEY,
    groq: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
    ollama: config.ollamaUrl, // Ollama URL stays in config
  };

  const keys = {
    gpt: config.gptKey || envFallbacks.gpt || "",
    claude: config.claudeKey || envFallbacks.claude || "",
    gemini: config.geminiKey || envFallbacks.gemini || "",
    xai: config.xaiKey || envFallbacks.xai || "",
    groq: config.groqKey || envFallbacks.groq || "",
    ollama: config.ollamaUrl,
  } as const;
  return keys[config.provider];
}; 