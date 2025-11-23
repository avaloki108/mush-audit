export interface GroqModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  developer: string;
}

export const GROQ_MODELS: GroqModel[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Meta's latest Llama 3.3 70B model with enhanced capabilities",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama-3.1-70b-versatile",
    name: "Llama 3.1 70B",
    description: "Meta's Llama 3.1 70B model optimized for versatile tasks",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    description: "Fast and efficient 8B parameter model for quick responses",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    description: "Meta's Llama 3 70B model with 8K context window",
    contextWindow: 8192,
    developer: "Meta",
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    description: "Efficient 8B parameter model with 8K context",
    contextWindow: 8192,
    developer: "Meta",
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    description: "Mistral AI's mixture of experts model",
    contextWindow: 32768,
    developer: "Mistral AI",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    description: "Google's Gemma 2 9B instruction-tuned model",
    contextWindow: 8192,
    developer: "Google",
  },
  {
    id: "gemma-7b-it",
    name: "Gemma 7B",
    description: "Google's Gemma 7B instruction-tuned model",
    contextWindow: 8192,
    developer: "Google",
  },
];

export const getGroqModelById = (modelId: string): GroqModel | undefined => {
  return GROQ_MODELS.find((model) => model.id === modelId);
};

export const getDefaultGroqModel = (): GroqModel => {
  return GROQ_MODELS[0];
};
