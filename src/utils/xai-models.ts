export interface XAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const XAI_MODELS: XAIModel[] = [
  {
    id: "grok-beta",
    name: "Grok Beta",
    description: "Latest Grok beta with improved reasoning and real-time search",
    contextWindow: 131072,
  },
  {
    id: "grok-2-latest",
    name: "Grok 2 (Latest)",
    description: "Latest Grok 2 text model for advanced language understanding",
    contextWindow: 131072,
  },
  {
    id: "grok-2-vision-1212",
    name: "Grok 2 Vision",
    description: "Vision-enabled Grok 2 model for text and image inputs",
    contextWindow: 32768,
  },
  {
    id: "grok-vision-beta",
    name: "Grok Vision Beta",
    description: "Beta vision model with multimodal capabilities",
    contextWindow: 8192,
  },
];

export const getXAIModelById = (modelId: string): XAIModel | undefined => {
  return XAI_MODELS.find((model) => model.id === modelId);
}; 
