export interface XAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const XAI_MODELS: XAIModel[] = [
  {
    id: "grok-4.1-fast",
    name: "Grok 4.1 Fast",
    description: "Optimized for tool-calling and agentic reasoning in finance and support",
    contextWindow: 2000000,
  },
  {
    id: "grok-4.1-thinking",
    name: "Grok 4.1 Thinking",
    description: "Enhanced creative writing and emotional intelligence with reduced hallucinations",
    contextWindow: 2000000,
  },
  {
    id: "grok-4.1",
    name: "Grok 4.1",
    description: "Latest Grok with improved creative, emotional, and collaborative interactions",
    contextWindow: 2000000,
  },
  {
    id: "grok-4",
    name: "Grok 4",
    description: "Advanced reasoning model with improved capabilities",
    contextWindow: 131072,
  },
  {
    id: "grok-3",
    name: "Grok 3",
    description: "Previous generation Grok model",
    contextWindow: 131072,
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    description: "Lightweight version of Grok 3",
    contextWindow: 131072,
  },
  {
    id: "grok-2-latest",
    name: "Grok 2",
    description: "Grok 2 text model for advanced language understanding",
    contextWindow: 131072,
  },
  {
    id: "grok-2-vision-1212",
    name: "Grok 2 Vision",
    description: "Vision-enabled Grok 2 model for text and image inputs",
    contextWindow: 32768,
  },
  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast 1",
    description: "Specialized fast coding model",
    contextWindow: 131072,
  },
  {
    id: "grok-2-image",
    name: "Grok 2 Image",
    description: "Image generation model",
    contextWindow: 8192,
  },
];

export const getXAIModelById = (modelId: string): XAIModel | undefined => {
  return XAI_MODELS.find((model) => model.id === modelId);
}; 
