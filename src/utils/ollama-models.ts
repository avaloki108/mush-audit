export interface OllamaModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  developer: string;
}

export const OLLAMA_MODELS: OllamaModel[] = [
  {
    id: "llama4-scout:latest",
    name: "Llama 4 Scout",
    description: "Multimodal MoE model with long-context handling and vision capabilities",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "kimi-k2-instruct-0905:latest",
    name: "Kimi K2 Instruct",
    description: "State-of-the-art 32B activated / 1T total parameter MoE model",
    contextWindow: 128000,
    developer: "Moonshot AI",
  },
  {
    id: "deepseek-v3.1-terminus:latest",
    name: "DeepSeek V3.1 Terminus",
    description: "671B parameter hybrid model with thinking and non-thinking modes",
    contextWindow: 128000,
    developer: "DeepSeek",
  },
  {
    id: "deepseek-r1:latest",
    name: "DeepSeek R1",
    description: "70B reasoning model with chain-of-thought prompting and thinking mode",
    contextWindow: 64000,
    developer: "DeepSeek",
  },
  {
    id: "qwen2.5:latest",
    name: "Qwen 2.5",
    description: "Coding and vision model with tool use, streaming, and multilingual support",
    contextWindow: 131072,
    developer: "Alibaba",
  },
  {
    id: "qwen2.5-vl:latest",
    name: "Qwen 2.5 VL",
    description: "Vision-language model with document OCR and multilingual translation",
    contextWindow: 131072,
    developer: "Alibaba",
  },
  {
    id: "qwen2.5-coder:latest",
    name: "Qwen 2.5 Coder",
    description: "Specialized coding model with enhanced code understanding",
    contextWindow: 131072,
    developer: "Alibaba",
  },
  {
    id: "gemma3:latest",
    name: "Gemma 3",
    description: "Multimodal model with multiple image inputs and sliding window attention",
    contextWindow: 128000,
    developer: "Google",
  },
  {
    id: "llama3.3:latest",
    name: "Llama 3.3",
    description: "Meta's Llama 3.3 70B model running locally",
    contextWindow: 131072,
    developer: "Meta",
  },
  {
    id: "llama3.1:latest",
    name: "Llama 3.1",
    description: "Meta's Llama 3.1 model running locally",
    contextWindow: 131072,
    developer: "Meta",
  },
  {
    id: "phi4:latest",
    name: "Phi-4",
    description: "14B parameter lightweight model optimized for edge devices",
    contextWindow: 16384,
    developer: "Microsoft",
  },
  {
    id: "llava:latest",
    name: "LLaVA",
    description: "General-purpose vision model with improved text recognition (7B/13B/34B)",
    contextWindow: 16384,
    developer: "LLaVA",
  },
  {
    id: "deepseek-coder-v2:latest",
    name: "DeepSeek Coder V2",
    description: "Specialized coding model with enhanced capabilities",
    contextWindow: 64000,
    developer: "DeepSeek",
  },
  {
    id: "codellama:latest",
    name: "Code Llama",
    description: "Meta's specialized code model",
    contextWindow: 16384,
    developer: "Meta",
  },
  {
    id: "mistral:latest",
    name: "Mistral",
    description: "Mistral AI's model running locally",
    contextWindow: 32768,
    developer: "Mistral AI",
  },
  {
    id: "mixtral:latest",
    name: "Mixtral 8x7B",
    description: "Mistral AI's mixture of experts model",
    contextWindow: 32768,
    developer: "Mistral AI",
  },
  {
    id: "gemma2:latest",
    name: "Gemma 2",
    description: "Google's Gemma 2 model running locally",
    contextWindow: 8192,
    developer: "Google",
  },
];

export const getOllamaModelById = (modelId: string): OllamaModel | undefined => {
  return OLLAMA_MODELS.find((model) => model.id === modelId);
};

export const getDefaultOllamaModel = (): OllamaModel => {
  return OLLAMA_MODELS[0];
};
