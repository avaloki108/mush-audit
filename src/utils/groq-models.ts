export interface GroqModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  developer: string;
}

export const GROQ_MODELS: GroqModel[] = [
  {
    id: "groq/compound",
    name: "Compound",
    description: "Production-ready agentic AI with web search, code execution, and browser automation",
    contextWindow: 128000,
    developer: "Groq",
  },
  {
    id: "groq/compound-mini",
    name: "Compound Mini",
    description: "Lightweight agentic AI with integrated tools in a single API call",
    contextWindow: 128000,
    developer: "Groq",
  },
  {
    id: "llama-4-scout",
    name: "Llama 4 Scout (17Bx16MoE)",
    description: "Meta Llama 4 with image input, 128K context, function calling, and JSON mode",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick (17Bx128E)",
    description: "Advanced Llama 4 with multimodal support and enhanced reasoning",
    contextWindow: 128000,
    developer: "Meta",
  },
  {
    id: "kimi-k2-instruct-0905",
    name: "Kimi K2 Instruct",
    description: "Moonshot AI model with enhanced agentic coding and frontend development",
    contextWindow: 128000,
    developer: "Moonshot AI",
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 70B",
    description: "DeepSeek's R1 distilled into Llama 70B with strong reasoning",
    contextWindow: 128000,
    developer: "DeepSeek",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    description: "Meta's Llama 3.3 70B with enhanced capabilities",
    contextWindow: 131072,
    developer: "Meta",
  },
  {
    id: "llama-3.3-70b-specdec",
    name: "Llama 3.3 70B SpecDec",
    description: "Llama 3.3 70B with speculative decoding for faster inference",
    contextWindow: 8192,
    developer: "Meta",
  },
  {
    id: "llama-3.1-70b-versatile",
    name: "Llama 3.1 70B Versatile",
    description: "Meta's Llama 3.1 70B optimized for versatile tasks",
    contextWindow: 131072,
    developer: "Meta",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    description: "Fast and efficient 8B parameter model for quick responses",
    contextWindow: 131072,
    developer: "Meta",
  },
  {
    id: "llama-3-groq-70b-tool-use",
    name: "Llama 3 Groq 70B Tool Use",
    description: "Llama 3 70B optimized for tool calling and function use",
    contextWindow: 131072,
    developer: "Groq",
  },
  {
    id: "llama-3-groq-8b-tool-use",
    name: "Llama 3 Groq 8B Tool Use",
    description: "Llama 3 8B optimized for tool calling and function use",
    contextWindow: 131072,
    developer: "Groq",
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
];

export const getGroqModelById = (modelId: string): GroqModel | undefined => {
  return GROQ_MODELS.find((model) => model.id === modelId);
};

export const getDefaultGroqModel = (): GroqModel => {
  return GROQ_MODELS[0];
};
