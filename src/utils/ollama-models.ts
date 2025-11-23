export interface OllamaModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  developer: string;
}

export const OLLAMA_MODELS: OllamaModel[] = [
  {
    id: "llama3.3:latest",
    name: "Llama 3.3",
    description: "Meta's latest Llama 3.3 model running locally",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama3.1:latest",
    name: "Llama 3.1",
    description: "Meta's Llama 3.1 model running locally",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama3:latest",
    name: "Llama 3",
    description: "Meta's Llama 3 model running locally",
    contextWindow: 8192,
    developer: "Meta",
  },
  {
    id: "llama2:latest",
    name: "Llama 2",
    description: "Meta's Llama 2 model running locally",
    contextWindow: 4096,
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
    name: "Mixtral",
    description: "Mistral AI's mixture of experts model",
    contextWindow: 32768,
    developer: "Mistral AI",
  },
  {
    id: "codellama:latest",
    name: "Code Llama",
    description: "Meta's specialized code model",
    contextWindow: 16384,
    developer: "Meta",
  },
  {
    id: "qwen2.5-coder:latest",
    name: "Qwen 2.5 Coder",
    description: "Alibaba's specialized coding model",
    contextWindow: 32768,
    developer: "Alibaba",
  },
  {
    id: "deepseek-coder:latest",
    name: "DeepSeek Coder",
    description: "DeepSeek's specialized coding model",
    contextWindow: 16384,
    developer: "DeepSeek",
  },
  {
    id: "phi3:latest",
    name: "Phi-3",
    description: "Microsoft's small language model",
    contextWindow: 4096,
    developer: "Microsoft",
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
