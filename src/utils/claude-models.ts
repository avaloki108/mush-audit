export interface ClaudeModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  inputTokensPerMinute: number;
  outputTokensPerMinute: number;
  requestsPerMinute: number;
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet (2024-10-22)",
    description: "Latest Claude 3.5 Sonnet release for balanced quality and speed",
    contextWindow: 200000,
    inputTokensPerMinute: 40000,
    outputTokensPerMinute: 8000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-5-sonnet-20240620",
    name: "Claude 3.5 Sonnet (2024-06-20)",
    description: "Earlier Claude 3.5 Sonnet for compatibility",
    contextWindow: 200000,
    inputTokensPerMinute: 40000,
    outputTokensPerMinute: 8000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku (2024-10-22)",
    description: "Latest fast and cost-effective Claude 3.5 Haiku",
    contextWindow: 200000,
    inputTokensPerMinute: 50000,
    outputTokensPerMinute: 10000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus (2024-02-29)",
    description: "Most capable Claude 3 model for complex reasoning tasks",
    contextWindow: 200000,
    inputTokensPerMinute: 20000,
    outputTokensPerMinute: 4000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet (2024-02-29)",
    description: "Balanced Claude 3 model for most use cases",
    contextWindow: 200000,
    inputTokensPerMinute: 40000,
    outputTokensPerMinute: 8000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku (2024-03-07)",
    description: "Fast and efficient Claude 3 Haiku",
    contextWindow: 200000,
    inputTokensPerMinute: 50000,
    outputTokensPerMinute: 10000,
    requestsPerMinute: 50,
  },
];

// Get all available Claude models
export const getAllClaudeModels = (): ClaudeModel[] => CLAUDE_MODELS;

// Get Claude model information by ID
export const getClaudeModelById = (modelId: string): ClaudeModel | undefined => {
  return CLAUDE_MODELS.find((model) => model.id === modelId);
};

// Get default Claude model
export const getDefaultClaudeModel = (): ClaudeModel => {
  return CLAUDE_MODELS[0]; // Returns Claude 3.5 Sonnet as default
}; 
