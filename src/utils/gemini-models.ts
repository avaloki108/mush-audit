export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-3.0-pro",
    name: "Gemini 3.0 Pro",
    description: "Most powerful AI model as of Nov 2025, tops 19/20 benchmarks and LMArena leaderboard",
    contextWindow: 2097152,
  },
  {
    id: "gemini-3.0-pro-image",
    name: "Gemini 3.0 Pro Image (Nano Banana Pro)",
    description: "Enhanced version with improved text rendering and real-world knowledge",
    contextWindow: 2097152,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Rapid creative workflows with image generation and multi-turn editing",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "Cost-effective variant for high-throughput tasks",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    description: "Supports rapid creative workflows with image generation",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.5-flash-native-audio",
    name: "Gemini 2.5 Flash Native Audio",
    description: "Preview model for advanced audio generation tasks",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash (Experimental)",
    description: "Experimental Gemini 2.0 Flash with multimodal capabilities",
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
  {
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    description: "Preview model for advanced video generation tasks",
    contextWindow: 1048576,
  },
];

export const getGeminiModelById = (
  modelId: string
): GeminiModel | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
};
