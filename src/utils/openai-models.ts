export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  trainingData?: string;
  supportsTemperature?: boolean;
}

export const GPT_MODELS: OpenAIModel[] = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "Newest flagship GPT-4.1 model for general-purpose tasks",
    contextWindow: 200000,
    trainingData: "Up to Dec 2024",
    supportsTemperature: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    description: "Cost-efficient GPT-4.1 variant with strong quality",
    contextWindow: 128000,
    trainingData: "Up to Dec 2024",
    supportsTemperature: true,
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    description: "Fast reasoning model for tool-free tasks",
    contextWindow: 128000,
    trainingData: "Reasoning data (undisclosed)",
    supportsTemperature: false,
  },
  {
    id: "o1",
    name: "o1",
    description: "Reasoning-focused model for complex, multi-step problems",
    contextWindow: 200000,
    trainingData: "Reasoning data (undisclosed)",
    supportsTemperature: false,
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    description: "Lightweight Omni model optimized for efficiency and speed",
    contextWindow: 128000,
    trainingData: "Up to Oct 2023",
    supportsTemperature: true,
  },
  {
    id: "chatgpt-4o-latest",
    name: "chatgpt-4o-latest",
    description: "Alias tracking the most recent ChatGPT-4o release",
    contextWindow: 128000,
    trainingData: "Continuous updates",
    supportsTemperature: true,
  },
  {
    id: "gpt-4o",
    name: "gpt-4o",
    description: "Omni flagship model for text and image inputs",
    contextWindow: 128000,
    trainingData: "Up to Oct 2023",
    supportsTemperature: true,
  },
  {
    id: "gpt-3.5-turbo-0125",
    name: "gpt-3.5-turbo-0125",
    description: "Legacy economical model for lightweight workloads",
    contextWindow: 16385,
    trainingData: "Up to Sep 2021",
    supportsTemperature: true,
  },
];

// Get all available models
export const getAllModels = (): OpenAIModel[] => GPT_MODELS;

// Get model information by ID
export const getModelById = (modelId: string): OpenAIModel | undefined => {
  return GPT_MODELS.find((model) => model.id === modelId);
};

// Get default model
export const getDefaultModel = (): OpenAIModel => {
  return GPT_MODELS[0]; // Returns gpt-4.1 as default
};
