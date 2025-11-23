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
    id: "gpt-4o-2024-11-20",
    name: "GPT-4o (Latest)",
    description: "Latest GPT-4o model with improved performance and reasoning",
    contextWindow: 128000,
    trainingData: "Up to Oct 2023",
    supportsTemperature: true,
  },
  {
    id: "chatgpt-4o-latest",
    name: "ChatGPT-4o Latest",
    description: "Alias tracking the most recent ChatGPT-4o release",
    contextWindow: 128000,
    trainingData: "Continuous updates",
    supportsTemperature: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Omni flagship model for text and image inputs",
    contextWindow: 128000,
    trainingData: "Up to Oct 2023",
    supportsTemperature: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Lightweight Omni model optimized for efficiency and speed",
    contextWindow: 128000,
    trainingData: "Up to Oct 2023",
    supportsTemperature: true,
  },
  {
    id: "o1-2024-12-17",
    name: "o1 (Latest)",
    description: "Latest o1 reasoning model with improved multi-step problem solving",
    contextWindow: 200000,
    trainingData: "Reasoning data",
    supportsTemperature: false,
  },
  {
    id: "o1",
    name: "o1",
    description: "Reasoning-focused model for complex, multi-step problems",
    contextWindow: 200000,
    trainingData: "Reasoning data",
    supportsTemperature: false,
  },
  {
    id: "o1-mini",
    name: "o1 Mini",
    description: "Fast reasoning model for cost-efficient complex tasks",
    contextWindow: 128000,
    trainingData: "Reasoning data",
    supportsTemperature: false,
  },
  {
    id: "o3-mini",
    name: "o3 Mini",
    description: "Advanced reasoning model with improved efficiency",
    contextWindow: 128000,
    trainingData: "Reasoning data",
    supportsTemperature: false,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "GPT-4 Turbo with vision capabilities",
    contextWindow: 128000,
    trainingData: "Up to Apr 2023",
    supportsTemperature: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
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
  return GPT_MODELS[0]; // Returns gpt-4o-2024-11-20 as default
};
