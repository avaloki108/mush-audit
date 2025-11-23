export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash (Experimental)",
    description: "Latest experimental Gemini 2.0 Flash with multimodal capabilities",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-flash-thinking-exp-1219",
    name: "Gemini 2.0 Flash Thinking",
    description: "Thinking-enabled Gemini 2.0 Flash with step-by-step reasoning",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-pro-exp",
    name: "Gemini 2.0 Pro (Experimental)",
    description: "Experimental Gemini 2.0 Pro with 2M token context for complex tasks",
    contextWindow: 2097152,
  },
  {
    id: "gemini-1.5-pro-latest",
    name: "Gemini 1.5 Pro",
    description: "Stable Gemini 1.5 Pro with ultra-long context",
    contextWindow: 2097152,
  },
  {
    id: "gemini-1.5-flash-latest",
    name: "Gemini 1.5 Flash",
    description: "Latest Gemini 1.5 Flash for speed and scale",
    contextWindow: 1048576,
  },
  {
    id: "gemini-1.5-flash-8b",
    name: "Gemini 1.5 Flash 8B",
    description: "Smallest Gemini 1.5 Flash 8B for cost-sensitive tasks",
    contextWindow: 1048576,
  },
];

export const getGeminiModelById = (
  modelId: string
): GeminiModel | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
};
