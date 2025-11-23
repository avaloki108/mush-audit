export interface OllamaModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  developer: string;
}

export const OLLAMA_MODELS: OllamaModel[] = [
  {
    id: "deepseek-r1:latest",
    name: "DeepSeek R1",
    description: "DeepSeek's R1 reasoning model with strong performance",
    contextWindow: 64000,
    developer: "DeepSeek",
  },
  {
    id: "llama3.3:latest",
    name: "Llama 3.3",
    description: "Meta's latest Llama 3.3 70B model running locally",
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
    id: "qwen2.5:latest",
    name: "Qwen 2.5",
    description: "Alibaba's latest Qwen 2.5 model with improved capabilities",
    contextWindow: 131072,
    developer: "Alibaba",
  },
  {
    id: "qwen2.5-coder:latest",
    name: "Qwen 2.5 Coder",
    description: "Alibaba's specialized coding model with enhanced code understanding",
    contextWindow: 131072,
    developer: "Alibaba",
  },
  {
    id: "deepseek-coder-v2:latest",
    name: "DeepSeek Coder V2",
    description: "DeepSeek's latest specialized coding model",
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
    id: "phi4:latest",
    name: "Phi-4",
    description: "Microsoft's latest small language model with strong reasoning",
    contextWindow: 16384,
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
