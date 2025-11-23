export interface XAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const XAI_MODELS: XAIModel[] = [
  {
    id: "grok-2-latest",
    name: "grok-2-latest",
    description: "Latest Grok 2 text model for advanced language understanding",
    contextWindow: 131072,
  },
  {
    id: "grok-2-vision-latest",
    name: "grok-2-vision-latest",
    description: "Vision-enabled Grok 2 model for text and image inputs",
    contextWindow: 131072,
  },
  {
    id: "grok-1.5",
    name: "grok-1.5",
    description: "Previous-generation Grok 1.5 compatibility model",
    contextWindow: 131072,
  },
];

export const getXAIModelById = (modelId: string): XAIModel | undefined => {
  return XAI_MODELS.find((model) => model.id === modelId);
}; 
