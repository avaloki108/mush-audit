export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "gemini-2.0-flash-thinking-exp",
    description: "Thinking-enabled Gemini 2.0 Flash experimental model",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-flash",
    name: "gemini-2.0-flash",
    description: "Gemini 2.0 Flash production model for fast responses",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-flash-lite-preview",
    name: "gemini-2.0-flash-lite-preview",
    description: "Gemini 2.0 Flash Lite preview model for low latency",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-pro-exp",
    name: "gemini-2.0-pro-exp",
    description: "Experimental Gemini 2.0 Pro with highest quality outputs",
    contextWindow: 2097152,
  },
  {
    id: "gemini-1.5-pro-latest",
    name: "gemini-1.5-pro-latest",
    description: "Stable Gemini 1.5 Pro with ultra-long context",
    contextWindow: 2097152,
  },
  {
    id: "gemini-1.5-flash-latest",
    name: "gemini-1.5-flash-latest",
    description: "Latest Gemini 1.5 Flash for speed and scale",
    contextWindow: 1048576,
  },
  {
    id: "gemini-1.5-flash-8b-latest",
    name: "gemini-1.5-flash-8b-latest",
    description: "Smallest Gemini 1.5 Flash 8B for cost-sensitive tasks",
    contextWindow: 1048576,
  },
];

export const getGeminiModelById = (
  modelId: string
): GeminiModel | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
};
